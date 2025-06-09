
import { Separator } from "@/components/ui/separator";
import { NotificationSoundSettings } from "@/components/settings/NotificationSoundSettings";
import { MainMenu } from "@/components/navigation/MainMenu";

const Settings = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Configurações</h1>
          <MainMenu />
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Seção de Sons */}
          <div>
            <h2 className="text-lg font-semibold mb-1">Sons e Notificações</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Configure como você deseja receber notificações sonoras
            </p>
            <NotificationSoundSettings />
          </div>

          <Separator />

          {/* Outras configurações podem ser adicionadas aqui */}
          <div>
            <h2 className="text-lg font-semibold mb-1">Outras Configurações</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Mais opções de configuração serão adicionadas em breve
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
