
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/30">
      <div className="text-center max-w-3xl px-6">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">Gerencie suas finanças de forma simples</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Acompanhe suas transações, gerencie clientes e mantenha o controle de suas finanças pessoais ou do seu negócio.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" onClick={() => navigate("/login")}>
            Começar agora
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate("/login")}>
            Fazer login
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
