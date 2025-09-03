import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useCartContext } from "@/context/CartContext";
import { formatPrice } from "@/lib/pricing";
import { formatShortId } from "@/lib/utils";
import { Minus, Plus, X } from "lucide-react";

interface BookingCartItem {
  id: string;
  asset: {
    id: string;
    nombre: string;
    tipo: string;
    precio: any;
  };
  modalidad: string;
  config: any;
  precioUnitario: number;
  subtotal: number;
  quantity: number;
}

interface PriceDebuggerProps {
  item: BookingCartItem;
  onUpdate: (itemId: string, config: any) => void;
}

export function PriceDebugger({ item, onUpdate }: PriceDebuggerProps) {
  const [config, setConfig] = useState(item.config);
  const { updateItem, removeItem } = useCartContext();

  const handleConfigChange = (key: string, value: number) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    updateItem(item.id, newConfig);
    onUpdate(item.id, newConfig);
  };

  const calculateExpectedPrice = () => {
    const { modalidad, asset } = item;
    
    switch (modalidad) {
      case 'mensual':
        return (asset.precio.mensual || 0) * (config.meses || 1);
      case 'catorcenal':
        const precioCatorcenal = (asset.precio.mensual || 0) / 2;
        return precioCatorcenal * (config.catorcenas || 1);
      case 'spot':
        return (asset.precio.spot || 0) * (config.spotsDia || 1) * (config.dias || 1);
      default:
        return 0;
    }
  };

  const expectedPrice = calculateExpectedPrice();
  const priceMatch = Math.abs(expectedPrice - item.precioUnitario) < 0.01;

  return (
    <Card className={`border-2 ${priceMatch ? 'border-green-500' : 'border-red-500'}`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{item.asset.nombre}</CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline">{item.asset.tipo}</Badge>
              <Badge variant="secondary">{item.modalidad}</Badge>
              <Badge variant="outline" className="text-xs">
                ID: {formatShortId(item.asset.id)}
              </Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeItem(item.id)}
            className="text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Configuration Controls */}
        <div className="space-y-3">
          <h4 className="font-medium">Configuración</h4>
          
          {item.modalidad === 'mensual' && (
            <div className="flex items-center gap-2">
              <Label className="min-w-[80px]">Meses:</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleConfigChange('meses', Math.max(1, (config.meses || 1) - 1))}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <Input
                type="number"
                value={config.meses || 1}
                onChange={(e) => handleConfigChange('meses', parseInt(e.target.value) || 1)}
                className="w-20 text-center"
                min="1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleConfigChange('meses', (config.meses || 1) + 1)}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          )}
          
          {item.modalidad === 'catorcenal' && (
            <div className="flex items-center gap-2">
              <Label className="min-w-[80px]">Catorcenas:</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleConfigChange('catorcenas', Math.max(1, (config.catorcenas || 1) - 1))}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <Input
                type="number"
                value={config.catorcenas || 1}
                onChange={(e) => handleConfigChange('catorcenas', parseInt(e.target.value) || 1)}
                className="w-20 text-center"
                min="1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleConfigChange('catorcenas', (config.catorcenas || 1) + 1)}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          )}
          
          {item.modalidad === 'spot' && (
            <>
              <div className="flex items-center gap-2">
                <Label className="min-w-[80px]">Spots/día:</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleConfigChange('spotsDia', Math.max(1, (config.spotsDia || 1) - 1))}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <Input
                  type="number"
                  value={config.spotsDia || 1}
                  onChange={(e) => handleConfigChange('spotsDia', parseInt(e.target.value) || 1)}
                  className="w-20 text-center"
                  min="1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleConfigChange('spotsDia', (config.spotsDia || 1) + 1)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Label className="min-w-[80px]">Días:</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleConfigChange('dias', Math.max(1, (config.dias || 1) - 1))}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <Input
                  type="number"
                  value={config.dias || 1}
                  onChange={(e) => handleConfigChange('dias', parseInt(e.target.value) || 1)}
                  className="w-20 text-center"
                  min="1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleConfigChange('dias', (config.dias || 1) + 1)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Price Debug Info */}
        <div className="space-y-2 p-3 bg-muted rounded-lg">
          <div className="flex justify-between text-sm">
            <span>Precio Base:</span>
            <span className="font-mono">{formatPrice(item.asset.precio[item.modalidad === 'catorcenal' ? 'mensual' : item.modalidad] || 0)}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span>Precio Esperado:</span>
            <span className={`font-mono ${priceMatch ? 'text-green-600' : 'text-red-600'}`}>
              {formatPrice(expectedPrice)}
            </span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span>Precio Actual:</span>
            <span className={`font-mono ${priceMatch ? 'text-green-600' : 'text-red-600'}`}>
              {formatPrice(item.precioUnitario)}
            </span>
          </div>
          
          <div className="flex justify-between font-medium">
            <span>Subtotal:</span>
            <span className="text-lg text-primary">{formatPrice(item.subtotal)}</span>
          </div>
          
          {!priceMatch && (
            <div className="text-xs text-red-600 mt-2">
              ⚠️ El precio no coincide con el cálculo esperado
            </div>
          )}
        </div>
        
        {/* Configuration Debug */}
        <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
          <strong>Config:</strong> {JSON.stringify(config, null, 2)}
        </div>
      </CardContent>
    </Card>
  );
}