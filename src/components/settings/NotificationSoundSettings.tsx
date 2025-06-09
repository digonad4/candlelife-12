
import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Upload, Play, Volume2, VolumeX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { advancedNotificationSoundService } from '@/services/advancedNotificationSound';

export const NotificationSoundSettings = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEnabled, setIsEnabled] = useState(advancedNotificationSoundService.isAudioEnabled());
  const [currentSoundType, setCurrentSoundType] = useState(advancedNotificationSoundService.getCurrentSoundType());
  const [hasCustomSound, setHasCustomSound] = useState(advancedNotificationSoundService.hasCustomSound());
  const [isUploading, setIsUploading] = useState(false);

  const handleSoundToggle = (enabled: boolean) => {
    setIsEnabled(enabled);
    advancedNotificationSoundService.setEnabled(enabled);
    
    toast({
      title: enabled ? "Sons ativados" : "Sons desativados",
      description: enabled ? "Você receberá sons nas notificações" : "Os sons estão silenciados",
    });
  };

  const handleSoundTypeChange = (type: 'beep' | 'chime' | 'bell' | 'custom') => {
    setCurrentSoundType(type);
    advancedNotificationSoundService.setSoundType(type);
    
    toast({
      title: "Som alterado",
      description: `Som de notificação alterado para: ${getSoundTypeLabel(type)}`,
    });
  };

  const getSoundTypeLabel = (type: string) => {
    switch (type) {
      case 'beep': return 'Bip';
      case 'chime': return 'Carrilhão';
      case 'bell': return 'Sino';
      case 'custom': return 'Personalizado';
      default: return type;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    try {
      await advancedNotificationSoundService.setCustomSound(file);
      setHasCustomSound(true);
      setCurrentSoundType('custom');
      
      toast({
        title: "Som personalizado enviado",
        description: "Seu som personalizado foi configurado com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro no upload",
        description: error instanceof Error ? error.message : "Erro ao enviar o arquivo",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleTestSound = async (type?: 'beep' | 'chime' | 'bell' | 'custom') => {
    try {
      await advancedNotificationSoundService.testSound(type);
      toast({
        title: "Som testado",
        description: `Reproduzindo: ${getSoundTypeLabel(type || currentSoundType)}`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível reproduzir o som",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          Sons de Notificação
        </CardTitle>
        <CardDescription>
          Configure os sons das notificações do chat e outros alertas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Toggle principal */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="sound-enabled">Ativar sons</Label>
            <p className="text-sm text-muted-foreground">
              Reproduzir sons ao receber notificações
            </p>
          </div>
          <Switch
            id="sound-enabled"
            checked={isEnabled}
            onCheckedChange={handleSoundToggle}
          />
        </div>

        {isEnabled && (
          <>
            {/* Seleção do tipo de som */}
            <div className="space-y-3">
              <Label>Tipo de som</Label>
              <RadioGroup
                value={currentSoundType}
                onValueChange={handleSoundTypeChange}
                className="grid grid-cols-1 gap-3"
              >
                <div className="flex items-center justify-between space-x-2 rounded-lg border p-3">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="beep" id="beep" />
                    <Label htmlFor="beep">Bip</Label>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestSound('beep')}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between space-x-2 rounded-lg border p-3">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="chime" id="chime" />
                    <Label htmlFor="chime">Carrilhão</Label>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestSound('chime')}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between space-x-2 rounded-lg border p-3">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="bell" id="bell" />
                    <Label htmlFor="bell">Sino</Label>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestSound('bell')}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between space-x-2 rounded-lg border p-3">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="custom" id="custom" disabled={!hasCustomSound} />
                    <Label htmlFor="custom" className={!hasCustomSound ? "text-muted-foreground" : ""}>
                      Personalizado {!hasCustomSound && "(não configurado)"}
                    </Label>
                  </div>
                  {hasCustomSound && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestSound('custom')}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </RadioGroup>
            </div>

            {/* Upload de som personalizado */}
            <div className="space-y-3">
              <Label>Som personalizado</Label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {isUploading ? "Enviando..." : hasCustomSound ? "Alterar som" : "Enviar som"}
                </Button>
                <p className="text-sm text-muted-foreground">
                  Formatos: MP3, WAV, OGG (máx. 5MB)
                </p>
              </div>
              <Input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              {hasCustomSound && (
                <p className="text-sm text-green-600">
                  ✓ Som personalizado configurado
                </p>
              )}
            </div>

            {/* Teste do som atual */}
            <div className="pt-3 border-t">
              <Button
                variant="secondary"
                onClick={() => handleTestSound()}
                className="w-full"
              >
                <Play className="h-4 w-4 mr-2" />
                Testar som atual
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
