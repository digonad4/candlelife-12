
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppSidebar } from "@/components/AppSidebar";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Transaction } from "@/types/transaction";
import { DailyTransactionsList } from "@/components/transactions/DailyTransactionsList";
import { TransactionSummary } from "@/components/transactions/TransactionSummary";
import { EditTransactionDialog } from "@/components/transactions/EditTransactionDialog";
import { DeleteTransactionDialog } from "@/components/transactions/DeleteTransactionDialog";
import { ConfirmPaymentDialog } from "@/components/transactions/ConfirmPaymentDialog";
import { TransactionFilters } from "@/components/transactions/TransactionFilters";
import { useTransactions } from "@/components/transactions/useTransactions";

const Transactions = () => {
  const { user } = useAuth();
  
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isConfirmPaymentDialogOpen, setIsConfirmPaymentDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [transactionToConfirm, setTransactionToConfirm] = useState<Transaction | null>(null);
  const [dateRange, setDateRange] = useState("today");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const {
    days,
    isLoading,
    searchTerm,
    setSearchTerm,
    totalTransactions,
    totalIncome,
    totalExpenses,
    balance
  } = useTransactions(startDate, endDate);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write("<html><head><title>CandleLife Finanças</title>");
      printWindow.document.write(`
        <style>
          @media print {
            body {
              width: 58mm;
              font-family: monospace;
              font-size: 10px;
              line-height: 1.2;
              margin: 0;
              padding: 5mm;
            }
            h1 { font-size: 12px; text-align: center; margin-bottom: 5px; }
            h2 { font-size: 10px; margin: 5px 0; }
            p { margin: 2px 0; }
            .divider { border-top: 1px dashed #000; margin: 5px 0; }
            .totals { margin-top: 10px; }
          }
        </style>
      `);
      printWindow.document.write("</head><body>");
      printWindow.document.write("<h1>Extrato de Transações</h1>");
      printWindow.document.write(`<p>Usuário: ${user?.user_metadata?.username || "N/A"}</p>`);
      printWindow.document.write(`<p>Email: ${user?.email || "N/A"}</p>`);
      printWindow.document.write(`<p>Período: ${startDate?.toLocaleDateString("pt-BR")} a ${endDate?.toLocaleDateString("pt-BR")}</p>`);
      printWindow.document.write("<div class='divider'></div>");
      days.forEach(([date, transactions]) => {
        printWindow.document.write(``);
        transactions.forEach((t) => {
          printWindow.document.write(
            `<p>${t.description} ${t.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} (${t.type === "income" ? "R" : "D"})</p>`
          );
        });
        printWindow.document.write("<div class='divider'></div>");
      });
      printWindow.document.write("<div class='totals'>");
      printWindow.document.write(`<p>Total Transações: ${totalTransactions}</p>`);
      printWindow.document.write(`<p>Receitas: ${totalIncome.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>`);
      printWindow.document.write(`<p>Despesas: ${totalExpenses.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>`);
      printWindow.document.write(`<p>Saldo: ${balance.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>`);
      printWindow.document.write("</div>");
      printWindow.document.write("</body></html>");
      printWindow.document.close();
      printWindow.print();
    }
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedTransactions(newSelected);
  };

  const selectAll = () => {
    const allIds = new Set(
      days
        .flatMap(([, transactions]) => transactions)
        .filter((t) => t.payment_method !== "invoice" || t.payment_status === "confirmed")
        .map((t) => t.id)
    );
    setSelectedTransactions(allIds);
  };

  const deselectAll = () => {
    setSelectedTransactions(new Set());
  };

  const handleEdit = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsEditModalOpen(true);
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactionToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmTransaction = (transaction: Transaction) => {
    if (transaction.payment_method === "invoice") {
      return;
    }
    setTransactionToConfirm(transaction);
    setIsConfirmPaymentDialogOpen(true);
  };

  const openChat = (userId: string, userName: string, userAvatar?: string) => {
    window.dispatchEvent(
      new CustomEvent("open-chat", {
        detail: { userId, userName, userAvatar }
      })
    );
  };

  return (
    <div className="min-h-screen flex bg-background">
      <AppSidebar openChat={openChat} />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <h1 className="text-4xl font-bold text-foreground">Transações</h1>
          
          <TransactionFilters
            dateRange={dateRange}
            startDate={startDate}
            endDate={endDate}
            searchTerm={searchTerm}
            onDateRangeChange={setDateRange}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onSearchChange={setSearchTerm}
            onPrintExtract={handlePrint}
          />
          
          <Card className="rounded-xl border-border bg-card">
            <CardHeader>
              <CardTitle className="text-card-foreground">
                {searchTerm ? "Resultados da Pesquisa" : "Histórico de Transações"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-center text-muted-foreground">Carregando...</p>
              ) : days.length === 0 ? (
                <p className="text-muted-foreground">Nenhuma transação encontrada para o período selecionado.</p>
              ) : (
                <DailyTransactionsList
                  days={days}
                  selectedTransactions={selectedTransactions}
                  isLoading={isLoading}
                  onSelectTransaction={toggleSelection}
                  onSelectAll={selectAll}
                  onDeselectAll={deselectAll}
                  onEdit={handleEdit}
                  onDelete={handleDeleteTransaction}
                  onConfirmPayment={handleConfirmTransaction}
                  onConfirmSelected={() => setIsConfirmPaymentDialogOpen(true)}
                  onDeleteSelected={() => setIsDeleteDialogOpen(true)}
                />
              )}
            </CardContent>
          </Card>
          
          <TransactionSummary
            totalTransactions={totalTransactions}
            totalIncome={totalIncome}
            totalExpenses={totalExpenses}
            balance={balance}
          />
        </div>
      </main>

      {/* Dialog components */}
      <EditTransactionDialog
        isOpen={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        transaction={selectedTransaction}
        userId={user?.id}
      />

      <DeleteTransactionDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        transactionId={transactionToDelete}
        userId={user?.id}
        selectedTransactions={selectedTransactions}
        isBulkDelete={!transactionToDelete}
      />

      <ConfirmPaymentDialog
        open={isConfirmPaymentDialogOpen}
        onOpenChange={setIsConfirmPaymentDialogOpen}
        transaction={transactionToConfirm}
        userId={user?.id}
        selectedTransactions={selectedTransactions}
        isBulkConfirm={!transactionToConfirm}
      />
    </div>
  );
};

export default Transactions;
