
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";

export interface FinancialGoal {
  id: string;
  user_id: string;
  goal_type: "expense_limit" | "savings_target" | "income_target" | "total_expense_limit";
  category?: string;
  amount: number;
  period: "monthly" | "yearly";
  start_date: string;
  end_date?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateGoalData {
  goal_type: FinancialGoal["goal_type"];
  category?: string;
  amount: number;
  period: "monthly" | "yearly";
  start_date: string;
  end_date?: string;
}

export function useGoals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ["financial-goals", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("financial_goals")
        .select("*")
        .eq("user_id", user.id)
        .eq("active", true)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as FinancialGoal[];
    },
    enabled: !!user,
  });

  const createGoal = useMutation({
    mutationFn: async (goalData: CreateGoalData) => {
      if (!user) throw new Error("User not authenticated");
      
      const { data, error } = await supabase
        .from("financial_goals")
        .insert({
          ...goalData,
          user_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-goals"] });
      toast({
        title: "Meta criada",
        description: "Sua meta financeira foi criada com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível criar a meta.",
        variant: "destructive",
      });
    },
  });

  const updateGoal = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FinancialGoal> & { id: string }) => {
      const { data, error } = await supabase
        .from("financial_goals")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-goals"] });
      toast({
        title: "Meta atualizada",
        description: "Sua meta foi atualizada com sucesso.",
      });
    },
  });

  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("financial_goals")
        .update({ active: false })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-goals"] });
      toast({
        title: "Meta removida",
        description: "A meta foi removida com sucesso.",
      });
    },
  });

  return {
    goals,
    isLoading,
    createGoal: createGoal.mutate,
    updateGoal: updateGoal.mutate,
    deleteGoal: deleteGoal.mutate,
    isCreating: createGoal.isPending,
    isUpdating: updateGoal.isPending,
    isDeleting: deleteGoal.isPending,
  };
}
