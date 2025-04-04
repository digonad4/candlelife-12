
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientsList } from "@/components/clients/ClientsList";
import { ClientForm } from "@/components/clients/ClientForm";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export default function Clients() {
  const [isClientFormOpen, setIsClientFormOpen] = useState(false);
  interface Client {
    id: string;
    name: string;
    email: string | null;
    document: string | null;
    phone: string | null;
    // Add other fields as necessary
  }

  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);

  const handleOpenClientForm = (client?: Client) => {
    if (client) {
      setClientToEdit(client);
    } else {
      setClientToEdit(null);
    }
    setIsClientFormOpen(true);
  };

  const handleCloseClientForm = () => {
    setIsClientFormOpen(false);
    setClientToEdit(null);
  };

  return (
    <div className="w-full space-y-8">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h1 className="text-3xl font-bold mb-4 sm:mb-0">Gerenciamento de Clientes</h1>
        <Button onClick={() => handleOpenClientForm()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Seus Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <ClientsList onEditClient={handleOpenClientForm} />
          </CardContent>
        </Card>
      </div>

      <ClientForm 
        open={isClientFormOpen} 
        onOpenChange={handleCloseClientForm} 
        clientToEdit={clientToEdit} 
      />
    </div>
  );
}
