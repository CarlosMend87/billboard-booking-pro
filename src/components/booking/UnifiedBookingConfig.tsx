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
import { CartItem, CartItemConfig } from "@/types/cart";
import { catorcenas2024 } from "@/lib/mockInventory";
import { formatPrice } from "@/lib/pricing";
import { formatShortId, cn } from "@/lib/utils";
import { Calendar as CalendarIcon, Clock, Target, Zap, Printer } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CreativosUpload, CreativosConfig } from "./CreativosUpload";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface UnifiedBookingConfigProps {
  item: CartItem;
  onUpdate: (itemId: string, config: CartItemConfig & { creativos?: CreativosConfig }) => void;
}

export function UnifiedBookingConfig({ item, onUpdate }: UnifiedBookingConfigProps) {
  const [config, setConfig] = useState<CartItemConfig>(item.config);
  const [selectedDates, setSelectedDates] = useState<{ 
    inicio?: Date; 
    fin?: Date; 
    periodo?: string;
    catorcenasSeleccionadas?: string[];
  }>({});
  const [creativosConfig, setCreativosConfig] = useState<CreativosConfig>({});
  const [quienImprime, setQuienImprime] = useState<'cliente' | 'propietario'>('cliente');
  
  // Determinar si es pantalla estática (necesita impresión)
  const isStaticScreen = (): boolean => {
    const metadata = item.asset.metadata as any;
    const frameCategory = metadata?.frame_category || metadata?.categoria_marco;
    const contratacion = item.asset.contratacion as any;
    return frameCategory === 'static' || contratacion?.requiere_impresion === true || !item.asset.digital;
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

  const renderProgramacion = () => (
    <div className="space-y-4">
      <h4 className="font-medium">Programación de Fechas</h4>
      
      {item.modalidad === 'catorcenal' ? (
        <div>
          <Label>Selecciona catorcenas disponibles (máximo {config.catorcenas || 1})</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 max-h-64 overflow-y-auto">
            {catorcenas2024.map((catorcena) => {
              const isSelected = selectedDates.catorcenasSeleccionadas?.includes(catorcena.periodo) || false;
              const fechaInicio = new Date(catorcena.inicio);
              const fechaFin = new Date(catorcena.fin);
              const formatDate = (date: Date) => date.toLocaleDateString('es-MX', { 
                day: 'numeric', 
                month: 'short' 
              });
              
              return (
                <Button
                  key={catorcena.periodo}
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleCatorcenaChange(catorcena.periodo)}
                  className="justify-start p-3 h-auto"
                >
                  <div className="flex items-center gap-3 w-full">
                    <Badge 
                      variant={isSelected ? 'secondary' : 'outline'} 
                      className="text-xs font-mono"
                    >
                      C{catorcena.numero.toString().padStart(2, '0')}
                    </Badge>
                    <div className="text-left flex-1">
                      <div className="text-xs font-medium">
                        {formatDate(fechaInicio)} - {formatDate(fechaFin)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {catorcena.periodo}
                      </div>
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
          
          {selectedDates.catorcenasSeleccionadas && selectedDates.catorcenasSeleccionadas.length > 0 && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CalendarIcon className="h-4 w-4 text-primary" />
                <span className="font-medium">Catorcenas seleccionadas ({selectedDates.catorcenasSeleccionadas.length}):</span>
              </div>
              <div className="space-y-1 text-sm">
                {selectedDates.catorcenasSeleccionadas.map(periodo => {
                  const catorcena = catorcenas2024.find(c => c.periodo === periodo);
                  if (!catorcena) return null;
                  return (
                    <div key={periodo}>
                      <strong>C{catorcena.numero.toString().padStart(2, '0')}</strong> - 
                      Del {new Date(catorcena.inicio).toLocaleDateString('es-MX', { 
                        day: 'numeric', 
                        month: 'long',
                        year: 'numeric' 
                      })} al {new Date(catorcena.fin).toLocaleDateString('es-MX', { 
                        day: 'numeric', 
                        month: 'long',
                        year: 'numeric' 
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Fecha de inicio</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal mt-2",
                    !selectedDates.inicio && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDates.inicio ? (
                    format(selectedDates.inicio, "PPP", { locale: es })
                  ) : (
                    <span>Selecciona una fecha</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDates.inicio}
                  onSelect={(date) => handleDateChange('inicio', date)}
                  className="rounded-md pointer-events-auto"
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label>Fecha de fin (calculada automáticamente)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  disabled
                  className={cn(
                    "w-full justify-start text-left font-normal mt-2",
                    !selectedDates.fin && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDates.fin ? (
                    format(selectedDates.fin, "PPP", { locale: es })
                  ) : (
                    <span>Selecciona fecha de inicio</span>
                  )}
                </Button>
              </PopoverTrigger>
            </Popover>
          </div>
        </div>
      )}
    </div>
  );

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
          <div className="space-y-2">
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
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="font-medium">Total:</span>
              <span className="text-lg font-bold text-primary">
                {formatPrice(item.subtotal + (isStaticScreen() && quienImprime === 'propietario' ? calcularCostoImpresion() : 0))}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}