
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useGoals } from "@/hooks/useGoals";
import { useGoalProgress } from "@/hooks/useGoalProgress";
import { GoalCard } from "./GoalCard";
import { GoalForm } from "./GoalForm";
import { Plus, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function GoalsManager() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  
  const { goals, createGoal, updateGoal, deleteGoal, isCreating } = useGoals();
  const goalProgress = useGoalProgress(goals);

  const handleCreateGoal = (data: any) => {
    createGoal(data);
    setIsDialogOpen(false);
  };

  const handleEditGoal = (goal: any) => {
    setEditingGoal(goal);
    setIsDialogOpen(true);
  };

  const handleUpdateGoal = (data: any) => {
    if (editingGoal) {
      updateGoal({ ...data, id: editingGoal.id });
      setEditingGoal(null);
      setIsDialogOpen(false);
    }
  };

  const handleDeleteGoal = (goalId: string) => {
    if (confirm("Tem certeza que deseja remover esta meta?")) {
      deleteGoal(goalId);
    }
  };

  const openCreateDialog = () => {
    setEditingGoal(null);
    setIsDialogOpen(true);
  };

  if (goals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Metas Financeiras
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
              <Target className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-medium">Nenhuma meta definida</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Defina metas financeiras para acompanhar seu progresso
              </p>
            </div>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Criar primeira meta
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Target className="h-5 w-5" />
          Suas Metas Financeiras
        </h2>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Meta
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {goalProgress.map((progress) => (
          <GoalCard
            key={progress.goal.id}
            progress={progress}
            onEdit={() => handleEditGoal(progress.goal)}
            onDelete={() => handleDeleteGoal(progress.goal.id)}
          />
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingGoal ? "Editar Meta" : "Criar Nova Meta"}
            </DialogTitle>
          </DialogHeader>
          <GoalForm
            goal={editingGoal}
            onSubmit={editingGoal ? handleUpdateGoal : handleCreateGoal}
            onCancel={() => setIsDialogOpen(false)}
            isLoading={isCreating}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
