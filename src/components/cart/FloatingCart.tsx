import { useState, useEffect } from "react";
import { ShoppingCart, X, Trash2, ChevronUp, ChevronDown, AlertTriangle, Loader2, Calendar, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
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
  // Additional data for transfer to BookingWizard
  ownerId?: string;
  medidas?: { ancho?: number; alto?: number };
  foto?: string;
}

interface FloatingCartProps {
  items: FloatingCartItem[];
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onContinueReservation?: () => void;
  isValidating?: boolean;
  activeDates?: { startDate?: Date; endDate?: Date };
}

const formatPrice = (price: number) => 
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(price);

const formatDate = (date: Date) => 
  date.toLocaleDateString("es-MX", { day: "numeric", month: "short" });

const formatDateLong = (date: Date) => 
  date.toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

export function FloatingCart({ 
  items, 
  onRemoveItem, 
  onClearCart, 
  onContinueReservation,
  isValidating, 
  activeDates 
}: FloatingCartProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [wasExpanded, setWasExpanded] = useState(false);

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
          "w-[calc(100%-3rem)] max-w-[420px]"
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
              <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center">
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
                <p className="text-sm font-medium text-primary">{formatPrice(total)}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isValidating && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            {invalidItems.length > 0 && (
              <Tooltip>
                <TooltipTrigger>
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{invalidItems.length} pantalla{invalidItems.length !== 1 ? 's' : ''} no disponible{invalidItems.length !== 1 ? 's' : ''}</p>
                </TooltipContent>
              </Tooltip>
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
                <div className="px-4 py-3 bg-muted/50 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Período seleccionado:</p>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="font-medium text-sm truncate">
                          {formatDate(activeDates.startDate)} - {formatDate(activeDates.endDate)}
                        </p>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <p>{formatDateLong(activeDates.startDate)}</p>
                        <p className="text-muted-foreground">al</p>
                        <p>{formatDateLong(activeDates.endDate)}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
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
                  {/* Scrollable items list */}
                  <ScrollArea className="max-h-[280px]">
                    <div className="p-3 space-y-2">
                      {items.map((item) => (
                        <div 
                          key={item.id}
                          className={cn(
                            "p-3 rounded-xl border transition-all",
                            item.isValid 
                              ? "bg-card border-border hover:border-primary/30" 
                              : "bg-destructive/5 border-destructive/30"
                          )}
                        >
                          <div className="flex gap-3">
                            {/* Content */}
                            <div className="flex-1 min-w-0 space-y-1.5">
                              {/* Name with tooltip */}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <p className="font-medium text-sm leading-tight line-clamp-2">
                                    {item.nombre}
                                  </p>
                                </TooltipTrigger>
                                <TooltipContent side="left" className="max-w-[250px]">
                                  <p className="font-medium">{item.nombre}</p>
                                </TooltipContent>
                              </Tooltip>
                              
                              {/* Location with tooltip */}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <MapPin className="h-3 w-3 shrink-0" />
                                    <span className="truncate">{item.ubicacion}</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="left" className="max-w-[300px]">
                                  <p>{item.ubicacion}</p>
                                </TooltipContent>
                              </Tooltip>
                              
                              {/* Type and Price row */}
                              <div className="flex items-center justify-between gap-2 pt-1">
                                <Badge variant="outline" className="text-xs capitalize h-5">
                                  {item.tipo}
                                </Badge>
                                <span className="font-bold text-sm text-primary">
                                  {formatPrice(item.precio)}
                                </span>
                              </div>
                              
                              {/* Dates */}
                              <div className="flex items-center gap-1 text-xs text-muted-foreground pt-0.5">
                                <Calendar className="h-3 w-3 shrink-0" />
                                <span>{formatDate(item.fechaInicio)} - {formatDate(item.fechaFin)}</span>
                              </div>
                              
                              {/* Validation error */}
                              {!item.isValid && item.validationError && (
                                <div className="flex items-start gap-1.5 mt-2 p-2 rounded-lg bg-destructive/10">
                                  <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                                  <span className="text-xs text-destructive leading-tight">
                                    {item.validationError}
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            {/* Remove button */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 self-start"
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
                    {/* Warning for invalid items */}
                    {invalidItems.length > 0 && (
                      <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-destructive">
                              {invalidItems.length} pantalla{invalidItems.length !== 1 ? 's' : ''} no disponible{invalidItems.length !== 1 ? 's' : ''}
                            </p>
                            <p className="text-xs text-destructive/80">
                              Elimínalas o cambia las fechas para continuar
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Total */}
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <span className="text-sm text-muted-foreground">Total estimado</span>
                        <p className="text-xs text-muted-foreground">
                          {validItems.length} de {items.length} pantalla{items.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <span className="text-2xl font-bold text-primary">{formatPrice(total)}</span>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onClearCart}
                        className="flex-shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 gap-2"
                        disabled={!canCheckout}
                        onClick={onContinueReservation}
                      >
                        Continuar Reserva
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Helper text */}
                    {!canCheckout && items.length > 0 && (
                      <p className="text-xs text-center text-muted-foreground">
                        {isValidating 
                          ? "Validando disponibilidad..." 
                          : invalidItems.length > 0 
                            ? "Resuelve los conflictos para continuar"
                            : "Agrega pantallas válidas para continuar"
                        }
                      </p>
                    )}
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