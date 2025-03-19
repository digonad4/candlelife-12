import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Transaction } from "@/types/transaction";
import { FinancialSummary } from "./transactions/FinancialSummary";
import { TransactionList } from "./transactions/TransactionList";
import { ConfirmPaymentsDialog } from "./transactions/ConfirmPaymentsDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowUp, ArrowDown } from "lucide-react";

interface RecentTransactionsProps {
  startDate?: Date;
  endDate?: Date;
}

const RecentTransactions = ({ startDate, endDate }: RecentTransactionsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "table">("list"); // Padrão é "list"

  const formattedStartDate = startDate
    ? format(startDate, "yyyy-MM-dd'T00:00:00.000Z'")
    : format(new Date(), "yyyy-MM-dd'T00:00:00.000Z'");
  const formattedEndDate = endDate
    ? format(endDate, "yyyy-MM-dd'T23:59:59.999Z'")
    : format(new Date(), "yyyy-MM-dd'T23:59:59.999Z'");

  // Carregar a preferência do usuário ao iniciar
  useEffect(() => {
    const fetchViewMode = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("view_mode")
        .eq("id", user.id)
        .single();
      if (error) {
        console.error("Erro ao carregar view_mode:", error);
        return;
      }
      if (data && data.view_mode) {
        setViewMode(data.view_mode as "list" | "table");
      }
    };
    fetchViewMode();
  }, [user]);

  // Salvar a preferência do usuário
  const saveViewMode = async (newMode: "list" | "table") => {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ view_mode: newMode })
      .eq("id", user.id);
    if (error) {
      toast({
        title: "Erro",
        description: "Falha ao salvar preferência de visualização.",
        variant: "destructive",
      });
      console.error("Erro ao salvar view_mode:", error);
    }
  };

  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ["recent-transactions", user?.id, formattedStartDate, formattedEndDate],
    queryFn: async () => {
      if (!user || !formattedStartDate || !formattedEndDate) return [];
      const { data, error } = await supabase
        .from("transactions")
        .select("*, client:clients(name)")
        .eq("user_id", user.id)
        .gte("date", formattedStartDate)
        .lte("date", formattedEndDate)
        .order("payment_status", { ascending: false })
        .order("date", { ascending: false });
      if (error) throw error;
      return (data as Transaction[]) || [];
    },
    enabled: !!user && !!formattedStartDate && !!formattedEndDate,
  });

  const handleConfirmPayments = async () => {
    if (selectedTransactions.length === 0) return;
    try {
      await supabase
        .from("transactions")
        .update({ payment_status: "confirmed" })
        .in("id", selectedTransactions)
        .eq("user_id", user.id);
      toast({ title: "Pagamentos Confirmados", description: "Os pagamentos foram atualizados." });
      queryClient.invalidateQueries({ queryKey: ["recent-transactions"] });
      setSelectedTransactions([]);
      setIsConfirmDialogOpen(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao confirmar pagamentos.",
        variant: "destructive",
      });
    }
  };

  const handleSelectTransaction = (id: string, isPending: boolean) => {
    if (!isPending) return;
    setSelectedTransactions((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleOpenConfirmDialog = (ids?: string[]) => {
    if (ids) {
      setSelectedTransactions(ids);
    }
    if (selectedTransactions.length > 0 || (ids && ids.length > 0)) {
      setIsConfirmDialogOpen(true);
    }
  };

  const handleSelectAllPending = () => {
    const pendingTransactions = (transactions || []).filter(
      (t) => t.payment_status === "pending"
    );
    const pendingIds = pendingTransactions.map((t) => t.id);
    setSelectedTransactions(pendingIds);
  };

  const handleClearSelection = () => {
    setSelectedTransactions([]);
  };

  const handleToggleViewMode = () => {
    const newMode = viewMode === "list" ? "table" : "list";
    setViewMode(newMode);
    saveViewMode(newMode);
  };

  const filteredTransactions = (transactions || []).filter((transaction) => {
    const clientName = transaction.client?.name || "";
    return (
      clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.amount.toString().includes(searchTerm)
    );
  });

  return (
    <Card className="rounded-xl border-border bg-card text-card-foreground">
      <CardHeader>
        <CardTitle>Transações</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-between items-center">
          <Input
            type="text"
            placeholder="Pesquisar transações..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4 w-1/2"
          />
          <Button variant="outline" onClick={handleToggleViewMode}>
            {viewMode === "list" ? "Ver como Tabela" : "Ver como Lista"}
          </Button>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAllPending}
                disabled={isLoading || !transactions?.some((t) => t.payment_status === "pending")}
              >
                Selecionar Pendentes
              </Button>
              {selectedTransactions.length > 0 && (
                <>
                  <Button variant="outline" size="sm" onClick={handleClearSelection}>
                    Limpar Seleção
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleOpenConfirmDialog()}
                  >
                    Confirmar Selecionados ({selectedTransactions.length})
                  </Button>
                </>
              )}
            </div>
          </div>

          {viewMode === "list" ? (
            <TransactionList
              transactions={filteredTransactions}
              isLoading={isLoading}
              selectedTransactions={selectedTransactions}
              onSelectTransaction={handleSelectTransaction}
              onOpenConfirmDialog={handleOpenConfirmDialog}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      Nenhuma transação encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedTransactions.includes(transaction.id)}
                          onCheckedChange={() =>
                            handleSelectTransaction(
                              transaction.id,
                              transaction.payment_status === "pending"
                            )
                          }
                          disabled={transaction.payment_status !== "pending"}
                        />
                      </TableCell>
                      <TableCell>
                        {transaction.amount >= 0 ? (
                          <ArrowUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <ArrowDown className="h-4 w-4 text-red-500" />
                        )}
                      </TableCell>
                      <TableCell>{transaction.client?.name || "-"}</TableCell>
                      <TableCell>{transaction.description || "-"}</TableCell>
                      <TableCell>
                        {format(new Date(transaction.date), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        {transaction.payment_status === "pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenConfirmDialog([transaction.id])}
                          >
                            Confirmar
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            transaction.payment_status === "pending"
                              ? "text-yellow-500"
                              : "text-green-500"
                          }
                        >
                          {transaction.payment_status === "pending" ? "Pendente" : "Confirmado"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {transaction.amount.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>

        <FinancialSummary transactions={filteredTransactions} />
      </CardContent>

      <ConfirmPaymentsDialog
        open={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
        onConfirm={handleConfirmPayments}
        count={selectedTransactions.length}
      />
    </Card>
  );
};

export default RecentTransactions;