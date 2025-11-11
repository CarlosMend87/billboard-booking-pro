import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CartItem, CartItemModalidad, CartItemConfig } from "@/types/cart";
import { formatPrice } from "@/lib/pricing";
import { Calendar, Clock, Target, Zap } from "lucide-react";

interface ModalidadConfigProps {
  item: CartItem;
  onUpdate: (itemId: string, config: CartItemConfig) => void;
}

export function ModalidadConfig({ item, onUpdate }: ModalidadConfigProps) {
  const [config, setConfig] = useState<CartItemConfig>(item.config);

  const handleConfigChange = (newConfig: Partial<CartItemConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    onUpdate(item.id, updatedConfig);
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

  const renderTradicionalConfig = () => (
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
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="fechaInicio">Fecha de inicio</Label>
          <Input
            id="fechaInicio"
            type="date"
            value={config.fechaInicio || ''}
            onChange={(e) => handleConfigChange({ fechaInicio: e.target.value })}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="fechaFin">Fecha de fin</Label>
          <Input
            id="fechaFin"
            type="date"
            value={config.fechaFin || ''}
            onChange={(e) => handleConfigChange({ fechaFin: e.target.value })}
            className="mt-1"
          />
        </div>
      </div>
    </div>
  );

  const renderDigitalConfig = () => (
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

  const getIcon = () => {
    switch (item.modalidad) {
      case 'spot': return <Zap className="h-4 w-4" />;
      case 'hora': return <Clock className="h-4 w-4" />;
      case 'cpm': return <Target className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
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
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Precio unitario</p>
            <p className="font-semibold">{formatPrice(item.precioUnitario)}</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {item.asset.tipo === 'digital' ? renderDigitalConfig() : renderTradicionalConfig()}
        
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