import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Trash2, Plus, Minus } from "lucide-react";
import { Cart } from "@/types/cart";
import { formatPrice } from "@/lib/pricing";
import { Link } from "react-router-dom";

interface CartSidebarProps {
  cart: Cart;
  onRemoveItem: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onClearCart: () => void;
}

export function CartSidebar({ cart, onRemoveItem, onUpdateQuantity, onClearCart }: CartSidebarProps) {
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

  return (
    <div className="sticky top-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Carrito de Compras
            {cart.itemCount > 0 && (
              <Badge variant="secondary">{cart.itemCount}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="max-h-[600px] overflow-y-auto">
          {cart.items.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Carrito vacío</h3>
              <p className="text-muted-foreground text-sm">
                Agrega anuncios para comenzar tu reserva
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.items.map((item) => (
                <div key={item.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{item.asset.nombre}</h4>
                      <div className="flex items-center gap-1 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {getTipoLabel(item.asset.tipo)}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {getModalidadLabel(item.modalidad)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          ID: {item.asset.id.slice(-6)}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveItem(item.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm font-medium">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {formatPrice(item.precioUnitario)} c/u
                      </p>
                      <p className="font-semibold">
                        {formatPrice(item.subtotal)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              <Separator />
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-xl font-bold text-primary">
                    {formatPrice(cart.total)}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <Button asChild className="w-full" size="lg">
                    <Link to="/booking-wizard">
                      Continuar a Reserva
                    </Link>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={onClearCart}
                    className="w-full"
                  >
                    Limpiar Carrito
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}