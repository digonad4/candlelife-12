
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useGoals } from "@/hooks/useGoals";
import { useGoalProgress } from "@/hooks/useGoalProgress";
import { GoalCard } from "./GoalCard";
import { GoalForm } from "./GoalForm";
import { Plus, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function GoalsManager() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [creationProgress, setCreationProgress] = useState(0);
  
  const { goals, createGoal, updateGoal, deleteGoal, isCreating, isUpdating } = useGoals();
  const goalProgress = useGoalProgress(goals);

  const handleCreateGoal = (data: any) => {
    console.log("🎯 Criando nova meta:", data);
    
    // Simular progresso de criação
    setCreationProgress(10);
    
    try {
      createGoal(data);
      
      // Simular progresso
      setTimeout(() => setCreationProgress(50), 300);
      setTimeout(() => setCreationProgress(80), 600);
      setTimeout(() => {
        setCreationProgress(100);
        setIsDialogOpen(false);
        setCreationProgress(0);
      }, 900);
      
    } catch (error) {
      console.error("❌ Erro ao criar meta:", error);
      setCreationProgress(0);
    }
  };

  const handleEditGoal = (goal: any) => {
    setEditingGoal(goal);
    setIsDialogOpen(true);
  };

  const handleUpdateGoal = (data: any) => {
    if (editingGoal) {
      console.log("📝 Atualizando meta:", { ...data, id: editingGoal.id });
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
    setCreationProgress(0);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingGoal(null);
    setCreationProgress(0);
  };

  // Calcular progresso geral das metas
  const overallProgress = goals.length > 0 
    ? goalProgress.reduce((sum, progress) => sum + Math.min(progress.percentage, 100), 0) / goals.length
    : 0;

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
        <div className="space-y-2">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Target className="h-5 w-5" />
            Suas Metas Financeiras
          </h2>
          
          {/* Barra de progresso geral */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progresso geral das metas</span>
              <span className="font-medium">{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="h-2 w-64" />
          </div>
        </div>
        
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

      <Dialog open={isDialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingGoal ? "Editar Meta" : "Criar Nova Meta"}
            </DialogTitle>
          </DialogHeader>
          
          {/* Progress bar for creation */}
          {!editingGoal && creationProgress > 0 && (
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span>Criando meta...</span>
                <span>{creationProgress}%</span>
              </div>
              <Progress value={creationProgress} className="h-2" />
            </div>
          )}
          
          <GoalForm
            goal={editingGoal}
            onSubmit={editingGoal ? handleUpdateGoal : handleCreateGoal}
            onCancel={closeDialog}
            isLoading={isCreating || isUpdating}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
