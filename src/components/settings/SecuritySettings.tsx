
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Shield, KeyRound, AlertTriangle, LucideIcon } from "lucide-react";
import { SessionsManager } from "./SessionsManager";
import { TwoFactorManager } from "./TwoFactorManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const SecuritySettings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  type SecurityOptionProps = {
    icon: LucideIcon;
    title: string;
    description: string;
    action: string;
    onClick: () => void;
  };

  const SecurityOption = ({ icon: Icon, title, description, action, onClick }: SecurityOptionProps) => (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 mt-1 text-primary" />
        <div>
          <h3 className="font-medium">{title}</h3>
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      <Button variant="outline" onClick={onClick}>
        {action}
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="sessions">Sessões Ativas</TabsTrigger>
          <TabsTrigger value="2fa">Verificação em Duas Etapas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold mb-4">Segurança</h2>
            <p className="text-muted-foreground">
              Gerencie suas configurações de segurança e privacidade.
            </p>
          </div>

          <div className="space-y-4">
            <SecurityOption
              icon={KeyRound}
              title="Senha"
              description="Altere sua senha para manter sua conta segura"
              action="Alterar senha"
              onClick={() => navigate("/change-password")}
            />

            <SecurityOption
              icon={Shield}
              title="Verificação em duas etapas"
              description="Adicione uma camada extra de segurança à sua conta"
              action="Configurar"
              onClick={() => setActiveTab("2fa")}
            />

            <SecurityOption
              icon={AlertTriangle}
              title="Sessões ativas"
              description="Gerencie os dispositivos que estão conectados à sua conta"
              action="Visualizar"
              onClick={() => setActiveTab("sessions")}
            />
          </div>
        </TabsContent>

        <TabsContent value="sessions">
          <SessionsManager />
        </TabsContent>

        <TabsContent value="2fa">
          <TwoFactorManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};
