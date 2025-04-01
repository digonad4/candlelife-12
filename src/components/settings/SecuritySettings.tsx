
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Shield, KeyRound, AlertTriangle } from "lucide-react";

export const SecuritySettings = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Segurança</h2>
        <p className="text-muted-foreground">
          Gerencie suas configurações de segurança e privacidade.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
          <div className="flex items-start gap-3">
            <KeyRound className="w-5 h-5 mt-1 text-primary" />
            <div>
              <h3 className="font-medium">Senha</h3>
              <p className="text-sm text-muted-foreground">
                Altere sua senha para manter sua conta segura
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate("/change-password")}>
            Alterar senha
          </Button>
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 mt-1 text-primary" />
            <div>
              <h3 className="font-medium">Verificação em duas etapas</h3>
              <p className="text-sm text-muted-foreground">
                Adicione uma camada extra de segurança à sua conta
              </p>
            </div>
          </div>
          <Button variant="outline">Configurar</Button>
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 mt-1 text-primary" />
            <div>
              <h3 className="font-medium">Sessões ativas</h3>
              <p className="text-sm text-muted-foreground">
                Gerencie os dispositivos que estão conectados à sua conta
              </p>
            </div>
          </div>
          <Button variant="outline">Visualizar</Button>
        </div>
      </div>
    </div>
  );
};
