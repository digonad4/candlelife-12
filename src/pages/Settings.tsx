
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { SecuritySettings } from "@/components/settings/SecuritySettings";
import { ThemeSettings } from "@/components/settings/ThemeSettings";
import { SessionsManager } from "@/components/settings/SessionsManager";
import { BackButton } from "@/components/navigation/BackButton";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <BackButton />
      <h1 className="text-3xl font-bold">Configurações da Conta</h1>
      
      <Card className="p-6">
        <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="security">Segurança</TabsTrigger>
            <TabsTrigger value="appearance">Aparência</TabsTrigger>
            <TabsTrigger value="sessions">Sessões</TabsTrigger>
          </TabsList>
          <TabsContent value="profile" className="space-y-4 mt-6">
            <ProfileSettings />
          </TabsContent>
          <TabsContent value="security" className="space-y-4 mt-6">
            <SecuritySettings />
          </TabsContent>
          <TabsContent value="appearance" className="space-y-4 mt-6">
            <ThemeSettings />
          </TabsContent>
          <TabsContent value="sessions" className="space-y-4 mt-6">
            <SessionsManager />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Settings;
