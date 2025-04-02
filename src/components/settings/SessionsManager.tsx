
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Computer, Loader2, LogOut, Smartphone, RefreshCw
} from "lucide-react";
import { useUserSessions, UserSession } from "@/hooks/useUserSessions";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getDeviceIcon, formatSessionDate } from "@/integrations/supabase/client";

export function SessionsManager() {
  const { 
    sessions, 
    isLoading, 
    terminateSession, 
    terminateAllOtherSessions 
  } = useUserSessions();
  
  const getDeviceIconComponent = (deviceInfo: string) => {
    if (deviceInfo.toLowerCase().includes("android") || 
        deviceInfo.toLowerCase().includes("iphone") || 
        deviceInfo.toLowerCase().includes("ios")) {
      return <Smartphone className="h-5 w-5 text-primary" />;
    }
    return <Computer className="h-5 w-5 text-primary" />;
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Sessões Ativas ({sessions.length})</h2>
        
        {sessions.length > 1 && (
          <Button 
            variant="outline"
            onClick={() => terminateAllOtherSessions.mutate()}
            disabled={terminateAllOtherSessions.isPending}
          >
            {terminateAllOtherSessions.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Encerrar outras sessões
          </Button>
        )}
      </div>
      
      <div className="space-y-4">
        {sessions.map((session) => (
          <SessionCard 
            key={session.id} 
            session={session} 
            onTerminate={terminateSession.mutate} 
            isTerminating={terminateSession.isPending}
            getDeviceIconComponent={getDeviceIconComponent}
          />
        ))}
        
        {sessions.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            Nenhuma sessão ativa encontrada.
          </div>
        )}
      </div>
    </div>
  );
}

function SessionCard({ 
  session, 
  onTerminate, 
  isTerminating,
  getDeviceIconComponent
}: { 
  session: UserSession;
  onTerminate: (id: string) => void;
  isTerminating: boolean;
  getDeviceIconComponent: (deviceInfo: string) => JSX.Element;
}) {
  return (
    <Card className={`border ${session.is_current ? "border-primary/50" : "border-border"}`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex gap-3">
            {getDeviceIconComponent(session.device_info)}
            
            <div>
              <h3 className="font-medium">
                {session.device_info}
                {session.is_current && (
                  <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    Atual
                  </span>
                )}
              </h3>
              
              <div className="text-sm text-muted-foreground mt-1">
                <p>Última atividade: {formatSessionDate(session.last_active)}</p>
                <p>Iniciada em: {formatSessionDate(session.created_at)}</p>
              </div>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => onTerminate(session.id)}
            disabled={isTerminating || session.is_current}
          >
            <LogOut className="h-4 w-4 mr-1" />
            Encerrar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
