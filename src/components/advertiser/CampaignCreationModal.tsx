import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CampaignInfo, CampaignSearchMethod } from "@/context/CampaignContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface CampaignCreationModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (campaign: CampaignInfo) => void;
}

export function CampaignCreationModal({
  open,
  onClose,
  onSubmit,
}: CampaignCreationModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [nombre, setNombre] = useState("");
  const [propuesta, setPropuesta] = useState("");
  const [presupuesto, setPresupuesto] = useState("");
  const [metodo, setMetodo] = useState<CampaignSearchMethod | "">("");

  const handleSubmit = async () => {
    if (!nombre.trim()) {
      toast.error("Por favor ingresa el nombre de la campaña");
      return;
    }
    if (!propuesta.trim()) {
      toast.error("Por favor describe la propuesta");
      return;
    }
    if (!presupuesto || parseFloat(presupuesto) <= 0) {
      toast.error("Por favor ingresa un presupuesto válido");
      return;
    }
    if (!metodo) {
      toast.error("Por favor selecciona un método de búsqueda");
      return;
    }

    if (!user) {
      toast.error("Debes iniciar sesión");
      return;
    }

    setLoading(true);
    try {
      // Guardar campaña como borrador en la DB
      const { data, error } = await supabase
        .from("campañas")
        .insert({
          advertiser_id: user.id,
          nombre: nombre.trim(),
          propuesta: propuesta.trim(),
          presupuesto_total: parseFloat(presupuesto),
          metodo_busqueda: metodo,
          status: "draft", // Guardar como borrador
        })
        .select()
        .single();

      if (error) throw error;

      const campaignInfo: CampaignInfo = {
        id: data.id,
        nombre: nombre.trim(),
        propuesta: propuesta.trim(),
        presupuesto: parseFloat(presupuesto),
        metodo: metodo as CampaignSearchMethod,
      };

      onSubmit(campaignInfo);
      
      // Reset form
      setNombre("");
      setPropuesta("");
      setPresupuesto("");
      setMetodo("");
    } catch (error) {
      console.error("Error creating campaign:", error);
      toast.error("Error al crear la campaña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Crear Nueva Campaña</DialogTitle>
          <DialogDescription>
            Completa la información de tu campaña para comenzar la búsqueda de inventario
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre de la Campaña</Label>
            <Input
              id="nombre"
              placeholder="Ej: Campaña Verano 2024"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="propuesta">Propuesta / Descripción</Label>
            <Textarea
              id="propuesta"
              placeholder="Describe brevemente el objetivo y público de la campaña"
              value={propuesta}
              onChange={(e) => setPropuesta(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="presupuesto">Presupuesto Disponible (MXN)</Label>
            <Input
              id="presupuesto"
              type="number"
              placeholder="50000"
              value={presupuesto}
              onChange={(e) => setPresupuesto(e.target.value)}
              min="0"
              step="100"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="metodo">Método de Búsqueda / Compra</Label>
            <Select value={metodo} onValueChange={(value) => setMetodo(value as CampaignSearchMethod)}>
              <SelectTrigger id="metodo">
                <SelectValue placeholder="Selecciona el método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mensual">Por mes</SelectItem>
                <SelectItem value="dia">By day / Por día</SelectItem>
                <SelectItem value="spot">Por spot</SelectItem>
                <SelectItem value="catorcenal">Catorcenal</SelectItem>
                <SelectItem value="full">Full / Todos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando...
              </>
            ) : (
              "Buscar Disponibilidad"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
