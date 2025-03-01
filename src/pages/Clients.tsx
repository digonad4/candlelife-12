
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppSidebar } from "@/components/AppSidebar";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const Clients = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [newClient, setNewClient] = useState({
    name: "",
    email: "",
    phone: "",
    document: ""
  });

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    fetchClients();
  }, [user, navigate]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (error) throw error;
      
      if (data) setClients(data);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os clientes.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewClient(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newClient.name.trim()) {
      toast({
        title: "Erro",
        description: "O nome do cliente é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('clients')
        .insert([{ ...newClient, user_id: user.id }]);

      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Cliente cadastrado com sucesso!",
      });
      
      // Reset form
      setNewClient({
        name: "",
        email: "",
        phone: "",
        document: ""
      });
      
      // Refresh client list
      fetchClients();
    } catch (error) {
      console.error('Error adding client:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o cliente.",
        variant: "destructive"
      });
    }
  };

  const handleClientClick = (clientId) => {
    navigate(`/client-transactions/${clientId}`);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen w-full flex bg-background">
      <AppSidebar />
      <main className="flex-1 p-4 md:p-8 overflow-auto">
        <div className="max-w-[2000px] mx-auto space-y-6 md:space-y-8">
          <h1 className="text-2xl md:text-4xl font-bold">Clientes</h1>

          <Card>
            <CardHeader>
              <CardTitle>Cadastrar Novo Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome*</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Nome do cliente"
                      value={newClient.name}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="document">Documento (CPF/CNPJ)</Label>
                    <Input
                      id="document"
                      name="document"
                      placeholder="Documento do cliente"
                      value={newClient.document}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Email do cliente"
                      value={newClient.email}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      placeholder="Telefone do cliente"
                      value={newClient.phone}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full md:w-auto">
                  Cadastrar Cliente
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Clientes Cadastrados</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p>Carregando clientes...</p>
              ) : clients.length > 0 ? (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {clients.map((client) => (
                    <Card key={client.id} className="cursor-pointer hover:bg-accent transition-colors" onClick={() => handleClientClick(client.id)}>
                      <CardContent className="p-4">
                        <h3 className="font-medium text-lg">{client.name}</h3>
                        {client.document && <p className="text-sm text-muted-foreground">Documento: {client.document}</p>}
                        {client.phone && <p className="text-sm text-muted-foreground">Telefone: {client.phone}</p>}
                        {client.email && <p className="text-sm text-muted-foreground">Email: {client.email}</p>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p>Nenhum cliente cadastrado.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Clients;
