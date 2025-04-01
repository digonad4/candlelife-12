import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Palette, User, Lock, Image, ArrowLeft } from "lucide-react";
import { ThemeSettings } from "@/components/settings/ThemeSettings";
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { AvatarSettings } from "@/components/settings/AvatarSettings";
import { SecuritySettings } from "@/components/settings/SecuritySettings";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { useSidebar } from "@/hooks/useSidebar";

const Settings = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isSidebarOpen } = useSidebar();

  return (
    <div className="min-h-screen flex bg-background">
      <AppSidebar />
      <div className={`flex-1 overflow-hidden transition-all duration-300 ${isSidebarOpen ? "ml-64" : "ml-16"}`}>
        <main className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(-1)}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Configurações</h1>
          </div>
          
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

            <Card className="p-6 border-border rounded-xl shadow-sm">
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
        </main>
      </div>
    </div>
  );
};

export default Settings;
