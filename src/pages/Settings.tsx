
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Moon, Sun, Palette } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const themes = [
  { id: "light", name: "Claro", icon: Sun },
  { id: "dark", name: "Escuro", icon: Moon },
  { id: "purple", name: "Roxo", icon: Palette },
  { id: "green", name: "Verde", icon: Palette },
] as const;

const Settings = () => {
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });
  const { toast } = useToast();

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", currentTheme);
    localStorage.setItem("theme", currentTheme);

    toast({
      title: "Tema alterado",
      description: `O tema foi alterado para ${themes.find(t => t.id === currentTheme)?.name.toLowerCase()}.`,
    });
  }, [currentTheme, toast]);

  return (
    <div className="container mx-auto p-4 md:p-8 animate-fade-in">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Configurações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Label className="text-lg font-medium">Tema</Label>
            <RadioGroup
              value={currentTheme}
              onValueChange={setCurrentTheme}
              className="grid grid-cols-2 gap-4 pt-2"
            >
              {themes.map(({ id, name, icon: Icon }) => (
                <Label
                  key={id}
                  className={`flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent transition-colors ${
                    currentTheme === id ? "border-primary bg-accent/50" : "border-input"
                  }`}
                >
                  <RadioGroupItem value={id} id={id} />
                  <Icon className="w-5 h-5" />
                  <span>{name}</span>
                </Label>
              ))}
            </RadioGroup>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
