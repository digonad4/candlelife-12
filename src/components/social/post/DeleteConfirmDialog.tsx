
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type DeleteConfirmDialogProps = {
  isOpen: boolean;
  isDeleting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function DeleteConfirmDialog({ 
  isOpen, 
  isDeleting, 
  onOpenChange, 
  onConfirm 
}: DeleteConfirmDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir publicação?</DialogTitle>
          <DialogDescription>
            Esta ação não pode ser desfeita. A publicação será permanentemente removida.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Cancelar
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Excluindo...
              </>
            ) : (
              "Excluir"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
