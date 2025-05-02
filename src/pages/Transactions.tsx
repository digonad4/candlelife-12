
import { useEffect } from "react";
import { TransactionsContent } from "@/components/transactions/TransactionsContent";
import { TransactionsHeader } from "@/components/transactions/TransactionsHeader";
import { useTransactionsPage } from "@/hooks/useTransactionsPage";
import { BackButton } from "@/components/navigation/BackButton";

const Transactions = () => {
  const {
    selectedIds,
    dateRange,
    searchQuery,
    onlyPending,
    startDate,
    endDate,
    isBulkActionMenuOpen,
    handleDateRangeChange,
    handleSearchChange,
    handlePendingFilterChange,
    handleStartDateChange,
    handleEndDateChange,
    handleBulkActionMenuToggle,
    handleSelection,
    handleClearSelection,
  } = useTransactionsPage();

  useEffect(() => {
    // Optional: Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="w-full flex flex-col gap-6">
      <BackButton />
      
      <TransactionsHeader
        selectedIds={selectedIds}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
        onlyPending={onlyPending}
        onPendingFilterChange={handlePendingFilterChange}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={handleStartDateChange}
        onEndDateChange={handleEndDateChange}
        isBulkActionMenuOpen={isBulkActionMenuOpen}
        onBulkActionMenuToggle={handleBulkActionMenuToggle}
        onClearSelection={handleClearSelection}
      />

      <TransactionsContent
        selectedIds={selectedIds}
        onSelectionChange={handleSelection}
        searchQuery={searchQuery}
        dateRange={dateRange}
        onlyPending={onlyPending}
        startDate={startDate}
        endDate={endDate}
        isBulkActionMenuOpen={isBulkActionMenuOpen}
      />
    </div>
  );
};

export default Transactions;
