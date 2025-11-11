import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { useCartContext } from "@/context/CartContext";
import { CartItem, CartItemConfig } from "@/types/cart";
import { catorcenas2024 } from "@/lib/mockInventory";
import { formatPrice } from "@/lib/pricing";
import { formatShortId } from "@/lib/utils";
import { Calendar as CalendarIcon, Clock, Target, Zap } from "lucide-react";

interface UnifiedBookingConfigProps {
  item: CartItem;
  onUpdate: (itemId: string, config: CartItemConfig) => void;
}

export function UnifiedBookingConfig({ item, onUpdate }: UnifiedBookingConfigProps) {
  const [config, setConfig] = useState<CartItemConfig>(item.config);
  const [selectedDates, setSelectedDates] = useState<{ 
    inicio?: Date; 
    fin?: Date; 
    periodo?: string;
    catorcenasSeleccionadas?: string[];
  }>({});
  
  const { updateItem } = useCartContext();

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
            <Calendar
              mode="single"
              selected={selectedDates.inicio}
              onSelect={(date) => handleDateChange('inicio', date)}
              className="rounded-md border mt-2 pointer-events-auto"
              disabled={(date) => date < new Date()}
            />
          </div>
          <div>
            <Label>Fecha de fin (calculada automáticamente)</Label>
            <div className="mt-2 p-3 border rounded-md bg-muted">
              {selectedDates.fin ? (
                <p className="text-sm">
                  {selectedDates.fin.toLocaleDateString('es-MX', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Selecciona fecha de inicio
                </p>
              )}
            </div>
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
        
        <div className="border-t pt-4">
          <div className="flex justify-between items-center">
            <span className="font-medium">Subtotal ({item.quantity} unidades):</span>
            <span className="text-lg font-bold text-primary">{formatPrice(item.subtotal)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}