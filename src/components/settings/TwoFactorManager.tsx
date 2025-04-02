
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  QrCode, Loader2, Shield, ShieldAlert, ShieldCheck
} from "lucide-react";
import { useTwoFactorAuth } from "@/hooks/useTwoFactorAuth";

export function TwoFactorManager() {
  const { 
    twoFactorStatus, 
    isLoading, 
    setupTwoFactor, 
    verifyTwoFactorCode, 
    disableTwoFactor 
  } = useTwoFactorAuth();
  
  const [verificationCode, setVerificationCode] = useState("");
  const [showSetup, setShowSetup] = useState(false);
  
  // Resetar o estado do código quando o status muda
  useEffect(() => {
    if (twoFactorStatus) {
      setVerificationCode("");
    }
  }, [twoFactorStatus?.enabled]);
  
  // Função para iniciar o processo de configuração
  const handleSetup = async () => {
    setShowSetup(true);
    await setupTwoFactor.mutateAsync();
  };
  
  // Função para validar o código e ativar 2FA
  const handleVerify = async () => {
    if (verificationCode.length !== 6) return;
    await verifyTwoFactorCode.mutateAsync(verificationCode);
    setShowSetup(false);
  };
  
  // Função para desativar 2FA
  const handleDisable = async () => {
    await disableTwoFactor.mutateAsync();
    setShowSetup(false);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  const is2FAEnabled = twoFactorStatus?.enabled || false;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold">Verificação em duas etapas</h2>
        {is2FAEnabled ? (
          <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs px-2 py-1 rounded-full flex items-center">
            <ShieldCheck className="h-3 w-3 mr-1" />
            Ativada
          </span>
        ) : (
          <span className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 text-xs px-2 py-1 rounded-full flex items-center">
            <ShieldAlert className="h-3 w-3 mr-1" />
            Desativada
          </span>
        )}
      </div>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-1">
              <h3 className="text-lg font-medium mb-2">
                {is2FAEnabled 
                  ? "Sua conta está protegida" 
                  : "Adicione uma camada extra de segurança"}
              </h3>
              
              <p className="text-muted-foreground mb-4">
                {is2FAEnabled 
                  ? "A verificação em duas etapas está ativada para sua conta. Isso ajuda a proteger sua conta contra acessos não autorizados."
                  : "Com a verificação em duas etapas, você precisará informar um código adicional ao fazer login, mesmo que alguém descubra sua senha."}
              </p>
              
              {/* Simulação apenas para fins de demonstração */}
              {showSetup && !is2FAEnabled && (
                <div className="mb-6 border rounded-md p-4 bg-muted">
                  <div className="flex items-center gap-3 mb-3">
                    <QrCode className="h-6 w-6 text-primary" />
                    <div>
                      <h4 className="font-medium">Código de verificação</h4>
                      <p className="text-sm text-muted-foreground">
                        Use um aplicativo autenticador para escanear o QR code
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-center mb-4">
                    {/* QR Code simulado (imagem de placeholder) */}
                    <div className="w-40 h-40 bg-muted-foreground/20 rounded-md flex items-center justify-center">
                      <Shield className="h-10 w-10 text-primary" />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <p className="text-sm">
                      Insira o código gerado pelo seu aplicativo autenticador:
                    </p>
                    
                    <div className="flex gap-2">
                      <Input
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        maxLength={6}
                        className="text-center tracking-widest font-mono text-lg"
                      />
                    </div>
                    
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => setShowSetup(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleVerify}
                        disabled={verificationCode.length !== 6 || verifyTwoFactorCode.isPending}
                      >
                        {verifyTwoFactorCode.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Verificando...
                          </>
                        ) : (
                          "Verificar"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {is2FAEnabled ? (
                <Button
                  variant="destructive"
                  onClick={handleDisable}
                  disabled={disableTwoFactor.isPending}
                >
                  {disableTwoFactor.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Desativando...
                    </>
                  ) : (
                    "Desativar verificação em duas etapas"
                  )}
                </Button>
              ) : !showSetup ? (
                <Button
                  onClick={handleSetup}
                  disabled={setupTwoFactor.isPending}
                >
                  {setupTwoFactor.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Configurando...
                    </>
                  ) : (
                    "Configurar verificação em duas etapas"
                  )}
                </Button>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
