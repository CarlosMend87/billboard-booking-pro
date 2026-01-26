import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCartContext } from "@/context/CartContext";
import { useAuth } from "@/hooks/useAuth";
import { CartItem, CartItemConfig } from "@/types/cart";
import { catorcenas2024 } from "@/lib/mockInventory";
import { formatPrice } from "@/lib/pricing";
import { formatShortId, cn } from "@/lib/utils";
import { Calendar as CalendarIcon, Clock, Target, Zap, Printer, Tag, Check, X, Loader2, Gift } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CreativosUpload, CreativosConfig } from "./CreativosUpload";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

interface CodigoDescuentoValidado {
  id: string;
  codigo: string;
  tipo_descuento: string;
  valor_descuento: number;
}

interface UnifiedBookingConfigProps {
  item: CartItem;
  onUpdate: (itemId: string, config: CartItemConfig & { creativos?: CreativosConfig }) => void;
}

export function UnifiedBookingConfig({ item, onUpdate }: UnifiedBookingConfigProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [config, setConfig] = useState<CartItemConfig>(item.config);
  const [selectedDates, setSelectedDates] = useState<{ 
    inicio?: Date; 
    fin?: Date; 
    periodo?: string;
    catorcenasSeleccionadas?: string[];
  }>({});
  const [creativosConfig, setCreativosConfig] = useState<CreativosConfig>({});
  const [quienImprime, setQuienImprime] = useState<'cliente' | 'propietario'>('cliente');
  
  // Estado para código de descuento
  const [codigoInput, setCodigoInput] = useState("");
  const [validandoCodigo, setValidandoCodigo] = useState(false);
  const [codigoValidado, setCodigoValidado] = useState<CodigoDescuentoValidado | null>(null);
  const [errorCodigo, setErrorCodigo] = useState<string | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  
  // Fetch discounts available for this user
  const { data: codigosDisponibles } = useQuery({
    queryKey: ["codigos-disponibles", item.asset.owner_id, user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      
      const hoy = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from("codigos_descuento")
        .select("id, codigo, tipo_descuento, valor_descuento, clientes_permitidos, uso_maximo, uso_actual")
        .eq("owner_id", item.asset.owner_id)
        .eq("activo", true)
        .or(`fecha_inicio.is.null,fecha_inicio.lte.${hoy}`)
        .or(`fecha_fin.is.null,fecha_fin.gte.${hoy}`);
      
      if (error) throw error;
      
      // Filter codes that are available for this user (in clientes_permitidos or no restriction)
      return (data || []).filter(codigo => {
        // Check usage limit
        if (codigo.uso_maximo && codigo.uso_actual >= codigo.uso_maximo) return false;
        // Check if user email is in allowed list (or no restriction)
        if (!codigo.clientes_permitidos || codigo.clientes_permitidos.length === 0) return false;
        return codigo.clientes_permitidos.includes(user.email!.toLowerCase());
      }) as CodigoDescuentoValidado[];
    },
    enabled: !!user?.email && !!item.asset.owner_id,
  });
  
  // Determinar si es pantalla estática (necesita impresión)
  // IMPORTANTE: Todas las pantallas actuales son digitales, no deben mostrar opción de impresión
  const isStaticScreen = (): boolean => {
    // Si el tipo contiene "digital" en cualquier forma, NO es estática
    const tipo = item.asset.tipo?.toLowerCase() || '';
    if (tipo.includes('digital') || tipo.includes('led') || tipo.includes('pantalla')) {
      return false;
    }
    
    // Si tiene configuración digital, NO es estática
    if (item.asset.digital) return false;
    
    // Verificar metadata
    const metadata = item.asset.metadata as any;
    const frameCategory = metadata?.frame_category || metadata?.categoria_marco;
    
    // Si tiene categoría digital en metadata, NO es estática
    if (frameCategory === 'digital' || frameCategory === 'led') return false;
    
    // Solo es estática si explícitamente lo indica la contratación
    const contratacion = item.asset.contratacion as any;
    return contratacion?.requiere_impresion === true && frameCategory === 'static';
  };
  
  // Calcular costo de impresión
  const calcularCostoImpresion = (): number => {
    if (quienImprime !== 'propietario') return 0;
    const medidas = item.asset.medidas as any;
    const ancho = medidas?.ancho || 0;
    const alto = medidas?.alto || 0;
    const area = ancho * alto;
    const precioM2 = item.asset.precio_impresion_m2 || 65;
    return area * precioM2;
  };
  
  // Calcular descuento aplicado
  const calcularDescuento = (subtotal: number): number => {
    if (!codigoValidado) return 0;
    if (codigoValidado.tipo_descuento === 'porcentaje') {
      return subtotal * (codigoValidado.valor_descuento / 100);
    }
    return codigoValidado.valor_descuento;
  };
  
  // Validar código de descuento
  const validarCodigo = async () => {
    if (!codigoInput.trim()) return;
    
    setValidandoCodigo(true);
    setErrorCodigo(null);
    
    try {
      // Buscar el código en la base de datos
      const { data, error } = await supabase
        .from("codigos_descuento")
        .select("id, codigo, tipo_descuento, valor_descuento, activo, fecha_inicio, fecha_fin, uso_maximo, uso_actual")
        .eq("codigo", codigoInput.toUpperCase())
        .eq("owner_id", item.asset.owner_id)
        .eq("activo", true)
        .maybeSingle();
      
      if (error) throw error;
      
      if (!data) {
        setErrorCodigo("Código no válido");
        setCodigoValidado(null);
        return;
      }
      
      // Verificar fechas de vigencia
      const hoy = new Date().toISOString().split('T')[0];
      if (data.fecha_inicio && data.fecha_inicio > hoy) {
        setErrorCodigo("Este código aún no está vigente");
        setCodigoValidado(null);
        return;
      }
      if (data.fecha_fin && data.fecha_fin < hoy) {
        setErrorCodigo("Este código ha expirado");
        setCodigoValidado(null);
        return;
      }
      
      // Verificar uso máximo
      if (data.uso_maximo && data.uso_actual >= data.uso_maximo) {
        setErrorCodigo("Este código ha alcanzado su límite de uso");
        setCodigoValidado(null);
        return;
      }
      
      // Código válido
      setCodigoValidado({
        id: data.id,
        codigo: data.codigo,
        tipo_descuento: data.tipo_descuento,
        valor_descuento: data.valor_descuento,
      });
      
      toast({
        title: "Código aplicado",
        description: `Descuento de ${data.tipo_descuento === 'porcentaje' ? `${data.valor_descuento}%` : formatPrice(data.valor_descuento)}`,
      });
      
      // Actualizar config con el código
      handleConfigChange({ codigoDescuentoId: data.id });
      
    } catch (err: any) {
      setErrorCodigo("Error al validar código");
      console.error(err);
    } finally {
      setValidandoCodigo(false);
    }
  };
  
  const removerCodigo = () => {
    setCodigoValidado(null);
    setCodigoInput("");
    setErrorCodigo(null);
    setShowManualInput(false);
    handleConfigChange({ codigoDescuentoId: undefined });
  };
  
  const aplicarCodigoDisponible = (codigo: CodigoDescuentoValidado) => {
    setCodigoValidado(codigo);
    setShowManualInput(false);
    handleConfigChange({ codigoDescuentoId: codigo.id });
    toast({
      title: "Código aplicado",
      description: `Descuento de ${codigo.tipo_descuento === 'porcentaje' ? `${codigo.valor_descuento}%` : formatPrice(codigo.valor_descuento)}`,
    });
  };
  
  const { updateItem } = useCartContext();

  const handleCreativosChange = (itemId: string, creativos: CreativosConfig) => {
    setCreativosConfig(creativos);
    onUpdate(itemId, { ...config, creativos });
  };

  // Auto-update end dates when config changes
  useEffect(() => {
    if (selectedDates.inicio && item.modalidad !== 'catorcenal') {
      const endDate = calculateEndDate(selectedDates.inicio);
      if (!selectedDates.fin || selectedDates.fin.getTime() !== endDate.getTime()) {
        setSelectedDates(prev => ({ ...prev, fin: endDate }));
        handleConfigChange({
          fechaFin: endDate.toISOString().split('T')[0]
        });
      }
    }
  }, [config.meses, config.dias, config.catorcenas]);

  const handleConfigChange = (newConfig: Partial<CartItemConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    updateItem(item.id, updatedConfig);
    onUpdate(item.id, updatedConfig);
  };

  const handleDateChange = (type: 'inicio' | 'fin', date: Date | undefined) => {
    if (!date) return;
    
    const newDates = { ...selectedDates, [type]: date };
    
    // Auto-calculate end date based on modality when start date is selected
    if (type === 'inicio') {
      const endDate = calculateEndDate(date);
      newDates.fin = endDate;
    }
    
    setSelectedDates(newDates);
    
    handleConfigChange({
      fechaInicio: newDates.inicio?.toISOString().split('T')[0],
      fechaFin: newDates.fin?.toISOString().split('T')[0]
    });
  };

  const calculateEndDate = (startDate: Date): Date => {
    const endDate = new Date(startDate);
    
    switch (item.modalidad) {
      case 'mensual':
        // Block 30 days starting from selected date
        const monthsToAdd = config.meses || 1;
        const daysToAdd = monthsToAdd * 30; // 30 days per month
        endDate.setDate(startDate.getDate() + daysToAdd - 1); // -1 because we include the start date
        break;
      case 'spot':
      case 'dia':
      case 'hora':
        // Block consecutive days
        const days = config.dias || 1;
        endDate.setDate(startDate.getDate() + days - 1);
        break;
      case 'catorcenal':
        // Will be handled separately in catorcena selection
        return startDate;
      default:
        endDate.setDate(startDate.getDate());
        break;
    }
    
    return endDate;
  };

  const handleCatorcenaChange = (periodo: string) => {
    const catorcena = catorcenas2024.find(c => c.periodo === periodo);
    if (!catorcena) return;
    
    const currentSelection = selectedDates.catorcenasSeleccionadas || [];
    const isSelected = currentSelection.includes(periodo);
    const numCatorcenas = config.catorcenas || 1;
    
    let newSelection: string[];
    if (isSelected) {
      // Remove if already selected
      newSelection = currentSelection.filter(p => p !== periodo);
    } else {
      // Add if not selected and we haven't reached the limit
      if (currentSelection.length < numCatorcenas) {
        newSelection = [...currentSelection, periodo].sort();
      } else {
        return; // Don't allow more selections than configured
      }
    }
    
    // Calculate date range from selected catorcenas
    const selectedCatorcenas = catorcenas2024.filter(c => newSelection.includes(c.periodo));
    const fechaInicio = selectedCatorcenas.length > 0 ? selectedCatorcenas[0].inicio : undefined;
    const fechaFin = selectedCatorcenas.length > 0 ? selectedCatorcenas[selectedCatorcenas.length - 1].fin : undefined;
    
    setSelectedDates({ 
      catorcenasSeleccionadas: newSelection,
      inicio: fechaInicio ? new Date(fechaInicio) : undefined,
      fin: fechaFin ? new Date(fechaFin) : undefined
    });
    
    handleConfigChange({
      fechaInicio,
      fechaFin,
      periodo: newSelection.join(',')
    });
  };

  const getTipoLabel = (tipo: string) => {
    const labels = {
      'espectacular': 'Espectacular',
      'muro': 'Muro',
      'valla': 'Valla', 
      'parabus': 'Parabús',
      'digital': 'Digital'
    };
    return labels[tipo as keyof typeof labels] || tipo;
  };

  const getModalidadLabel = (modalidad: string) => {
    const labels = {
      'mensual': 'Mensual',
      'catorcenal': 'Catorcenal',
      'semanal': 'Semanal',
      'spot': 'Por Spot',
      'hora': 'Por Hora',
      'dia': 'Por Día',
      'cpm': 'CPM'
    };
    return labels[modalidad as keyof typeof labels] || modalidad;
  };

  const getIcon = () => {
    switch (item.modalidad) {
      case 'spot': return <Zap className="h-4 w-4" />;
      case 'hora': return <Clock className="h-4 w-4" />;
      case 'cpm': return <Target className="h-4 w-4" />;
      default: return <CalendarIcon className="h-4 w-4" />;
    }
  };

  const renderModalidadConfig = () => (
    <div className="space-y-4">
      <h4 className="font-medium">Configuración de Modalidad</h4>
      
      {item.modalidad === 'mensual' && (
        <div>
          <Label htmlFor="meses">Número de meses</Label>
          <Input
            id="meses"
            type="number"
            min="1"
            max="24"
            value={config.meses || 1}
            onChange={(e) => handleConfigChange({ meses: parseInt(e.target.value) || 1 })}
            className="mt-1"
          />
        </div>
      )}
      
      {item.modalidad === 'catorcenal' && (
        <div>
          <Label htmlFor="catorcenas">Número de catorcenas</Label>
          <Input
            id="catorcenas"
            type="number"
            min="1"
            max="26"  
            value={config.catorcenas || 1}
            onChange={(e) => handleConfigChange({ catorcenas: parseInt(e.target.value) || 1 })}
            className="mt-1"
          />
        </div>
      )}
      
      {item.modalidad === 'spot' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="spotsDia">Spots por día</Label>
            <Input
              id="spotsDia"
              type="number"
              min="1"
              max="100"
              value={config.spotsDia || 1}
              onChange={(e) => handleConfigChange({ spotsDia: parseInt(e.target.value) || 1 })}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="dias">Número de días</Label>
            <Input
              id="dias"
              type="number"
              min="1"
              max="365"
              value={config.dias || 1}
              onChange={(e) => handleConfigChange({ dias: parseInt(e.target.value) || 1 })}
              className="mt-1"
            />
          </div>
        </div>
      )}
      
      {item.modalidad === 'hora' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="horas">Horas por día</Label>
            <Input
              id="horas"
              type="number"
              min="1"
              max="24"
              value={config.horas || 1}
              onChange={(e) => handleConfigChange({ horas: parseInt(e.target.value) || 1 })}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="dias">Número de días</Label>
            <Input
              id="dias"
              type="number"
              min="1"
              max="365"
              value={config.dias || 1}
              onChange={(e) => handleConfigChange({ dias: parseInt(e.target.value) || 1 })}
              className="mt-1"
            />
          </div>
        </div>
      )}
      
      {item.modalidad === 'dia' && (
        <div>
          <Label htmlFor="dias">Número de días</Label>
          <Input
            id="dias"
            type="number"
            min="1"
            max="365"
            value={config.dias || 1}
            onChange={(e) => handleConfigChange({ dias: parseInt(e.target.value) || 1 })}
            className="mt-1"
          />
        </div>
      )}
      
      {item.modalidad === 'cpm' && (
        <div>
          <Label htmlFor="impresiones">Impresiones objetivo</Label>
          <Input
            id="impresiones"
            type="number"
            min="1000"
            step="1000"
            value={config.impresiones || 10000}
            onChange={(e) => handleConfigChange({ impresiones: parseInt(e.target.value) || 10000 })}
            className="mt-1"
          />
        </div>
      )}
    </div>
  );

  const renderProgramacion = () => {
    // Show dates from cart item (already selected during exploration)
    const fechaInicio = item.config.fechaInicio || config.fechaInicio;
    const fechaFin = item.config.fechaFin || config.fechaFin;
    
    // For catorcenal, show selected catorcenas
    if (item.modalidad === 'catorcenal') {
      const periodos = (item.config.periodo || config.periodo)?.split(',') || [];
      const selectedCatorcenas = catorcenas2024.filter(c => periodos.includes(c.periodo));
      
      return (
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            Fechas de la Campaña
          </h4>
          
          {selectedCatorcenas.length > 0 ? (
            <div className="p-4 bg-muted/50 rounded-lg space-y-3">
              <div className="flex flex-wrap gap-2">
                {selectedCatorcenas.map(catorcena => (
                  <Badge key={catorcena.periodo} variant="secondary" className="text-sm">
                    C{catorcena.numero.toString().padStart(2, '0')}
                  </Badge>
                ))}
              </div>
              <div className="text-sm text-muted-foreground">
                Del {format(new Date(selectedCatorcenas[0].inicio), "d 'de' MMMM yyyy", { locale: es })} al{' '}
                {format(new Date(selectedCatorcenas[selectedCatorcenas.length - 1].fin), "d 'de' MMMM yyyy", { locale: es })}
              </div>
            </div>
          ) : (
            <Alert>
              <AlertDescription>
                Las catorcenas se seleccionarán durante la exploración de inventario.
              </AlertDescription>
            </Alert>
          )}
        </div>
      );
    }
    
    // For other modalities, show readonly date range
    return (
      <div className="space-y-4">
        <h4 className="font-medium flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          Fechas de la Campaña
        </h4>
        
        {fechaInicio && fechaFin ? (
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Fecha de inicio</Label>
                <p className="font-medium mt-1">
                  {format(new Date(fechaInicio), "d 'de' MMMM yyyy", { locale: es })}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Fecha de fin</Label>
                <p className="font-medium mt-1">
                  {format(new Date(fechaFin), "d 'de' MMMM yyyy", { locale: es })}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <Alert>
            <AlertDescription>
              Las fechas se definieron durante la selección de inventario.
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{item.asset.nombre}</CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline">{getTipoLabel(item.asset.tipo)}</Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                {getIcon()}
                {getModalidadLabel(item.modalidad)}
              </Badge>
              <Badge variant="outline" className="text-xs">
                ID: {formatShortId(item.asset.id)}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Precio unitario</p>
            <p className="font-semibold">{formatPrice(item.precioUnitario)}</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {renderModalidadConfig()}
        
        <div className="border-t pt-4">
          {renderProgramacion()}
        </div>
        
        {/* Sección de impresión para pantallas estáticas */}
        {isStaticScreen() && (
          <div className="border-t pt-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Printer className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-medium">¿Quién imprime la lona?</h4>
              </div>
              
              <RadioGroup
                value={quienImprime}
                onValueChange={(value: 'cliente' | 'propietario') => {
                  setQuienImprime(value);
                  handleConfigChange({
                    creativos: {
                      ...config.creativos,
                      quienImprime: value === 'propietario' ? 'propietario' : 'cliente'
                    }
                  });
                }}
                className="space-y-3"
              >
                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="cliente" id="cliente" />
                  <Label htmlFor="cliente" className="flex-1 cursor-pointer">
                    <span className="font-medium">Yo imprimo</span>
                    <p className="text-sm text-muted-foreground">El cliente se encarga de la impresión y envío del material</p>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="propietario" id="propietario" />
                  <Label htmlFor="propietario" className="flex-1 cursor-pointer">
                    <span className="font-medium">El dueño imprime</span>
                    <p className="text-sm text-muted-foreground">El propietario de la pantalla se encarga de la impresión</p>
                  </Label>
                </div>
              </RadioGroup>
              
              {quienImprime === 'propietario' && (
                <Alert className="bg-muted/50">
                  <Printer className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span>Medidas de la lona:</span>
                        <span className="font-medium">
                          {(item.asset.medidas as any)?.ancho || (item.asset.medidas as any)?.ancho_m || 0}m × {(item.asset.medidas as any)?.alto || (item.asset.medidas as any)?.alto_m || 0}m
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Precio por m²:</span>
                        <span className="font-medium">{formatPrice(item.asset.precio_impresion_m2 || 65)}</span>
                      </div>
                      <div className="flex justify-between items-center text-primary font-semibold">
                        <span>Costo total de impresión:</span>
                        <span>{formatPrice(calcularCostoImpresion())}</span>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        )}
        
        <div className="border-t pt-4">
          <CreativosUpload 
            item={item} 
            onCreativosChange={handleCreativosChange}
          />
        </div>
        
        <div className="border-t pt-4">
          <div className="space-y-4">
            {/* Código de descuento */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <Label className="font-medium">Código de descuento</Label>
              </div>
              
              {codigoValidado ? (
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                  <Check className="h-4 w-4 text-green-600" />
                  <div className="flex-1">
                    <span className="font-mono font-semibold">{codigoValidado.codigo}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      ({codigoValidado.tipo_descuento === 'porcentaje' 
                        ? `${codigoValidado.valor_descuento}%` 
                        : formatPrice(codigoValidado.valor_descuento)})
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={removerCodigo}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Códigos disponibles para el usuario */}
                  {codigosDisponibles && codigosDisponibles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Gift className="h-4 w-4" />
                        Descuentos disponibles para ti:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {codigosDisponibles.map((codigo) => (
                          <Button
                            key={codigo.id}
                            variant="outline"
                            size="sm"
                            onClick={() => aplicarCodigoDisponible(codigo)}
                            className="flex items-center gap-2"
                          >
                            <span className="font-mono font-semibold">{codigo.codigo}</span>
                            <Badge variant="secondary" className="text-xs">
                              {codigo.tipo_descuento === 'porcentaje' 
                                ? `${codigo.valor_descuento}%` 
                                : formatPrice(codigo.valor_descuento)}
                            </Badge>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Entrada manual de código */}
                  {showManualInput || !codigosDisponibles || codigosDisponibles.length === 0 ? (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Ingresa tu código"
                        value={codigoInput}
                        onChange={(e) => {
                          setCodigoInput(e.target.value.toUpperCase());
                          setErrorCodigo(null);
                        }}
                        className={cn("flex-1 font-mono", errorCodigo && "border-destructive")}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            validarCodigo();
                          }
                        }}
                      />
                      <Button 
                        onClick={validarCodigo} 
                        disabled={validandoCodigo || !codigoInput.trim()}
                        variant="secondary"
                      >
                        {validandoCodigo ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Aplicar"
                        )}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowManualInput(true)}
                      className="text-muted-foreground"
                    >
                      ¿Tienes otro código? Ingrésalo manualmente
                    </Button>
                  )}
                </div>
              )}
              
              {errorCodigo && (
                <p className="text-sm text-destructive mt-1">{errorCodigo}</p>
              )}
            </div>
            
            {/* Totales */}
            <div className="space-y-2 pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Subtotal ({item.quantity} unidades):</span>
                <span className="font-medium">{formatPrice(item.subtotal)}</span>
              </div>
              {isStaticScreen() && quienImprime === 'propietario' && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Costo de impresión:</span>
                  <span className="font-medium">{formatPrice(calcularCostoImpresion())}</span>
                </div>
              )}
              {codigoValidado && (
                <div className="flex justify-between items-center text-green-600">
                  <span>Descuento ({codigoValidado.codigo}):</span>
                  <span className="font-medium">-{formatPrice(calcularDescuento(item.subtotal))}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="font-medium">Total:</span>
                <span className="text-lg font-bold text-primary">
                  {formatPrice(
                    item.subtotal 
                    + (isStaticScreen() && quienImprime === 'propietario' ? calcularCostoImpresion() : 0)
                    - calcularDescuento(item.subtotal)
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}