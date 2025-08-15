import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Plus, Minus, Trash2, CreditCard } from "lucide-react";
import { SelectedBillboard } from "@/types/booking";

interface BookingCartProps {
  selectedBillboards: SelectedBillboard[];
  totalCost: number;
  totalBillboards: number;
  onUpdateQuantity: (billboardId: string, newQuantity: number) => void;
  onRemove: (billboardId: string) => void;
  onProceedToCheckout: () => void;
}

export function BookingCart({
  selectedBillboards,
  totalCost,
  totalBillboards,
  onUpdateQuantity,
  onRemove,
  onProceedToCheckout
}: BookingCartProps) {
  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Resumen de Reserva
          </div>
          <Badge variant="secondary">
            {totalBillboards} {totalBillboards === 1 ? 'anuncio' : 'anuncios'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Items del carrito */}
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {selectedBillboards.map((item) => (
            <div key={item.billboard.id} className="border rounded-lg p-3 space-y-2">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <Badge 
                    variant={item.billboard.type === "fixed" ? "secondary" : "default"}
                    className="text-xs mb-1"
                  >
                    {item.billboard.type === "fixed" ? "Fijo" : "Digital"}
                  </Badge>
                  <p className="text-sm font-medium truncate">
                    {item.billboard.location}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.billboard.size.width_meters}m × {item.billboard.size.height_meters}m
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(item.billboard.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Controles de cantidad */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateQuantity(item.billboard.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    className="h-8 w-8 p-0"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="text-sm font-medium w-8 text-center">
                    {item.quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateQuantity(item.billboard.id, item.quantity + 1)}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                
                <div className="text-right">
                  <div className="text-sm font-bold">
                    ${item.totalPrice.toLocaleString('es-MX')}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    MXN
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Separador */}
        <div className="border-t pt-4">
          {/* Total */}
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>${totalCost.toLocaleString('es-MX')} MXN</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>IVA (16%):</span>
              <span>${(totalCost * 0.16).toLocaleString('es-MX')} MXN</span>
            </div>
            <div className="border-t pt-2 flex justify-between items-center">
              <span className="text-lg font-bold">Total:</span>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  ${(totalCost * 1.16).toLocaleString('es-MX')}
                </div>
                <div className="text-sm text-muted-foreground">MXN por mes</div>
              </div>
            </div>
          </div>

          {/* Botón de checkout */}
          <Button 
            onClick={onProceedToCheckout}
            className="w-full bg-gradient-primary hover:bg-primary-hover"
            size="lg"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Proceder a Reserva
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}