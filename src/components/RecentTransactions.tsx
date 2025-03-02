
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { useToast } from "@/components/ui/use-toast";
import { ArrowUpIcon, ArrowDownIcon, CheckCircle2, Calendar, CreditCard } from "lucide-react";
import { format, parseISO, differenceInMonths, subDays, subWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

interface Transaction {
  id: string;
  date: string;
  description: string;
  type: "income" | "expense";
  amount: number;
  payment_status: "pending" | "confirmed";
  payment_method: string;
  client?: { name: string };
}

interface DateRange {
  start: string;
  end: string;
}

interface RecentTransactionsProps {
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange) => void;
}

const RecentTransactions = ({ dateRange, onDateRangeChange }: RecentTransactionsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const today = format(new Date(), "yyyy-MM-dd");
  const [localDateRange, setLocalDateRange] = useState<DateRange>(
    dateRange || { start: today, end: today }
  );
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Use either prop dateRange or local state
  const effectiveDateRange = dateRange || localDateRange;

  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ["recent-transactions", user?.id, effectiveDateRange],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("transactions")
        .select("*, client:clients(name)")
        .eq("user_id", user.id)
        .gte("date", `${effectiveDateRange.start}T00:00:00.000Z`)
        .lte("date", `${effectiveDateRange.end}T23:59:59.999Z`)
        .order("payment_status", { ascending: false })
        .order("date", { ascending: false });
      if (error) throw error;
      return (data as Transaction[]) || [];
    },
    enabled: !!user,
  });

  const totals = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return {
        totalDinheiro: 0,
        totalPix: 0,
        totalFaturado: 0,
        totalLucros: 0,
        totalGastos: 0,
        totalPendentes: 0,
        totalAcumulado: 0,
      };
    }

    const totalDinheiro = transactions
      .filter((t) => t.payment_method === "cash" && t.payment_status === "confirmed" && t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalPix = transactions
      .filter((t) => t.payment_method === "pix" && t.payment_status === "confirmed" && t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalFaturado = transactions
      .filter((t) => t.payment_method === "invoice" && t.payment_status === "confirmed" && t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalLucros = transactions
      .filter((t) => t.type === "income" && t.payment_status === "confirmed")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalGastos = transactions
      .filter((t) => t.type === "expense" && t.payment_status === "confirmed")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalPendentes = transactions
      .filter((t) => t.payment_status === "pending" && t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalAcumulado = totalLucros + totalGastos;

    return {
      totalDinheiro,
      totalPix,
      totalFaturado,
      totalLucros,
      totalGastos,
      totalPendentes,
      totalAcumulado,
    };
  }, [transactions]);

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

  const handleRangeSelect = (range: { from: Date; to: Date } | undefined) => {
    if (!range || !range.from || !range.to) return;

    const start = parseISO(format(range.from, "yyyy-MM-dd"));
    const end = parseISO(format(range.to, "yyyy-MM-dd"));

    if (differenceInMonths(end, start) > 2) {
      toast({
        title: "Erro",
        description: "O período não pode exceder 2 meses.",
        variant: "destructive",
      });
      return;
    }

    const newRange = {
      start: format(range.from, "yyyy-MM-dd"),
      end: format(range.to, "yyyy-MM-dd"),
    };
    
    if (onDateRangeChange) {
      onDateRangeChange(newRange);
    } else {
      setLocalDateRange(newRange);
    }
    
    setSelectedTransactions([]);
    setIsCalendarOpen(false);
  };

  const setYesterday = () => {
    const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
    const newRange = { start: yesterday, end: yesterday };
    
    if (onDateRangeChange) {
      onDateRangeChange(newRange);
    } else {
      setLocalDateRange(newRange);
    }
    
    setSelectedTransactions([]);
  };

  const setLastWeek = () => {
    const end = format(new Date(), "yyyy-MM-dd");
    const start = format(subWeeks(new Date(), 1), "yyyy-MM-dd");
    const newRange = { start, end };
    
    if (onDateRangeChange) {
      onDateRangeChange(newRange);
    } else {
      setLocalDateRange(newRange);
    }
    
    setSelectedTransactions([]);
  };

  const setLast15Days = () => {
    const end = format(new Date(), "yyyy-MM-dd");
    const start = format(subDays(new Date(), 14), "yyyy-MM-dd");
    const newRange = { start, end };
    
    if (onDateRangeChange) {
      onDateRangeChange(newRange);
    } else {
      setLocalDateRange(newRange);
    }
    
    setSelectedTransactions([]);
  };

  return (
    <Card className="rounded-xl border-border bg-card text-card-foreground">
      <CardHeader>
        <CardTitle>Resumo Financeiro</CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Período: {effectiveDateRange.start === effectiveDateRange.end
            ? format(parseISO(effectiveDateRange.start), "dd/MM/yyyy", { locale: ptBR })
            : `${format(parseISO(effectiveDateRange.start), "dd/MM/yyyy", { locale: ptBR })} a ${format(
                parseISO(effectiveDateRange.end),
                "dd/MM/yyyy",
                { locale: ptBR }
              )}`}
        </p>
      </CardHeader>
      <CardContent>
        {/* Opções de Período e Calendário em uma Linha */}
        <div className="mb-6 flex flex-wrap justify-center items-center gap-2 sm:gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={setYesterday}
            className="border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700 text-sm py-1 px-2"
          >
            Ontem
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={setLastWeek}
            className="border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700 text-sm py-1 px-2"
          >
            Última Semana
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={setLast15Days}
            className="border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700 text-sm py-1 px-2"
          >
            Últimos 15 Dias
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
            className="border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700 text-sm py-1 px-2"
          >
            Calendário
          </Button>
          {isCalendarOpen && (
            <div className="absolute z-10 mt-40 p-4 bg-muted border border-gray-200 rounded-lg shadow-lg dark:bg-gray-800 dark:border-gray-700">
              <DayPicker
                mode="range"
                selected={{ from: parseISO(effectiveDateRange.start), to: parseISO(effectiveDateRange.end) }}
                onSelect={handleRangeSelect}
                locale={ptBR}
                className="rounded-lg"
                modifiers={{
                  disabled: (date: Date) => differenceInMonths(date, new Date()) > 2,
                }}
                styles={{
                  head: { 
                    background: "#e5e7eb", 
                    borderRadius: "8px 8px 0 0",
                    color: "#1f2937" // Cinza escuro para texto
                  },
                  day: { borderRadius: "4px" },
                  table: { background: "transparent" },
                }}
                classNames={{
                  tbody: "bg-green-100 text-green-900 dark:bg-green-700 dark:text-green-100",
                  caption: "text-lg font-medium text-gray-800 dark:text-gray-200",
                  nav_button: "text-gray-600 hover:text-green-600 dark:text-gray-300 dark:hover:text-green-400",
                  cell: "text-gray-800 dark:text-gray-200", // Texto dos dias
                }}
                footer={
                  <Button
                    variant="ghost"
                    onClick={() => setIsCalendarOpen(false)}
                    className="mt-2 w-full text-sm text-gray-600 hover:text-green-600 dark:text-gray-300 dark:hover:text-green-400"
                  >
                    Fechar
                  </Button>
                }
              />
            </div>
          )}
        </div>

        {/* Resumo Financeiro como Lista */}
        <div className="mb-8">
          <div className="p-4 bg-muted rounded-lg shadow-sm dark:bg-gray-800">
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between items-center">
                <span className="text-muted-foreground dark:text-gray-400">Receitas em Dinheiro</span>
                <span className="font-medium text-green-600 dark:text-green-400">R$ {totals.totalDinheiro.toFixed(2)}</span>
              </li>
              <li className="flex justify-between items-center">
                <span className="text-muted-foreground dark:text-gray-400">Receitas em Pix</span>
                <span className="font-medium text-green-600 dark:text-green-400">R$ {totals.totalPix.toFixed(2)}</span>
              </li>
              <li className="flex justify-between items-center">
                <span className="text-muted-foreground dark:text-gray-400">Receitas Faturadas</span>
                <span className="font-medium text-green-600 dark:text-green-400">R$ {totals.totalFaturado.toFixed(2)}</span>
              </li>
              <li className="flex justify-between items-center">
                <span className="text-muted-foreground dark:text-gray-400">Receitas Pendentes</span>
                <span className="font-medium text-yellow-600 dark:text-yellow-400">R$ {totals.totalPendentes.toFixed(2)}</span>
              </li>
              <li className="flex justify-between items-center">
                <span className="text-muted-foreground dark:text-gray-400">Total de Lucros</span>
                <span className="font-medium text-green-600 dark:text-green-400">R$ {totals.totalLucros.toFixed(2)}</span>
              </li>
              <li className="flex justify-between items-center">
                <span className="text-muted-foreground dark:text-gray-400">Total de Gastos</span>
                <span className="font-medium text-red-600 dark:text-red-400">R$ {totals.totalGastos.toFixed(2)}</span>
              </li>
              <li className="flex justify-between items-center pt-2 border-t border-gray-300 dark:border-gray-600">
                <span className="text-muted-foreground font-semibold dark:text-gray-300">Total Acumulado</span>
                <span
                  className={`text-lg font-semibold ${
                    totals.totalAcumulado >= 0 ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"
                  }`}
                >
                  R$ {totals.totalAcumulado.toFixed(2)}
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Lista de Transações */}
        {isLoading ? (
          <p className="text-muted-foreground dark:text-gray-400">Carregando...</p>
        ) : transactions?.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 dark:text-gray-400">
            Nenhuma transação para o período selecionado.
          </p>
        ) : (
          <>
            {selectedTransactions.length > 0 && (
              <Button
                onClick={() => setIsConfirmDialogOpen(true)}
                className="mb-4 bg-green-600 hover:bg-green-700 text-sm py-1 px-3 dark:bg-green-500 dark:hover:bg-green-600"
              >
                Confirmar {selectedTransactions.length} Pagamento(s)
              </Button>
            )}
            <div className="space-y-2">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-card border border-border hover:bg-accent/20 transition-colors dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
                >
                  <div className="flex gap-2 items-center">
                    {transaction.payment_status === "pending" && (
                      <Checkbox
                        checked={selectedTransactions.includes(transaction.id)}
                        onCheckedChange={() =>
                          handleSelectTransaction(transaction.id, transaction.payment_status === "pending")
                        }
                      />
                    )}
                    <div
                      className={`p-1 rounded-full ${
                        transaction.type === "income"
                          ? "bg-green-500/20 text-green-500 dark:bg-green-500/30 dark:text-green-400"
                          : "bg-red-500/20 text-red-500 dark:bg-red-500/30 dark:text-red-400"
                      }`}
                    >
                      {transaction.type === "income" ? (
                        <ArrowUpIcon className="w-4 h-4" />
                      ) : (
                        <ArrowDownIcon className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-card-foreground dark:text-gray-200">{transaction.description}</p>
                      <p className="text-xs text-muted-foreground dark:text-gray-400">
                        <Calendar className="inline w-3 h-3 mr-1" />
                        {format(parseISO(transaction.date), "dd/MM/yyyy HH:mm", { locale: ptBR })} -{" "}
                        {transaction.payment_status === "pending" ? "Pendente" : "Confirmada"} -{" "}
                        <CreditCard className="inline w-3 h-3 mr-1" />
                        {transaction.payment_method === "cash"
                          ? "Dinheiro"
                          : transaction.payment_method === "pix"
                          ? "Pix"
                          : "Faturado"}
                      </p>
                      {transaction.client?.name && (
                        <p className="text-xs text-muted-foreground dark:text-gray-400">Cliente: {transaction.client.name}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p
                      className={`text-sm font-medium ${
                        transaction.amount >= 0 ? "text-green-500 dark:text-green-400" : "text-red-500 dark:text-red-400"
                      }`}
                    >
                      R$ {transaction.amount.toFixed(2)}
                    </p>
                    {transaction.payment_status === "pending" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedTransactions([transaction.id]);
                          setIsConfirmDialogOpen(true);
                        }}
                        className="text-yellow-500 hover:text-yellow-600 dark:text-yellow-400 dark:hover:text-yellow-300 w-6 h-6"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>

      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent className="bg-card dark:bg-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-card-foreground dark:text-gray-200">
              Confirmar Pagamento(s)
            </AlertDialogTitle>
            <AlertDialogDescription className="dark:text-gray-400">
              Deseja confirmar o recebimento de {selectedTransactions.length} pagamento(s)?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:text-gray-200 dark:hover:bg-gray-700">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmPayments}
              className="bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
            >
              Confirmar Pagamento(s)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default RecentTransactions;
