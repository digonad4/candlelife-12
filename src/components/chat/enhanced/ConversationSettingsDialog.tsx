
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useEnhancedMessages, ConversationSettings } from "@/hooks/useEnhancedMessages";
import { useToast } from "@/hooks/use-toast";
import { Save, Bell, Archive, Pin, VolumeX, Image } from "lucide-react";

interface ConversationSettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  recipientId: string;
  recipientName: string;
  currentSettings?: ConversationSettings | null;
}

export const ConversationSettingsDialog = ({
  isOpen,
  onOpenChange,
  recipientId,
  recipientName,
  currentSettings
}: ConversationSettingsDialogProps) => {
  const { toast } = useToast();
  const { useUpdateConversationSettings } = useEnhancedMessages();
  const updateSettings = useUpdateConversationSettings();
  
  const [settings, setSettings] = useState({
    notifications_enabled: currentSettings?.notifications_enabled ?? true,
    archived: currentSettings?.archived ?? false,
    pinned: currentSettings?.pinned ?? false,
    muted: currentSettings?.muted ?? false,
    nickname: currentSettings?.nickname ?? "",
    background_image: currentSettings?.background_image ?? ""
  });

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        otherUserId: recipientId,
        settings
      });
      
      toast({
        title: "Configurações salvas",
        description: "As configurações da conversa foram atualizadas"
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações",
        variant: "destructive"
      });
    }
  };

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Configurações da conversa
            <span className="text-sm font-normal text-muted-foreground">
              com {recipientName}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Nickname */}
          <div className="space-y-2">
            <Label htmlFor="nickname">Apelido personalizado</Label>
            <Input
              id="nickname"
              placeholder={`Digite um apelido para ${recipientName}`}
              value={settings.nickname}
              onChange={(e) => handleSettingChange('nickname', e.target.value)}
            />
          </div>

          {/* Notification Settings */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Notificações</h4>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <Label htmlFor="notifications">Receber notificações</Label>
              </div>
              <Switch
                id="notifications"
                checked={settings.notifications_enabled}
                onCheckedChange={(value) => handleSettingChange('notifications_enabled', value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <VolumeX className="h-4 w-4" />
                <Label htmlFor="muted">Silenciar conversa</Label>
              </div>
              <Switch
                id="muted"
                checked={settings.muted}
                onCheckedChange={(value) => handleSettingChange('muted', value)}
              />
            </div>
          </div>

          {/* Organization */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Organização</h4>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pin className="h-4 w-4" />
                <Label htmlFor="pinned">Fixar conversa</Label>
              </div>
              <Switch
                id="pinned"
                checked={settings.pinned}
                onCheckedChange={(value) => handleSettingChange('pinned', value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Archive className="h-4 w-4" />
                <Label htmlFor="archived">Arquivar conversa</Label>
              </div>
              <Switch
                id="archived"
                checked={settings.archived}
                onCheckedChange={(value) => handleSettingChange('archived', value)}
              />
            </div>
          </div>

          {/* Background */}
          <div className="space-y-2">
            <Label htmlFor="background">URL do plano de fundo</Label>
            <div className="flex gap-2">
              <div className="flex items-center gap-2 flex-1">
                <Image className="h-4 w-4" />
                <Input
                  id="background"
                  placeholder="https://exemplo.com/imagem.jpg"
                  value={settings.background_image}
                  onChange={(e) => handleSettingChange('background_image', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={updateSettings.isPending}>
            <Save className="h-4 w-4 mr-2" />
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
