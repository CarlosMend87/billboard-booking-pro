import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Calculator, DollarSign, Tag, Calendar as CalendarIcon, Info } from "lucide-react";
import { totalTradicional, totalDigitalSpot, totalDigitalHora, totalDigitalDia, totalDigitalCPM } from "@/lib/pricing";
import type { Billboard } from "@/hooks/useBillboards";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface NuevaVentaDialogProps {
  agenteId: string;
  ownerId: string;
  comisionPorcentaje: number;
  comisionMontoFijo: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

type Modalidad = 'mensual' | 'catorcenal' | 'semanal' | 'spot' | 'hora' | 'dia' | 'cpm';

const reservaSchema = z.object({
  clienteNombre: z.string().trim().min(1, "Nombre requerido").max(200),
  clienteEmail: z.string().trim().email("Email inválido").max(255).optional().or(z.literal("")),
  billboardId: z.string().uuid("Selecciona un anuncio"),
  fechaInicio: z.string().min(1, "Fecha inicio requerida"),
  fechaFin: z.string().min(1, "Fecha fin requerida"),
});

export function NuevaVentaDialog({ 
  agenteId, 
  ownerId, 
  comisionPorcentaje, 
  comisionMontoFijo,
  open: externalOpen,
  onOpenChange: externalOnOpenChange 
}: NuevaVentaDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange || setInternalOpen;

  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteEmail, setClienteEmail] = useState("");
  const [clienteRazonSocial, setClienteRazonSocial] = useState("");
  const [billboardId, setBillboardId] = useState("");
  const [modalidad, setModalidad] = useState<Modalidad>("mensual");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [esAgencia, setEsAgencia] = useState(false);
  const [tipoContrato, setTipoContrato] = useState<"fijo" | "renovable">("fijo");
  const [codigoDescuentoId, setCodigoDescuentoId] = useState<string>("");
  
  const [meses, setMeses] = useState(1);
  const [catorcenas, setCatorcenas] = useState(1);
  const [semanas, setSemanas] = useState(1);
  const [spotsDia, setSpotsDia] = useState(10);
  const [horas, setHoras] = useState(1);
  const [dias, setDias] = useState(1);
  const [impresiones, setImpresiones] = useState(1000);

  const { data: billboards } = useQuery({
    queryKey: ["billboards-owner", ownerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("billboards")
        .select("*")
        .eq("owner_id", ownerId)
        .eq("status", "disponible");
      if (error) throw error;
      return data as Billboard[];
    },
    enabled: open && !!ownerId,
  });

  const { data: existingReservations } = useQuery({
    queryKey: ["billboard-reservations", billboardId],
    queryFn: async () => {
      if (!billboardId) return [];
      const billboard = billboards?.find(b => b.id === billboardId);
      if (!billboard) return [];
      
      const { data, error } = await supabase
        .from("reservas")
        .select("fecha_inicio, fecha_fin, status, asset_name")
        .eq("asset_name", billboard.nombre)
        .in("status", ["pending", "accepted"]);
      if (error) throw error;
      return data;
    },
    enabled: !!billboardId && !!billboards,
  });

  const { data: codigosDescuento } = useQuery({
    queryKey: ["codigos-descuento", ownerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("codigos_descuento")
        .select("*")
        .eq("owner_id", ownerId)
        .eq("activo", true);
      if (error) throw error;
      return data;
    },
    enabled: open && !!ownerId,
  });

  const selectedBillboard = billboards?.find((b) => b.id === billboardId);

  const config = {
    meses: modalidad === "mensual" ? meses : undefined,
    catorcenas: modalidad === "catorcenal" ? catorcenas : undefined,
    semanas: modalidad === "semanal" ? semanas : undefined,
    spotsDia: modalidad === "spot" ? spotsDia : undefined,
    horas: modalidad === "hora" ? horas : undefined,
    dias: modalidad === "dia" ? dias : undefined,
    impresiones: modalidad === "cpm" ? impresiones : undefined,
  };

  const calculatePrice = (): number => {
    if (!selectedBillboard) return 0;
    const precioData = selectedBillboard.precio as any;
    const digitalData = selectedBillboard.digital as any;

    if (!selectedBillboard.digital) {
      const precioMensual = precioData?.mensual || 0;
      if (modalidad === "mensual") return totalTradicional({ tipoPeriodo: "mensual", precioMensual, meses });
      if (modalidad === "catorcenal") return totalTradicional({ tipoPeriodo: "catorcenal", precioMensual, catorcenas });
      if (modalidad === "semanal") return totalTradicional({ tipoPeriodo: "semanal", precioMensual });
    }

    if (selectedBillboard.digital) {
      if (modalidad === "spot") return totalDigitalSpot({ tarifaSpot: digitalData?.tarifas?.spot || 0, spotsDia, dias });
      if (modalidad === "hora") return totalDigitalHora({ tarifaHora: digitalData?.tarifas?.hora || 0, horas, dias });
      if (modalidad === "dia") return totalDigitalDia({ tarifaDia: digitalData?.tarifas?.dia || 0, dias });
      if (modalidad === "cpm") return totalDigitalCPM({ impresiones, cpm: digitalData?.tarifas?.cpm || 0 });
    }
    return 0;
  };

  const precioBase = calculatePrice();
  const codigoSeleccionado = codigosDescuento?.find((c) => c.id === codigoDescuentoId);
  const descuentoAplicado = codigoSeleccionado
    ? codigoSeleccionado.tipo_descuento === "porcentaje"
      ? (precioBase * codigoSeleccionado.valor_descuento) / 100
      : codigoSeleccionado.valor_descuento
    : 0;

  const precioFinal = precioBase - descuentoAplicado;
  const comisionEstimada = (precioFinal * comisionPorcentaje) / 100 + comisionMontoFijo;

  const checkDateConflict = (): string | null => {
    if (!fechaInicio || !fechaFin || !existingReservations) return null;

    const newStart = new Date(fechaInicio);
    const newEnd = new Date(fechaFin);

    for (const reservation of existingReservations) {
      const existingStart = new Date(reservation.fecha_inicio);
      const existingEnd = new Date(reservation.fecha_fin);

      // Check if dates overlap
      if (
        (newStart >= existingStart && newStart <= existingEnd) ||
        (newEnd >= existingStart && newEnd <= existingEnd) ||
        (newStart <= existingStart && newEnd >= existingEnd)
      ) {
        return `Este anuncio ya tiene una reserva del ${new Date(reservation.fecha_inicio).toLocaleDateString()} al ${new Date(reservation.fecha_fin).toLocaleDateString()}`;
      }
    }

    return null;
  };

  const dateConflictError = checkDateConflict();

  // Validation function
  const validateForm = (): string | null => {
    try {
      reservaSchema.parse({ clienteNombre, clienteEmail: clienteEmail || "", billboardId, fechaInicio, fechaFin });
      return null;
    } catch (error) {
      if (error instanceof z.ZodError) return error.errors[0].message;
    }
  };

  const createReservaMutation = useMutation({
    mutationFn: async () => {
      try {
        reservaSchema.parse({ clienteNombre, clienteEmail: clienteEmail || "", billboardId, fechaInicio, fechaFin });
      } catch (error) {
        if (error instanceof z.ZodError) throw new Error(error.errors[0].message);
      }

      if (!selectedBillboard) throw new Error("Selecciona un anuncio");

      const { data, error } = await supabase.from("reservas").insert({
        advertiser_id: null,
        owner_id: ownerId,
        agente_id: agenteId,
        asset_name: selectedBillboard.nombre,
        asset_type: selectedBillboard.tipo,
        modalidad,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        precio_total: precioFinal,
        tarifa_publicada: precioBase,
        tarifa_final: precioFinal,
        es_agencia: esAgencia,
        codigo_descuento_id: codigoDescuentoId || null,
        descuento_aplicado: descuentoAplicado,
        cliente_nombre: clienteNombre,
        cliente_email: clienteEmail || null,
        cliente_razon_social: clienteRazonSocial || null,
        tipo_contrato: tipoContrato,
        status: "pending",
        config: config,
      }).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "¡Venta registrada!", description: "La venta ha sido registrada correctamente" });
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["agente-reservas"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setClienteNombre("");
    setClienteEmail("");
    setClienteRazonSocial("");
    setBillboardId("");
    setModalidad("mensual");
    setFechaInicio("");
    setFechaFin("");
    setEsAgencia(false);
    setTipoContrato("fijo");
    setCodigoDescuentoId("");
    setMeses(1);
    setCatorcenas(1);
    setSemanas(1);
    setSpotsDia(10);
    setHoras(1);
    setDias(1);
    setImpresiones(1000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Nueva Venta</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Client Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Información del Cliente</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clienteNombre">Nombre del Cliente *</Label>
                <Input
                  id="clienteNombre"
                  value={clienteNombre}
                  onChange={(e) => setClienteNombre(e.target.value)}
                  placeholder="Juan Pérez"
                />
              </div>
              <div>
                <Label htmlFor="clienteEmail">Email del Cliente</Label>
                <Input
                  id="clienteEmail"
                  type="email"
                  value={clienteEmail}
                  onChange={(e) => setClienteEmail(e.target.value)}
                  placeholder="cliente@ejemplo.com"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="clienteRazonSocial">Razón Social</Label>
              <Input
                id="clienteRazonSocial"
                value={clienteRazonSocial}
                onChange={(e) => setClienteRazonSocial(e.target.value)}
                placeholder="Empresa S.A. de C.V."
              />
            </div>
          </div>

          {/* Billboard Selection */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Selección de Anuncio</h3>
            <div>
              <Label htmlFor="billboard">Anuncio *</Label>
              <Select value={billboardId} onValueChange={setBillboardId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un anuncio" />
                </SelectTrigger>
                <SelectContent>
                  {billboards?.map((billboard) => (
                    <SelectItem key={billboard.id} value={billboard.id}>
                      {billboard.nombre} - {billboard.direccion} ({billboard.tipo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Modalidad and Configuration */}
          {selectedBillboard && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Configuración de Contratación</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="modalidad">Modalidad *</Label>
                  <Select value={modalidad} onValueChange={(v) => setModalidad(v as Modalidad)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {!selectedBillboard.digital && (
                        <>
                          <SelectItem value="mensual">Mensual</SelectItem>
                          <SelectItem value="catorcenal">Catorcenal</SelectItem>
                          <SelectItem value="semanal">Semanal</SelectItem>
                        </>
                      )}
                      {selectedBillboard.digital && (
                        <>
                          <SelectItem value="spot">Spot</SelectItem>
                          <SelectItem value="hora">Hora</SelectItem>
                          <SelectItem value="dia">Día</SelectItem>
                          <SelectItem value="cpm">CPM</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Configuration inputs based on modalidad */}
                {modalidad === "mensual" && (
                  <div>
                    <Label htmlFor="meses">Meses</Label>
                    <Input
                      id="meses"
                      type="number"
                      min="1"
                      value={meses}
                      onChange={(e) => setMeses(parseInt(e.target.value))}
                    />
                  </div>
                )}
                {modalidad === "catorcenal" && (
                  <div>
                    <Label htmlFor="catorcenas">Catorcenas</Label>
                    <Input
                      id="catorcenas"
                      type="number"
                      min="1"
                      value={catorcenas}
                      onChange={(e) => setCatorcenas(parseInt(e.target.value))}
                    />
                  </div>
                )}
                {modalidad === "semanal" && (
                  <div>
                    <Label htmlFor="semanas">Semanas</Label>
                    <Input
                      id="semanas"
                      type="number"
                      min="1"
                      value={semanas}
                      onChange={(e) => setSemanas(parseInt(e.target.value))}
                    />
                  </div>
                )}
                {modalidad === "spot" && (
                  <div>
                    <Label htmlFor="spotsDia">Spots por Día</Label>
                    <Input
                      id="spotsDia"
                      type="number"
                      min="1"
                      value={spotsDia}
                      onChange={(e) => setSpotsDia(parseInt(e.target.value))}
                    />
                  </div>
                )}
                {modalidad === "hora" && (
                  <div>
                    <Label htmlFor="horas">Horas</Label>
                    <Input
                      id="horas"
                      type="number"
                      min="1"
                      value={horas}
                      onChange={(e) => setHoras(parseInt(e.target.value))}
                    />
                  </div>
                )}
                {modalidad === "dia" && (
                  <div>
                    <Label htmlFor="dias">Días</Label>
                    <Input
                      id="dias"
                      type="number"
                      min="1"
                      value={dias}
                      onChange={(e) => setDias(parseInt(e.target.value))}
                    />
                  </div>
                )}
                {modalidad === "cpm" && (
                  <div>
                    <Label htmlFor="impresiones">Impresiones</Label>
                    <Input
                      id="impresiones"
                      type="number"
                      min="1000"
                      step="1000"
                      value={impresiones}
                      onChange={(e) => setImpresiones(parseInt(e.target.value))}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fechaInicio">Fecha Inicio *</Label>
                  <Input
                    id="fechaInicio"
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <Label htmlFor="fechaFin">Fecha Fin *</Label>
                  <Input
                    id="fechaFin"
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    min={fechaInicio || new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
              {dateConflictError && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  {dateConflictError}
                </div>
              )}
            </div>
          )}

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Opciones Adicionales</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tipoContrato">Tipo de Contrato</Label>
                <Select value={tipoContrato} onValueChange={(v) => setTipoContrato(v as "fijo" | "renovable")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fijo">Fijo</SelectItem>
                    <SelectItem value="renovable">Renovable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2 pt-8">
                <Checkbox
                  id="esAgencia"
                  checked={esAgencia}
                  onCheckedChange={(checked) => setEsAgencia(checked as boolean)}
                />
                <Label htmlFor="esAgencia" className="cursor-pointer">
                  ¿Es agencia?
                </Label>
              </div>
            </div>
            
            {/* Discount Codes Section */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Códigos de Descuento Disponibles
              </Label>
              {!codigosDescuento || codigosDescuento.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay códigos de descuento disponibles</p>
              ) : (
                <>
                  <div className="grid gap-2">
                    {codigosDescuento.map((codigo) => {
                      const usosRestantes = codigo.uso_maximo ? codigo.uso_maximo - (codigo.uso_actual || 0) : null;
                      const fechaValida = (!codigo.fecha_inicio || new Date(codigo.fecha_inicio) <= new Date()) &&
                                        (!codigo.fecha_fin || new Date(codigo.fecha_fin) >= new Date());
                      const puedeUsar = fechaValida && (usosRestantes === null || usosRestantes > 0);
                      
                      return (
                        <Card 
                          key={codigo.id} 
                          className={`p-3 cursor-pointer transition-colors ${
                            codigoDescuentoId === codigo.id 
                              ? 'border-primary bg-primary/5' 
                              : puedeUsar 
                                ? 'hover:bg-muted/50' 
                                : 'opacity-60 cursor-not-allowed'
                          }`}
                          onClick={() => puedeUsar && setCodigoDescuentoId(codigo.id)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="secondary" className="font-mono">
                                  {codigo.codigo}
                                </Badge>
                                <Badge variant={codigo.tipo_descuento === "porcentaje" ? "default" : "outline"}>
                                  {codigo.tipo_descuento === "porcentaje" 
                                    ? `${codigo.valor_descuento}% OFF` 
                                    : `$${codigo.valor_descuento.toLocaleString()} OFF`}
                                </Badge>
                                {!puedeUsar && <Badge variant="destructive">No disponible</Badge>}
                              </div>
                              <div className="text-xs text-muted-foreground space-y-1">
                                {codigo.notas && <p>{codigo.notas}</p>}
                                {(codigo.fecha_inicio || codigo.fecha_fin) && (
                                  <p className="flex items-center gap-1">
                                    <CalendarIcon className="h-3 w-3" />
                                    {codigo.fecha_inicio && `Desde ${new Date(codigo.fecha_inicio).toLocaleDateString()}`}
                                    {codigo.fecha_fin && ` hasta ${new Date(codigo.fecha_fin).toLocaleDateString()}`}
                                  </p>
                                )}
                                {usosRestantes !== null && (
                                  <p>Usos restantes: {usosRestantes} de {codigo.uso_maximo}</p>
                                )}
                                {codigo.clientes_permitidos && codigo.clientes_permitidos.length > 0 && (
                                  <p className="flex items-center gap-1">
                                    <Info className="h-3 w-3" />
                                    Solo para clientes específicos
                                  </p>
                                )}
                              </div>
                            </div>
                            {codigoDescuentoId === codigo.id && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCodigoDescuentoId("");
                                }}
                              >
                                Quitar
                              </Button>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                  {codigoDescuentoId && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCodigoDescuentoId("")}
                      className="w-full"
                    >
                      No usar descuento
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Price Summary */}
          {selectedBillboard && (
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Precio Base:</span>
                <span className="font-semibold">${precioBase.toLocaleString()}</span>
              </div>
              {descuentoAplicado > 0 && (
                <div className="flex justify-between items-center text-green-600">
                  <span className="text-sm">Descuento:</span>
                  <span className="font-semibold">-${descuentoAplicado.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
                <span>Precio Final:</span>
                <span>${precioFinal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-primary">
                <span className="text-sm flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  Tu Comisión Estimada:
                </span>
                <span className="font-semibold">${comisionEstimada.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            className="w-full"
            onClick={() => createReservaMutation.mutate()}
            disabled={createReservaMutation.isPending || !selectedBillboard || !clienteNombre || !fechaInicio || !fechaFin || !!dateConflictError}
          >
            {createReservaMutation.isPending ? "Registrando..." : "Registrar Venta"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
