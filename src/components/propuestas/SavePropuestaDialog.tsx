import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Save, Loader2 } from "lucide-react";

interface SavePropuestaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (nombre: string, descripcion: string) => Promise<boolean>;
  isSaving: boolean;
  itemCount: number;
  total: number;
}

export function SavePropuestaDialog({
  open,
  onOpenChange,
  onSave,
  isSaving,
  itemCount,
  total,
}: SavePropuestaDialogProps) {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 0,
    }).format(price);

  const handleSave = async () => {
    const success = await onSave(nombre, descripcion);
    if (success) {
      setNombre("");
      setDescripcion("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5 text-primary" />
            Guardar como Propuesta
          </DialogTitle>
          <DialogDescription>
            Guarda tu selección actual para compararla después con otras opciones.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Summary */}
          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pantallas:</span>
              <span className="font-medium">{itemCount}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-muted-foreground">Total estimado:</span>
              <span className="font-bold text-primary">{formatPrice(total)}</span>
            </div>
          </div>

          {/* Name input */}
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre de la propuesta *</Label>
            <Input
              id="nombre"
              placeholder="Ej: Campaña Navidad CDMX"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* Description input */}
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción (opcional)</Label>
            <Textarea
              id="descripcion"
              placeholder="Notas adicionales sobre esta propuesta..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
              maxLength={500}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!nombre.trim() || isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar Propuesta
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
