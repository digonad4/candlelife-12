
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useIsMobile } from "@/hooks/use-mobile";

export function TransactionTableHeader() {
  const isMobile = useIsMobile();
  
  return (
    <TableHeader>
      <TableRow>
        <TableHead className="w-[40px]"></TableHead>
        <TableHead className="w-[40px]"></TableHead>
        <TableHead>Cliente</TableHead>
        {!isMobile && <TableHead>Descrição</TableHead>}
        <TableHead>Data</TableHead>
        {!isMobile && <TableHead>Ação</TableHead>}
        <TableHead>Status</TableHead>
        <TableHead>Valor</TableHead>
      </TableRow>
    </TableHeader>
  );
}
