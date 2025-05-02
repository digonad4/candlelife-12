
import InvoicedSummary from "@/components/invoiced/InvoicedSummary";
import { BackButton } from "@/components/navigation/BackButton";

const InvoicedTransactions = () => {
  return (
    <div className="w-full space-y-6">
      <BackButton />
      <h1 className="text-3xl font-bold mb-6">Transações Faturadas</h1>
      <InvoicedSummary />
    </div>
  );
};

export default InvoicedTransactions;
