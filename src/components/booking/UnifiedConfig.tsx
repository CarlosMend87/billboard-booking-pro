import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { CartItem, CartItemConfig } from "@/types/cart";
import { catorcenas2024 } from "@/lib/mockInventory";
import { formatPrice } from "@/lib/pricing";
import { Calendar as CalendarIcon, Clock, Target, Zap } from "lucide-react";

interface UnifiedConfigProps {
  item: CartItem;
  onUpdate: (itemId: string, config: CartItemConfig) => void;
}

export function UnifiedConfig({ item, onUpdate }: UnifiedConfigProps) {
  const [config, setConfig] = useState<CartItemConfig>(item.config);
  const [selectedDates, setSelectedDates] = useState<{ inicio?: Date; fin?: Date; periodo?: string }>({});

  const handleConfigChange = (newConfig: Partial<CartItemConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    onUpdate(item.id, updatedConfig);
  };

  const handleDateChange = (type: 'inicio' | 'fin', date: Date | undefined) => {
    if (!date) return;
    
    const newDates = { ...selectedDates, [type]: date };
    setSelectedDates(newDates);
    
    handleConfigChange({
      fechaInicio: newDates.inicio?.toISOString().split('T')[0],
      fechaFin: newDates.fin?.toISOString().split('T')[0]
    });
  };

  const handleCatorcenaChange = (periodo: string) => {
    const catorcena = catorcenas2024.find(c => c.periodo === periodo);
    if (!catorcena) return;
    
    setSelectedDates({ periodo });
    handleConfigChange({
      fechaInicio: catorcena.inicio,
      fechaFin: catorcena.fin,
      periodo
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
      'rotativo': 'Rotativo',
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

  const renderModalidadConfig = () => {
    if (item.asset.tipo === 'digital') {
      return (
        <div className="space-y-4">
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
    } else {
      return (
        <div className="space-y-4">
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
        </div>
      );
    }
  };

  const renderProgramacion = () => {
    if (item.asset.tipo === 'digital') {
      return (
        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="font-medium">Configuración Digital</span>
            </div>
            
            <div className="text-sm space-y-1">
              {item.modalidad === 'spot' && (
                <>
                  <p><strong>Spots por día:</strong> {config.spotsDia || 1}</p>
                  <p><strong>Duración:</strong> {config.dias || 1} días</p>
                  <p><strong>Total spots:</strong> {(config.spotsDia || 1) * (config.dias || 1)}</p>
                </>
              )}
              
              {item.modalidad === 'hora' && (
                <>
                  <p><strong>Horas por día:</strong> {config.horas || 1}</p>
                  <p><strong>Duración:</strong> {config.dias || 1} días</p>
                  <p><strong>Total horas:</strong> {(config.horas || 1) * (config.dias || 1)}</p>
                </>
              )}
              
              {item.modalidad === 'dia' && (
                <p><strong>Duración:</strong> {config.dias || 1} días completos</p>
              )}
              
              {item.modalidad === 'cpm' && (
                <p><strong>Impresiones objetivo:</strong> {(config.impresiones || 10000).toLocaleString()}</p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Fecha de inicio de campaña</Label>
              <Calendar
                mode="single"
                selected={selectedDates.inicio}
                onSelect={(date) => handleDateChange('inicio', date)}
                className="rounded-md border mt-2"
                disabled={(date) => date < new Date()}
              />
            </div>
            <div>
              <Label>Fecha de fin de campaña</Label>
              <Calendar
                mode="single"
                selected={selectedDates.fin}
                onSelect={(date) => handleDateChange('fin', date)}
                className="rounded-md border mt-2"
                disabled={(date) => {
                  const inicio = selectedDates.inicio;
                  return date < new Date() || (inicio && date <= inicio);
                }}
              />
            </div>
          </div>
        </div>
      );
    } else {
      if (item.modalidad === 'catorcenal') {
        return (
          <div className="space-y-4">
            <Label>Selecciona catorcenas disponibles</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
              {catorcenas2024.map((catorcena) => {
                const isSelected = selectedDates.periodo === catorcena.periodo;
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
            
            {selectedDates.periodo && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-primary" />
                  <span className="font-medium">Catorcena seleccionada:</span>
                </div>
                <div className="mt-1 text-sm">
                  {(() => {
                    const selected = catorcenas2024.find(c => c.periodo === selectedDates.periodo);
                    if (!selected) return null;
                    return (
                      <span>
                        <strong>C{selected.numero.toString().padStart(2, '0')}</strong> - 
                        Del {new Date(selected.inicio).toLocaleDateString('es-MX', { 
                          day: 'numeric', 
                          month: 'long',
                          year: 'numeric' 
                        })} al {new Date(selected.fin).toLocaleDateString('es-MX', { 
                          day: 'numeric', 
                          month: 'long',
                          year: 'numeric' 
                        })}
                      </span>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        );
      } else {
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Fecha de inicio</Label>
              <Calendar
                mode="single"
                selected={selectedDates.inicio}
                onSelect={(date) => handleDateChange('inicio', date)}
                className="rounded-md border mt-2"
                disabled={(date) => date < new Date()}
              />
            </div>
            <div>
              <Label>Fecha de fin</Label>
              <Calendar
                mode="single"  
                selected={selectedDates.fin}
                onSelect={(date) => handleDateChange('fin', date)}
                className="rounded-md border mt-2"
                disabled={(date) => {
                  const inicio = selectedDates.inicio;
                  return date < new Date() || (inicio && date <= inicio);
                }}
              />
            </div>
          </div>
        );
      }
    }
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
              <Badge variant="secondary" className="text-xs">
                ID: {item.asset.id.slice(-6)}
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
        <div>
          <h4 className="font-medium mb-3">Configuración de Modalidad</h4>
          {renderModalidadConfig()}
        </div>

        <div>
          <h4 className="font-medium mb-3">Programación y Fechas</h4>
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