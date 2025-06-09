
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { 
  Volume2, 
  Upload, 
  Play, 
  Trash2, 
  Download,
  Music,
  Waveform,
  Settings,
  TestTube
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { advancedNotificationSoundService } from '@/services/advancedNotificationSound';

export const NotificationSoundSettings = () => {
  const { toast } = useToast();
  const [currentSound, setCurrentSound] = useState('default');
  const [predefinedSounds, setPredefinedSounds] = useState({});
  const [customSounds, setCustomSounds] = useState<Array<{id: string, url: string, name: string}>>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [previewingSound, setPreviewingSound] = useState<string | null>(null);

  useEffect(() => {
    loadSounds();
  }, []);

  const loadSounds = () => {
    setCurrentSound(advancedNotificationSoundService.getCurrentSound());
    setPredefinedSounds(advancedNotificationSoundService.getPredefinedSounds());
    setCustomSounds(advancedNotificationSoundService.getCustomSounds());
  };

  const handleSoundChange = (soundId: string) => {
    setCurrentSound(soundId);
    advancedNotificationSoundService.setCurrentSound(soundId);
    toast({
      title: 'Som selecionado',
      description: 'Som de notificação atualizado com sucesso'
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const soundId = await advancedNotificationSoundService.uploadCustomSound(file);
      loadSounds();
      toast({
        title: 'Som enviado',
        description: `Arquivo "${file.name}" foi enviado com sucesso`
      });
    } catch (error) {
      toast({
        title: 'Erro no upload',
        description: error instanceof Error ? error.message : 'Erro ao enviar arquivo',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
      // Limpar o input
      event.target.value = '';
    }
  };

  const handlePreviewSound = async (soundId: string) => {
    if (previewingSound === soundId) return;

    setPreviewingSound(soundId);
    try {
      await advancedNotificationSoundService.previewSound(soundId);
    } catch (error) {
      toast({
        title: 'Erro no preview',
        description: 'Não foi possível reproduzir o som',
        variant: 'destructive'
      });
    } finally {
      setTimeout(() => setPreviewingSound(null), 1000);
    }
  };

  const handleRemoveCustomSound = (soundId: string) => {
    advancedNotificationSoundService.removeCustomSound(soundId);
    loadSounds();
    toast({
      title: 'Som removido',
      description: 'Som personalizado foi removido'
    });
  };

  const handleTestCurrentSound = async () => {
    try {
      await advancedNotificationSoundService.testSound();
      toast({
        title: 'Som testado',
        description: 'Som de notificação reproduzido com sucesso'
      });
    } catch (error) {
      toast({
        title: 'Erro no teste',
        description: 'Não foi possível reproduzir o som',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-800/20">
              <Volume2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            Sons de Notificação
          </CardTitle>
          <CardDescription>
            Personalize os sons para diferentes tipos de notificação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Som Atual</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {predefinedSounds[currentSound as keyof typeof predefinedSounds]?.name || 
                 customSounds.find(s => s.id === currentSound)?.name || 
                 'Som Padrão'}
              </p>
            </div>
            <Button onClick={handleTestCurrentSound} variant="outline">
              <TestTube className="h-4 w-4 mr-2" />
              Testar Som Atual
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Predefined Sounds Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20">
              <Music className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            Sons Pré-definidos
          </CardTitle>
          <CardDescription>
            Escolha entre os sons de notificação disponíveis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={currentSound} onValueChange={handleSoundChange}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(predefinedSounds).map(([soundId, sound]: [string, any]) => (
                <div key={soundId} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value={soundId} id={soundId} />
                  <div className="flex-1">
                    <Label htmlFor={soundId} className="cursor-pointer font-medium">
                      {sound.name}
                    </Label>
                    {currentSound === soundId && (
                      <Badge variant="default" className="ml-2 text-xs">
                        Selecionado
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePreviewSound(soundId)}
                    disabled={previewingSound === soundId}
                  >
                    {previewingSound === soundId ? (
                      <Waveform className="h-4 w-4 animate-pulse" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Upload Custom Sounds Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/30 dark:to-green-800/20">
              <Upload className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            Sons Personalizados
          </CardTitle>
          <CardDescription>
            Envie seus próprios arquivos de áudio para usar como notificação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors">
            <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
            <Label htmlFor="sound-upload" className="cursor-pointer">
              <span className="text-sm font-medium">Clique para enviar um arquivo de áudio</span>
              <br />
              <span className="text-xs text-muted-foreground">
                Formatos suportados: MP3, WAV, OGG (máximo 5MB)
              </span>
            </Label>
            <Input
              id="sound-upload"
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
            />
          </div>

          {isUploading && (
            <div className="text-center">
              <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                Enviando arquivo...
              </div>
            </div>
          )}

          {/* Custom Sounds List */}
          {customSounds.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <Label className="text-sm font-medium">Seus Sons Personalizados</Label>
                <RadioGroup value={currentSound} onValueChange={handleSoundChange}>
                  {customSounds.map((sound) => (
                    <div key={sound.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value={sound.id} id={sound.id} />
                      <div className="flex-1">
                        <Label htmlFor={sound.id} className="cursor-pointer font-medium">
                          {sound.name}
                        </Label>
                        {currentSound === sound.id && (
                          <Badge variant="default" className="ml-2 text-xs">
                            Selecionado
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePreviewSound(sound.id)}
                          disabled={previewingSound === sound.id}
                        >
                          {previewingSound === sound.id ? (
                            <Waveform className="h-4 w-4 animate-pulse" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveCustomSound(sound.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Tips Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-800/20">
              <Settings className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            Dicas de Uso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
              <p>Arquivos de áudio menores que 1MB funcionam melhor</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
              <p>Sons curtos (2-3 segundos) são ideais para notificações</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
              <p>Use o botão de preview para testar antes de selecionar</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
              <p>Sons personalizados são salvos no seu navegador</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
