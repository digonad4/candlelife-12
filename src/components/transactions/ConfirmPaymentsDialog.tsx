
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";

interface ConfirmPaymentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  count: number;
}

export function ConfirmPaymentsDialog({ open, onOpenChange, onConfirm, count }: ConfirmPaymentsDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-card dark:bg-gray-800">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-card-foreground dark:text-gray-200">
            Confirmar Pagamento(s)
          </AlertDialogTitle>
          <AlertDialogDescription className="dark:text-gray-400">
            Deseja confirmar o recebimento de {count} pagamento(s)?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="dark:text-gray-200 dark:hover:bg-gray-700">Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
          >
            Confirmar Pagamento(s)
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
