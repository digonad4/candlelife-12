
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const SecuritySettings = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Segurança</h2>
        <p className="text-muted-foreground">
          Gerencie suas configurações de segurança.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center p-4 border rounded-lg">
          <div>
            <h3 className="font-medium">Senha</h3>
            <p className="text-sm text-muted-foreground">
              Altere sua senha para manter sua conta segura
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/change-password")}>
            Alterar senha
          </Button>
        </div>
      </div>
    </div>
  );
};
