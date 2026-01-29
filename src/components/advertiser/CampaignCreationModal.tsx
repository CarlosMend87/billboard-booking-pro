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
import { CampaignInfo, CampaignSearchMethod } from "@/types/cart";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, CalendarIcon, Info, Calculator } from "lucide-react";
import { z } from "zod";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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

type DateSelectionType = 'rango' | 'dias_salteados' | 'semana' | 'dia_unico';

interface SpotConfig {
  totalSpots: number;
  spotsPerDay: number;
  spotsPerHour: number;
  dateSelectionType: DateSelectionType;
  selectedDates: Date[];
}

interface CampaignCreationModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (campaign: CampaignInfo & { fechaInicio?: string; fechaFin?: string; spotConfig?: SpotConfig }) => void;
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
  
  // Configuración de spots
  const [spotConfig, setSpotConfig] = useState<SpotConfig>({
    totalSpots: 0,
    spotsPerDay: 0,
    spotsPerHour: 0,
    dateSelectionType: 'rango',
    selectedDates: [],
  });

  const isSpotMethod = metodo === 'spot';

  // Cálculos automáticos para spots
  const calculatedDays = spotConfig.spotsPerDay > 0 
    ? Math.ceil(spotConfig.totalSpots / spotConfig.spotsPerDay) 
    : 0;
  
  const estimatedCostPerSpot = 15; // Precio base por spot en MXN (puede venir de la pantalla)
  const estimatedTotalCost = spotConfig.totalSpots * estimatedCostPerSpot;
  
  const totalDaysFromDates = (() => {
    if (spotConfig.dateSelectionType === 'dias_salteados') {
      return spotConfig.selectedDates.length;
    }
    if (spotConfig.dateSelectionType === 'dia_unico') {
      return 1;
    }
    if (fechaInicio && fechaFin) {
      return differenceInDays(fechaFin, fechaInicio) + 1;
    }
    return 0;
  })();

  const daysValidation = (() => {
    if (!isSpotMethod || spotConfig.totalSpots === 0 || spotConfig.spotsPerDay === 0) return null;
    
    if (totalDaysFromDates > 0 && totalDaysFromDates < calculatedDays) {
      return {
        type: 'warning' as const,
        message: `Necesitas ${calculatedDays} días para completar ${spotConfig.totalSpots} spots (a ${spotConfig.spotsPerDay}/día), pero solo seleccionaste ${totalDaysFromDates} días.`
      };
    }
    if (totalDaysFromDates > calculatedDays) {
      const spotsPerDayAdjusted = Math.ceil(spotConfig.totalSpots / totalDaysFromDates);
      return {
        type: 'info' as const,
        message: `Con ${totalDaysFromDates} días, podrías reducir a ${spotsPerDayAdjusted} spots/día para distribuir mejor.`
      };
    }
    return null;
  })();

  const handleSpotConfigChange = (field: keyof SpotConfig, value: any) => {
    setSpotConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleMultipleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    setSpotConfig(prev => {
      const exists = prev.selectedDates.some(d => 
        d.toDateString() === date.toDateString()
      );
      
      if (exists) {
        return {
          ...prev,
          selectedDates: prev.selectedDates.filter(d => 
            d.toDateString() !== date.toDateString()
          )
        };
      } else {
        return {
          ...prev,
          selectedDates: [...prev.selectedDates, date].sort((a, b) => a.getTime() - b.getTime())
        };
      }
    });
  };

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

    // Validaciones adicionales para spots
    if (isSpotMethod) {
      if (spotConfig.totalSpots <= 0) {
        toast.error("Debes especificar el número total de spots");
        return;
      }
      if (spotConfig.spotsPerDay <= 0) {
        toast.error("Debes especificar los spots por día");
        return;
      }
      if (spotConfig.dateSelectionType === 'dias_salteados' && spotConfig.selectedDates.length === 0) {
        toast.error("Debes seleccionar al menos un día");
        return;
      }
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

      const campaignInfo: CampaignInfo & { fechaInicio?: string; fechaFin?: string; spotConfig?: SpotConfig } = {
        id: data.id,
        nombre: validatedData.nombre,
        propuesta: validatedData.propuesta,
        presupuesto: validatedData.presupuesto,
        metodo: validatedData.metodo as CampaignSearchMethod,
        fechaInicio: fechaInicio?.toISOString().split('T')[0],
        fechaFin: fechaFin?.toISOString().split('T')[0],
        ...(isSpotMethod && { spotConfig }),
      };

      onSubmit(campaignInfo);
      
      // Reset form
      setNombre("");
      setPropuesta("");
      setPresupuesto("");
      setMetodo("");
      setFechaInicio(undefined);
      setFechaFin(undefined);
      setSpotConfig({
        totalSpots: 0,
        spotsPerDay: 0,
        spotsPerHour: 0,
        dateSelectionType: 'rango',
        selectedDates: [],
      });
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

          {/* Configuración de Spots */}
          {isSpotMethod && (
            <div className="space-y-4 pt-2 border-t border-border">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                <Label className="font-medium text-primary">Configuración de Spots</Label>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalSpots">Total de Spots</Label>
                  <Input
                    id="totalSpots"
                    type="number"
                    placeholder="100"
                    value={spotConfig.totalSpots || ''}
                    onChange={(e) => handleSpotConfigChange('totalSpots', parseInt(e.target.value) || 0)}
                    min="1"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="spotsPerDay">Spots por Día</Label>
                  <Input
                    id="spotsPerDay"
                    type="number"
                    placeholder="10"
                    value={spotConfig.spotsPerDay || ''}
                    onChange={(e) => handleSpotConfigChange('spotsPerDay', parseInt(e.target.value) || 0)}
                    min="1"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="spotsPerHour">Spots por Hora</Label>
                <Input
                  id="spotsPerHour"
                  type="number"
                  placeholder="2"
                  value={spotConfig.spotsPerHour || ''}
                  onChange={(e) => handleSpotConfigChange('spotsPerHour', parseInt(e.target.value) || 0)}
                  min="1"
                />
              </div>

              <div className="space-y-3">
                <Label>Tipo de Selección de Fechas</Label>
                <RadioGroup
                  value={spotConfig.dateSelectionType}
                  onValueChange={(value) => handleSpotConfigChange('dateSelectionType', value as DateSelectionType)}
                  className="grid grid-cols-2 gap-2"
                >
                  <div className="flex items-center space-x-2 border rounded-md p-2 cursor-pointer hover:bg-muted/50">
                    <RadioGroupItem value="rango" id="rango" />
                    <Label htmlFor="rango" className="cursor-pointer text-sm">Rango de fechas</Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-md p-2 cursor-pointer hover:bg-muted/50">
                    <RadioGroupItem value="dias_salteados" id="dias_salteados" />
                    <Label htmlFor="dias_salteados" className="cursor-pointer text-sm">Días salteados</Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-md p-2 cursor-pointer hover:bg-muted/50">
                    <RadioGroupItem value="semana" id="semana" />
                    <Label htmlFor="semana" className="cursor-pointer text-sm">Por semana</Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-md p-2 cursor-pointer hover:bg-muted/50">
                    <RadioGroupItem value="dia_unico" id="dia_unico" />
                    <Label htmlFor="dia_unico" className="cursor-pointer text-sm">Día único</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Selector de días salteados */}
              {spotConfig.dateSelectionType === 'dias_salteados' && (
                <div className="space-y-2">
                  <Label>Selecciona los días (clic para agregar/quitar)</Label>
                  <div className="border rounded-md p-2">
                    <Calendar
                      mode="single"
                      selected={undefined}
                      onSelect={handleMultipleDateSelect}
                      disabled={(date) => date < new Date()}
                      modifiers={{
                        selected: spotConfig.selectedDates,
                      }}
                      modifiersStyles={{
                        selected: { 
                          backgroundColor: 'hsl(var(--primary))',
                          color: 'hsl(var(--primary-foreground))'
                        }
                      }}
                      className="pointer-events-auto"
                    />
                  </div>
                  {spotConfig.selectedDates.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      {spotConfig.selectedDates.length} día(s) seleccionado(s): {' '}
                      {spotConfig.selectedDates.slice(0, 3).map(d => format(d, 'dd/MM')).join(', ')}
                      {spotConfig.selectedDates.length > 3 && ` +${spotConfig.selectedDates.length - 3} más`}
                    </div>
                  )}
                </div>
              )}

              {/* Resumen de costo estimado */}
              {spotConfig.totalSpots > 0 && (
                <Card className="bg-muted/50 border-primary/20">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center gap-2 mb-3">
                      <Calculator className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">Resumen Estimado</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-muted-foreground">Total de spots:</div>
                      <div className="font-medium text-right">{spotConfig.totalSpots}</div>
                      
                      <div className="text-muted-foreground">Spots por día:</div>
                      <div className="font-medium text-right">{spotConfig.spotsPerDay || '-'}</div>
                      
                      <div className="text-muted-foreground">Días necesarios:</div>
                      <div className="font-medium text-right">{calculatedDays > 0 ? `${calculatedDays} día(s)` : '-'}</div>
                      
                      {totalDaysFromDates > 0 && (
                        <>
                          <div className="text-muted-foreground">Días seleccionados:</div>
                          <div className="font-medium text-right">{totalDaysFromDates} día(s)</div>
                        </>
                      )}
                      
                      <div className="col-span-2 border-t border-border my-1"></div>
                      
                      <div className="text-muted-foreground">Costo estimado:</div>
                      <div className="font-semibold text-right text-primary">
                        ${estimatedTotalCost.toLocaleString('es-MX')} MXN
                      </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mt-2">
                      * Precio estimado. El costo final depende de la pantalla seleccionada.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Validación de días */}
              {daysValidation && (
                <Alert variant={daysValidation.type === 'warning' ? 'destructive' : 'default'}>
                  <Info className="h-4 w-4" />
                  <AlertDescription>{daysValidation.message}</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Fechas de la campaña */}
          {(!isSpotMethod || spotConfig.dateSelectionType === 'rango' || spotConfig.dateSelectionType === 'semana') && (
            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <Label className="font-medium">Fechas de la Campaña</Label>
              </div>
              
              {!isSpotMethod && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Define las fechas para filtrar pantallas disponibles. Las pantallas ocupadas durante este periodo se mostrarán con su fecha de liberación.
                  </AlertDescription>
                </Alert>
              )}
              
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
          )}

          {/* Día único para spots */}
          {isSpotMethod && spotConfig.dateSelectionType === 'dia_unico' && (
            <div className="space-y-2 pt-2 border-t">
              <Label>Selecciona el día</Label>
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
                      <span>Seleccionar día</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={fechaInicio}
                    onSelect={(date) => {
                      setFechaInicio(date);
                      setFechaFin(date);
                    }}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
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