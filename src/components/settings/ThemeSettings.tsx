import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Moon, Sun, Palette, Zap, Ghost, Mountain } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useTheme } from "@/context/ThemeContext";

const themes = [
  { id: "light", name: "Claro", icon: Sun },
  { id: "dark", name: "Escuro", icon: Moon },
  { id: "cyberpunk", name: "Cyberpunk", icon: Zap },
  { id: "dracula", name: "Dracula", icon: Ghost },
  { id: "nord", name: "Nord", icon: Mountain },
  { id: "purple", name: "Roxo", icon: Palette },
  { id: "green", name: "Verde", icon: Palette },
] as const;

export const ThemeSettings = () => {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  const updateTheme = (newTheme: typeof themes[number]["id"]) => {
    try {
      setTheme(newTheme);
      toast({
        title: "Tema alterado",
        description: `O tema foi alterado para ${themes.find(t => t.id === newTheme)?.name.toLowerCase()}.`,
      });
    } catch (error) {
      console.error("Erro ao atualizar tema:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o tema.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Personalização</h2>
        <p className="text-muted-foreground">
          Escolha o tema que melhor combina com você.
        </p>
      </div>

      <div className="space-y-4">
        <Label className="text-lg font-medium">Tema</Label>
        <RadioGroup
          value={theme}
          onValueChange={updateTheme}
          className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2"
        >
          {themes.map(({ id, name, icon: Icon }) => (
            <Label
              key={id}
              htmlFor={id} // Vincula o label ao RadioGroupItem
              className={`flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent transition-colors ${
                theme === id ? "border-primary bg-accent/50" : "border-input"
              }`}
            >
              <RadioGroupItem value={id} id={id} />
              <Icon className="w-5 h-5" />
              <span>{name}</span>
            </Label>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
};