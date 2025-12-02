import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PlusCircle, Eye, TrendingUp } from "lucide-react";

interface CampaignOptionsModalProps {
  open: boolean;
  onClose: () => void;
  onCreateFirst: () => void;
  onTrackExisting: () => void;
  onCreateAdditional: () => void;
}

export function CampaignOptionsModal({
  open,
  onClose,
  onCreateFirst,
  onTrackExisting,
  onCreateAdditional,
}: CampaignOptionsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>¿Qué te gustaría hacer?</DialogTitle>
          <DialogDescription>
            Selecciona una opción para continuar
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 mt-4">
          <Button
            onClick={onCreateFirst}
            variant="default"
            className="w-full justify-start h-auto py-4"
          >
            <PlusCircle className="mr-3 h-5 w-5" />
            <div className="text-left">
              <div className="font-semibold">Crear mi primera campaña</div>
              <div className="text-xs opacity-80">Comienza a planificar tu primera campaña publicitaria</div>
            </div>
          </Button>

          <Button
            onClick={onTrackExisting}
            variant="outline"
            className="w-full justify-start h-auto py-4"
          >
            <Eye className="mr-3 h-5 w-5" />
            <div className="text-left">
              <div className="font-semibold">Dar seguimiento a una campaña existente</div>
              <div className="text-xs opacity-80">Revisa el progreso de tus campañas activas</div>
            </div>
          </Button>

          <Button
            onClick={onCreateAdditional}
            variant="secondary"
            className="w-full justify-start h-auto py-4"
          >
            <TrendingUp className="mr-3 h-5 w-5" />
            <div className="text-left">
              <div className="font-semibold">Crear una nueva campaña adicional</div>
              <div className="text-xs opacity-80">Agrega otra campaña a tu portafolio</div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}