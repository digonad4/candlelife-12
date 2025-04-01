
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Palette, User, Lock, Image } from "lucide-react";
import { ThemeSettings } from "@/components/settings/ThemeSettings";
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { AvatarSettings } from "@/components/settings/AvatarSettings";
import { SecuritySettings } from "@/components/settings/SecuritySettings";

const Settings = () => {
  const { toast } = useToast();

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl md:text-4xl font-bold text-foreground">Configurações</h1>
      
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-8">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span>Perfil</span>
          </TabsTrigger>
          <TabsTrigger value="theme" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            <span>Tema</span>
          </TabsTrigger>
          <TabsTrigger value="avatar" className="flex items-center gap-2">
            <Image className="w-4 h-4" />
            <span>Avatar</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            <span>Segurança</span>
          </TabsTrigger>
        </TabsList>

        <Card className="p-6">
          <TabsContent value="profile">
            <ProfileSettings />
          </TabsContent>
          
          <TabsContent value="theme">
            <ThemeSettings />
          </TabsContent>
          
          <TabsContent value="avatar">
            <AvatarSettings />
          </TabsContent>
          
          <TabsContent value="security">
            <SecuritySettings />
          </TabsContent>
        </Card>
      </Tabs>
    </div>
  );
};

export default Settings;
