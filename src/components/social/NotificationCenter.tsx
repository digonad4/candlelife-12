
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface NotificationCenterProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NotificationCenter = ({ isOpen, onOpenChange }: NotificationCenterProps) => {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Central de Notificações</SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          <p className="text-muted-foreground">
            Suas notificações aparecerão aqui em breve.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};
