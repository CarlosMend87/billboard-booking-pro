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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CampaignInfo, CampaignSearchMethod } from "@/context/CampaignContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, CalendarIcon, Info } from "lucide-react";
import { z } from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

const campaignSchema = z.object({
  nombre: z.string()
    .trim()
    .min(1, { message: "El nombre es requerido" })
    .max(100, { message: "El nombre debe tener menos de 100 caracteres" }),
  propuesta: z.string()
    .trim()
    .min(1, { message: "La propuesta es requerida" })
    .max(1000, { message: "La propuesta debe tener menos de 1000 caracteres" }),
  presupuesto: z.number()
    .positive({ message: "El presupuesto debe ser mayor a 0" })
    .max(10000000, { message: "El presupuesto debe ser menor a 10 millones" }),
  metodo: z.enum(['mensual', 'dia', 'spot', 'catorcenal', 'full'], {
    errorMap: () => ({ message: "Selecciona un método válido" })
  })
});

interface CampaignCreationModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (campaign: CampaignInfo & { fechaInicio?: string; fechaFin?: string }) => void;
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
  const [fechaInicio, setFechaInicio] = useState<Date | undefined>();
  const [fechaFin, setFechaFin] = useState<Date | undefined>();

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Debes iniciar sesión");
      return;
    }

    // Validar datos con zod
    const validation = campaignSchema.safeParse({
      nombre: nombre.trim(),
      propuesta: propuesta.trim(),
      presupuesto: parseFloat(presupuesto),
      metodo: metodo
    });

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    const validatedData = validation.data;

    setLoading(true);
    try {
      // Guardar campaña como borrador en la DB
      const { data, error } = await supabase
        .from("campañas")
        .insert({
          advertiser_id: user.id,
          nombre: validatedData.nombre,
          propuesta: validatedData.propuesta,
          presupuesto_total: validatedData.presupuesto,
          metodo_busqueda: validatedData.metodo,
          status: "draft",
          fecha_inicio: fechaInicio?.toISOString().split('T')[0] || null,
          fecha_fin: fechaFin?.toISOString().split('T')[0] || null,
        })
        .select()
        .single();

      if (error) throw error;

      const campaignInfo: CampaignInfo & { fechaInicio?: string; fechaFin?: string } = {
        id: data.id,
        nombre: validatedData.nombre,
        propuesta: validatedData.propuesta,
        presupuesto: validatedData.presupuesto,
        metodo: validatedData.metodo as CampaignSearchMethod,
        fechaInicio: fechaInicio?.toISOString().split('T')[0],
        fechaFin: fechaFin?.toISOString().split('T')[0],
      };

      onSubmit(campaignInfo);
      
      // Reset form
      setNombre("");
      setPropuesta("");
      setPresupuesto("");
      setMetodo("");
      setFechaInicio(undefined);
      setFechaFin(undefined);
    } catch (error: any) {
      console.error("Error creating campaign:", error);
      toast.error(error?.message || "Error al crear la campaña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
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
              maxLength={100}
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
              maxLength={1000}
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
              max="10000000"
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

          {/* Fechas de la campaña */}
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <Label className="font-medium">Fechas de la Campaña</Label>
            </div>
            
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Define las fechas para filtrar pantallas disponibles. Las pantallas ocupadas durante este periodo se mostrarán con su fecha de liberación.
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha de inicio</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !fechaInicio && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fechaInicio ? (
                        format(fechaInicio, "PPP", { locale: es })
                      ) : (
                        <span>Seleccionar</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={fechaInicio}
                      onSelect={(date) => {
                        setFechaInicio(date);
                        // Si la fecha fin es anterior, limpiarla
                        if (date && fechaFin && fechaFin < date) {
                          setFechaFin(undefined);
                        }
                      }}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label>Fecha de fin</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !fechaFin && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fechaFin ? (
                        format(fechaFin, "PPP", { locale: es })
                      ) : (
                        <span>Seleccionar</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={fechaFin}
                      onSelect={setFechaFin}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        if (date < today) return true;
                        if (fechaInicio && date < fechaInicio) return true;
                        return false;
                      }}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
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
