
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Moon, Sun, Palette, Zap, Ghost, Mountain, Coffee, 
  PaintBucket, Sunset, Leaf, Waves, Sparkles, Clock, 
  Crown, Terminal
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useTheme } from "@/context/ThemeContext";
import { Spinner } from "@/components/ui/spinner";

// Group themes by category for better organization
const themeCategories = [
  {
    name: "Básico",
    themes: [
      { id: "light", name: "Claro", icon: Sun },
      { id: "dark", name: "Escuro", icon: Moon },
    ]
  },
  {
    name: "Especial",
    themes: [
      { id: "cyberpunk", name: "Cyberpunk", icon: Zap },
      { id: "dracula", name: "Dracula", icon: Ghost },
      { id: "nord", name: "Nord", icon: Mountain },
      { id: "super-hacker", name: "Super Hacker", icon: Terminal },
    ]
  },
  {
    name: "Cores",
    themes: [
      { id: "purple", name: "Roxo", icon: Palette },
      { id: "green", name: "Verde", icon: Leaf },
      { id: "ocean", name: "Oceano", icon: Waves },
      { id: "sunset", name: "Pôr do Sol", icon: Sunset },
      { id: "forest", name: "Floresta", icon: Leaf },
    ]
  },
  {
    name: "Estilos",
    themes: [
      { id: "coffee", name: "Café", icon: Coffee },
      { id: "pastel", name: "Pastel", icon: PaintBucket },
      { id: "neon", name: "Neon", icon: Sparkles },
      { id: "vintage", name: "Vintage", icon: Clock },
      { id: "midnight", name: "Meia-noite", icon: Moon },
      { id: "royal", name: "Real", icon: Crown },
    ]
  }
];

// Flatten all themes for easier reference
const allThemes = themeCategories.flatMap(category => category.themes);

export const ThemeSettings = () => {
  const { theme, setTheme, isUpdating } = useTheme();
  const { toast } = useToast();
  const [selectedTheme, setSelectedTheme] = useState(theme);

  const updateTheme = async (newTheme: string) => {
    const themeName = allThemes.find(t => t.id === newTheme)?.name.toLowerCase() || newTheme;
    
    try {
      setSelectedTheme(newTheme as any);
      await setTheme(newTheme as any);
      
      toast({
        title: "Tema alterado",
        description: `O tema foi alterado para ${themeName}.`,
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

      {isUpdating && (
        <div className="flex items-center justify-center py-4">
          <Spinner className="w-6 h-6 mr-2" /> 
          <span>Atualizando tema...</span>
        </div>
      )}

      <div className="space-y-6">
        {themeCategories.map((category) => (
          <div key={category.name} className="space-y-3">
            <h3 className="text-lg font-medium">{category.name}</h3>
            <RadioGroup
              value={selectedTheme}
              onValueChange={updateTheme}
              className="grid grid-cols-2 md:grid-cols-3 gap-4"
              disabled={isUpdating}
            >
              {category.themes.map(({ id, name, icon: Icon }) => (
                <Label
                  key={id}
                  htmlFor={id}
                  className={`flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent transition-colors ${
                    selectedTheme === id ? "border-primary bg-accent/50" : "border-input"
                  } ${isUpdating ? "opacity-50" : ""}`}
                >
                  <RadioGroupItem value={id} id={id} disabled={isUpdating} />
                  <Icon className="w-5 h-5" />
                  <span>{name}</span>
                </Label>
              ))}
            </RadioGroup>
          </div>
        ))}
      </div>
    </div>
  );
};
