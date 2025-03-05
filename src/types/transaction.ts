
export interface Transaction {
  id: string;
  date: string;
  description: string;
  type: "income" | "expense";
  amount: number;
  payment_status: "pending" | "confirmed";
  payment_method: string;
  client?: { name: string };
}

export interface DateRange {
  start: string;
  end: string;
}
