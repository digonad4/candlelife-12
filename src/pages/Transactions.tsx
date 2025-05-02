
import { useEffect } from "react";
import { TransactionsContent } from "@/components/transactions/TransactionsContent";
import { TransactionsHeader } from "@/components/transactions/TransactionsHeader";
import { useTransactionsPage } from "@/hooks/useTransactionsPage";
import { BackButton } from "@/components/navigation/BackButton";

const Transactions = () => {
  const {
    dateRange,
    startDate,
    endDate,
    searchTerm,
    days,
    selectedTransactions,
    isLoading,
    setDateRange,
    setStartDate,
    setEndDate,
    setSearchTerm,
    toggleSelection,
    selectAll,
    deselectAll
  } = useTransactionsPage();

  useEffect(() => {
    // Optional: Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="w-full flex flex-col gap-6">
      <BackButton />
      
      <TransactionsHeader
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        selectedTransactions={selectedTransactions}
        onClearSelection={deselectAll}
        onSelectAll={selectAll}
      />

      <TransactionsContent
        dateRange={dateRange}
        startDate={startDate}
        endDate={endDate}
        searchTerm={searchTerm}
        days={days}
        selectedTransactions={selectedTransactions}
        isLoading={isLoading}
        onSelectionChange={toggleSelection}
      />
    </div>
  );
};

export default Transactions;
