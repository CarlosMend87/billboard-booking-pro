import { useState, useEffect } from "react";
import { ShoppingCart, X, Trash2, ChevronUp, ChevronDown, AlertTriangle, Loader2, Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export interface FloatingCartItem {
  id: string;
  billboardId: string;
  nombre: string;
  ubicacion: string;
  tipo: string;
  precio: number;
  fechaInicio: Date;
  fechaFin: Date;
  isValid: boolean;
  validationError?: string;
}

interface FloatingCartProps {
  items: FloatingCartItem[];
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  isValidating?: boolean;
  activeDates?: { startDate?: Date; endDate?: Date };
}

const formatPrice = (price: number) => 
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(price);

const formatDate = (date: Date) => 
  date.toLocaleDateString("es-MX", { day: "numeric", month: "short" });

export function FloatingCart({ items, onRemoveItem, onClearCart, isValidating, activeDates }: FloatingCartProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [wasExpanded, setWasExpanded] = useState(false);
  const navigate = useNavigate();

  // Auto-expand when first item is added
  useEffect(() => {
    if (items.length > 0 && !wasExpanded) {
      setIsExpanded(true);
      setWasExpanded(true);
    }
    if (items.length === 0) {
      setIsExpanded(false);
      setWasExpanded(false);
    }
  }, [items.length, wasExpanded]);

  const validItems = items.filter(item => item.isValid);
  const invalidItems = items.filter(item => !item.isValid);
  const total = validItems.reduce((sum, item) => sum + item.precio, 0);
  const canCheckout = validItems.length > 0 && invalidItems.length === 0 && !isValidating;

  if (items.length === 0 && !isExpanded) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 100, scale: 0.8 }}
        className={cn(
          "fixed bottom-6 right-6 z-50 bg-background rounded-2xl shadow-2xl border border-border",
          "max-w-md w-full md:w-96",
          isExpanded ? "max-h-[70vh]" : ""
        )}
        style={{ 
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0,0,0,0.05)" 
        }}
      >
        {/* Header - Always visible */}
        <div 
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 rounded-t-2xl transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <ShoppingCart className="h-5 w-5 text-primary-foreground" />
              </div>
              {items.length > 0 && (
                <Badge 
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                  variant={invalidItems.length > 0 ? "destructive" : "default"}
                >
                  {items.length}
                </Badge>
              )}
            </div>
            <div>
              <p className="font-semibold text-foreground">
                {items.length === 0 ? "Carrito vacío" : `${items.length} pantalla${items.length !== 1 ? 's' : ''}`}
              </p>
              {items.length > 0 && (
                <p className="text-sm text-muted-foreground">{formatPrice(total)}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isValidating && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            {invalidItems.length > 0 && (
              <AlertTriangle className="h-4 w-4 text-destructive" />
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8">
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Expanded content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <Separator />
              
              {/* Active dates indicator */}
              {activeDates?.startDate && activeDates?.endDate && (
                <div className="px-4 py-2 bg-muted/50 flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Fechas:</span>
                  <span className="font-medium">
                    {formatDate(activeDates.startDate)} - {formatDate(activeDates.endDate)}
                  </span>
                </div>
              )}

              {items.length === 0 ? (
                <div className="p-6 text-center">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    Agrega pantallas para comenzar tu reserva
                  </p>
                </div>
              ) : (
                <>
                  <ScrollArea className="max-h-64">
                    <div className="p-4 space-y-3">
                      {items.map((item) => (
                        <div 
                          key={item.id}
                          className={cn(
                            "p-3 rounded-lg border transition-colors",
                            item.isValid 
                              ? "bg-background border-border" 
                              : "bg-destructive/5 border-destructive/30"
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{item.nombre}</p>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate">{item.ubicacion}</span>
                              </div>
                              <div className="flex items-center justify-between mt-2">
                                <Badge variant="outline" className="text-xs capitalize">
                                  {item.tipo}
                                </Badge>
                                <span className="font-semibold text-sm">{formatPrice(item.precio)}</span>
                              </div>
                              {!item.isValid && item.validationError && (
                                <div className="flex items-center gap-1 mt-2 text-xs text-destructive">
                                  <AlertTriangle className="h-3 w-3" />
                                  <span>{item.validationError}</span>
                                </div>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemoveItem(item.id);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  <Separator />
                  
                  {/* Footer */}
                  <div className="p-4 space-y-3">
                    {invalidItems.length > 0 && (
                      <div className="p-2 rounded-lg bg-destructive/10 text-destructive text-xs flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span>
                          {invalidItems.length} pantalla{invalidItems.length !== 1 ? 's' : ''} no disponible{invalidItems.length !== 1 ? 's' : ''} en las fechas seleccionadas
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Total estimado:</span>
                      <span className="text-xl font-bold text-primary">{formatPrice(total)}</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onClearCart}
                        className="flex-1"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Limpiar
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        disabled={!canCheckout}
                        onClick={() => navigate("/booking-wizard")}
                      >
                        Continuar Reserva
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
