
import ExpensesManagement from "@/components/ExpensesManagement";
import { BackButton } from "@/components/navigation/BackButton";

const Expenses = () => {
  return (
    <div className="w-full space-y-6">
      <BackButton />
      <ExpensesManagement />
    </div>
  );
};

export default Expenses;
