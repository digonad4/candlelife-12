
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

type Client = {
  id: string;
  name: string;
  document: string | null;
  email: string | null;
  phone: string | null;
};

interface ClientFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientToEdit?: Client | null;
}

export function ClientForm({ open, onOpenChange, clientToEdit }: ClientFormProps) {
  const [name, setName] = useState("");
  const [document, setDocument] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (clientToEdit) {
      setName(clientToEdit.name || "");
      setDocument(clientToEdit.document || "");
      setEmail(clientToEdit.email || "");
      setPhone(clientToEdit.phone || "");
    } else {
      resetForm();
    }
  }, [clientToEdit, open]);

  const resetForm = () => {
    setName("");
    setDocument("");
    setEmail("");
    setPhone("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsLoading(true);

    try {
      if (clientToEdit) {
        // Update existing client
        const { error } = await supabase
          .from("clients")
          .update({
            name,
            document,
            email,
            phone,
          })
          .eq("id", clientToEdit.id)
          .eq("user_id", user.id);

        if (error) throw error;

        toast({
          title: "Cliente atualizado",
          description: "Cliente atualizado com sucesso",
        });
      } else {
        // Create new client
        const { error } = await supabase
          .from("clients")
          .insert({
            name,
            document,
            email,
            phone,
            user_id: user.id,
          });

        if (error) throw error;

        toast({
          title: "Cliente adicionado",
          description: "Cliente adicionado com sucesso",
        });
      }

      // Invalidate clients query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      
      // Close the dialog and reset form
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      console.error("Error saving client:", error);
      toast({
        title: "Erro",
        description: `Falha ao ${clientToEdit ? "atualizar" : "adicionar"} cliente: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {clientToEdit ? "Editar Cliente" : "Novo Cliente"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nome*</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do cliente"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="document">Documento (CNPJ/CPF)</Label>
            <Input
              id="document"
              value={document}
              onChange={(e) => setDocument(e.target.value)}
              placeholder="00.000.000/0000-00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cliente@exemplo.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(00) 00000-0000"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? "Salvando..." : clientToEdit ? "Atualizar" : "Adicionar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
