import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, CheckCircle, ShoppingCart, Trash2, X } from "lucide-react";
import { useCartContext } from "@/context/CartContext";
import { useCartValidation } from "@/context/CartValidationContext";
import { UnifiedBookingConfig } from "@/components/booking/UnifiedBookingConfig";
import { formatPrice } from "@/lib/pricing";
import { formatShortId } from "@/lib/utils";
import { Link, useNavigate } from "react-router-dom";
import { CartItemConfig, CartItemModalidad } from "@/types/cart";
import { useReservations } from "@/hooks/useReservations";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { buildLegacyCartFromFloatingItems } from "@/lib/cartLegacy";

type WizardStep = 1 | 2 | 3;

/**
 * Generate user-namespaced storage key for cart data
 * Prevents cart data leakage between users
 */
function getCartStorageKey(userId: string | undefined, suffix: string): string {
  if (!userId) return `cart_anonymous_${suffix}`;
  return `cart_anunciante_${userId}_${suffix}`;
}

export default function BookingWizard() {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const { cart, addItem, updateQuantity, removeItem, clearCart, loadCart } = useCartContext();
  const { clearCart: clearFloatingCart } = useCartValidation();
  const { createReservationsFromCart, loading } = useReservations();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [unavailableAssetIds, setUnavailableAssetIds] = useState<Set<string>>(new Set());

  const lastExploreUrl = useMemo(() => {
    return localStorage.getItem("dooh_last_explore_url") || "/explorar";
  }, []);
  
  const [itemConfigs, setItemConfigs] = useState<{[key: string]: CartItemConfig}>({});

  // Hidratación robusta: si CartContext viene vacío, intentar reconstruir desde el carrito persistido de /explorar
  // Uses user-namespaced keys for proper isolation
  useEffect(() => {
    if (cart.items.length > 0) return;

    try {
      // Use user-namespaced key
      const cartKey = getCartStorageKey(user?.id, "items");
      const rawFloating = localStorage.getItem(cartKey);
      if (!rawFloating) return;

      const parsed = JSON.parse(rawFloating) as any[];
      const floatingItems = parsed.map((item) => ({
        ...item,
        fechaInicio: new Date(item.fechaInicio),
        fechaFin: new Date(item.fechaFin),
      }));

      const legacy = buildLegacyCartFromFloatingItems(floatingItems);
      if (legacy.items.length > 0) {
        loadCart(legacy);
        toast({
          title: "Carrito restaurado",
          description: "Recuperamos tu selección para continuar la reserva.",
        });
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Revalidación al entrar (no borra items; solo marca y bloquea avanzar)
  useEffect(() => {
    const run = async () => {
      if (cart.items.length === 0) return;

      try {
        const results = await Promise.all(
          cart.items.map(async (item) => {
            const start = item.config?.fechaInicio;
            const end = item.config?.fechaFin;
            if (!start || !end) return { assetId: item.asset.id, ok: false };

            const { data, error } = await supabase.rpc("check_billboard_availability", {
              p_billboard_id: item.asset.id,
              p_start_date: new Date(start).toISOString().split("T")[0],
              p_end_date: new Date(end).toISOString().split("T")[0],
            });

            if (error) return { assetId: item.asset.id, ok: false };
            return { assetId: item.asset.id, ok: Boolean(data) };
          })
        );

        const bad = new Set(results.filter((r) => !r.ok).map((r) => r.assetId));
        setUnavailableAssetIds(bad);

        if (bad.size > 0) {
          toast({
            title: "Hay pantallas no disponibles",
            description: "Actualiza fechas o elimina pantallas marcadas para continuar.",
            variant: "destructive",
          });
        }
      } catch {
        // ignore
      }
    };

    run();
  }, [cart.items]);

  const hasBlockingAvailabilityIssues = unavailableAssetIds.size > 0;
  
  const handleConfigUpdate = (itemId: string, config: CartItemConfig) => {
    setItemConfigs(prev => ({ ...prev, [itemId]: config }));
  };

  const handleConfirmReservation = async () => {
    try {
      const reservations = await createReservationsFromCart(cart.items);
      
      // Send confirmation email
      if (user?.email && reservations.length > 0) {
        try {
          await supabase.functions.invoke('send-confirmation', {
            body: {
              email: user.email,
              reservations: reservations,
              total: cart.total
            }
          });
        } catch (emailError) {
          console.error('Error sending confirmation email:', emailError);
          // Don't block the process if email fails
        }
      }
      
      // Clear both CartContext and floating cart persistence
      clearCart();
      
      // Clear the floating cart from context (this will also clear localStorage and DB)
      clearFloatingCart();
      
      toast({
        title: "Reservas Creadas",
        description: "Tus reservas han sido enviadas a los propietarios. Recibirás un correo de confirmación con el resumen.",
      });
      navigate('/progreso-campaña');
    } catch (error) {
      // Error is already handled by useReservations hook
      console.error('Error creating reservations:', error);
    }
  };
  
  const steps = [
    { number: 1, title: "Inventario Seleccionado", description: "Revisa y edita tu selección" },
    { number: 2, title: "Configuración Completa", description: "Modalidad, fechas y horarios" },
    { number: 3, title: "Resumen", description: "Confirma tu reserva" }
  ];

  const progress = (currentStep / 3) * 100;

  const getAvailableModalidades = (item: any): CartItemModalidad[] => {
    const modalidades: CartItemModalidad[] = [];
    if (item.asset.contratacion.mensual) modalidades.push('mensual');
    if (item.asset.contratacion.catorcenal) modalidades.push('catorcenal');
    if (item.asset.contratacion.semanal) modalidades.push('semanal');
    if (item.asset.contratacion.spot) modalidades.push('spot');
    if (item.asset.contratacion.hora) modalidades.push('hora');
    if (item.asset.contratacion.dia) modalidades.push('dia');
    if (item.asset.contratacion.cpm) modalidades.push('cpm');
    return modalidades;
  };

  const handleChangeModalidad = (itemId: string, newModalidad: CartItemModalidad) => {
    const item = cart.items.find(i => i.id === itemId);
    if (!item) return;
    
    // Remove old item and add new one with updated modalidad
    removeItem(itemId);
    addItem(item.asset, newModalidad, item.config);
    
    toast({
      title: "Modalidad actualizada",
      description: "La modalidad de compra ha sido cambiada exitosamente",
    });
  };

  const getModalidadLabel = (modalidad: CartItemModalidad): string => {
    const labels: Record<CartItemModalidad, string> = {
      mensual: 'Mensual',
      catorcenal: 'Catorcenal',
      semanal: 'Semanal',
      spot: 'Spot',
      hora: 'Por Hora',
      dia: 'Por Día',
      cpm: 'CPM',
    };
    return labels[modalidad];
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Inventario Seleccionado</h2>
          <p className="text-muted-foreground">Revisa los anuncios que agregaste a tu carrito</p>
        </div>
        {cart.items.length > 0 && (
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => {
              clearCart();
              toast({
                title: "Carrito vaciado",
                description: "Todos los anuncios han sido eliminados del carrito",
              });
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Limpiar Carrito
          </Button>
        )}
      </div>
      
      {cart.items.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              Tu carrito está vacío o no se pudo restaurar. Vuelve a “Explorar” y agrega pantallas para continuar.
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button asChild variant="outline">
                <Link to={lastExploreUrl}>Volver a explorar</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {cart.items.map((item) => {
            const availableModalidades = getAvailableModalidades(item);
            const hasMultipleModalidades = availableModalidades.length > 1;
            const isUnavailable = unavailableAssetIds.has(item.asset.id);
            
            return (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium">{item.asset.nombre}</h3>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline">{item.asset.tipo}</Badge>
                            <Badge variant="outline" className="text-xs">
                              ID: {formatShortId(item.asset.id)}
                            </Badge>
                              {isUnavailable && (
                                <Badge variant="destructive" className="text-xs">
                                  No disponible
                                </Badge>
                              )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            removeItem(item.id);
                            toast({
                              title: "Anuncio eliminado",
                              description: "El anuncio ha sido eliminado del carrito",
                            });
                          }}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {hasMultipleModalidades && (
                        <div className="mt-3 space-y-1">
                          <label className="text-sm text-muted-foreground">
                            Tipo de compra:
                          </label>
                          <Select
                            value={item.modalidad}
                            onValueChange={(value) => handleChangeModalidad(item.id, value as CartItemModalidad)}
                          >
                            <SelectTrigger className="w-[200px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {availableModalidades.map((modalidad) => (
                                <SelectItem key={modalidad} value={modalidad}>
                                  {getModalidadLabel(modalidad)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      
                      {!hasMultipleModalidades && (
                        <div className="mt-2">
                          <Badge variant="secondary">{getModalidadLabel(item.modalidad)}</Badge>
                        </div>
                      )}
                      
                      <div className="mt-3 text-right">
                        <p className="font-semibold text-lg">{formatPrice(item.subtotal)}</p>
                        <p className="text-sm text-muted-foreground">Cantidad: {item.quantity}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          
          <Card className="border-primary">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-xl font-bold text-primary">{formatPrice(cart.total)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Configuración Completa</h2>
      <p className="text-muted-foreground">Configura modalidad, fechas y horarios para cada anuncio</p>
      
      <div className="space-y-4">
        {cart.items.map((item) => (
          <UnifiedBookingConfig 
            key={item.id} 
            item={item} 
            onUpdate={handleConfigUpdate}
          />
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Resumen Final</h2>
      <p className="text-muted-foreground">Revisa todos los detalles antes de confirmar</p>
      
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Desglose Detallado de Campaña</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {cart.items.map((item) => {
              const config = itemConfigs[item.id] || item.config;
              const creativos = (config as any)?.creativos;
              const tipo = item.asset.tipo?.toLowerCase() || '';
              const isDigital = tipo.includes('digital') || tipo.includes('led') || tipo.includes('pantalla') || !!item.asset.digital;
              const medidas = item.asset.medidas as any;
              
              return (
                <div key={item.id} className="space-y-3 pb-6 border-b last:border-b-0 last:pb-0">
                  {/* Encabezado */}
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-lg">{item.asset.nombre}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline">{item.asset.tipo}</Badge>
                        <Badge variant="secondary">{item.modalidad}</Badge>
                        <Badge variant="outline" className="text-xs">
                          ID: {formatShortId(item.asset.id)}
                        </Badge>
                      </div>
                    </div>
                    <p className="font-semibold text-lg">{formatPrice(item.subtotal)}</p>
                  </div>

                  {/* Detalles de configuración */}
                  <div className="grid grid-cols-2 gap-4 text-sm bg-muted/50 p-3 rounded-lg">
                    <div>
                      <span className="font-medium">Modalidad:</span>
                      <p className="text-muted-foreground capitalize">{item.modalidad}</p>
                    </div>
                    
                    {config.meses && (
                      <div>
                        <span className="font-medium">Meses:</span>
                        <p className="text-muted-foreground">{config.meses}</p>
                      </div>
                    )}
                    
                    {config.catorcenas && (
                      <div>
                        <span className="font-medium">Catorcenas:</span>
                        <p className="text-muted-foreground">{config.catorcenas}</p>
                      </div>
                    )}
                    
                    {config.spotsDia && (
                      <div>
                        <span className="font-medium">Spots por día:</span>
                        <p className="text-muted-foreground">{config.spotsDia}</p>
                      </div>
                    )}
                    
                    {config.horas && (
                      <div>
                        <span className="font-medium">Horas por día:</span>
                        <p className="text-muted-foreground">{config.horas}</p>
                      </div>
                    )}
                    
                    {config.dias && (
                      <div>
                        <span className="font-medium">Días:</span>
                        <p className="text-muted-foreground">{config.dias}</p>
                      </div>
                    )}
                    
                    {config.impresiones && (
                      <div>
                        <span className="font-medium">Impresiones:</span>
                        <p className="text-muted-foreground">{config.impresiones.toLocaleString()}</p>
                      </div>
                    )}
                  </div>

                  {/* Fechas */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Fecha de inicio:</span>
                      <p className="text-muted-foreground">
                        {config.fechaInicio ? new Date(config.fechaInicio).toLocaleDateString('es-MX', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'No seleccionada'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Fecha de fin:</span>
                      <p className="text-muted-foreground">
                        {config.fechaFin ? new Date(config.fechaFin).toLocaleDateString('es-MX', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'No seleccionada'}
                      </p>
                    </div>
                  </div>

                  {/* Resolución/Medidas */}
                  <div className="text-sm">
                    <span className="font-medium">Medidas de la pantalla:</span>
                    <p className="text-muted-foreground">
                      {medidas?.ancho || 0}m × {medidas?.alto || 0}m
                      {isDigital && (item.asset.digital as any)?.dimension_pixel && (
                        <span className="ml-2">
                          • Resolución: <Badge variant="outline" className="ml-1">
                            {(item.asset.digital as any).dimension_pixel}
                          </Badge>
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Información de creativos */}
                  {creativos && (
                    <div className="space-y-2 bg-primary/5 p-3 rounded-lg">
                      <p className="font-medium text-sm">Material creativo:</p>
                      {isDigital ? (
                        <div className="text-sm">
                          <span className="text-muted-foreground">
                            Archivos digitales cargados para resolución requerida
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-1 text-sm">
                          <div>
                            <span className="font-medium">Quién imprime: </span>
                            <span className="text-muted-foreground capitalize">
                              {creativos.quienImprime === 'cliente' ? 'El cliente' : 'El propietario'}
                            </span>
                          </div>
                          {creativos.quienImprime === 'cliente' && creativos.fechaEnvioMaterial && (
                            <div>
                              <span className="font-medium">Fecha de envío: </span>
                              <span className="text-muted-foreground">
                                {new Date(creativos.fechaEnvioMaterial).toLocaleDateString('es-MX', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="text-sm text-muted-foreground">
                    Cantidad: {item.quantity} unidad{item.quantity > 1 ? 'es' : ''}
                  </div>
                </div>
              );
            })}
            
            <div className="flex justify-between items-center text-lg font-bold pt-4 border-t">
              <span>Total Final:</span>
              <span className="text-primary">{formatPrice(cart.total)}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-primary">
          <CardContent className="p-6 text-center">
            <div className="space-y-4">
              <CheckCircle className="h-12 w-12 text-primary mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">¿Listo para confirmar?</h3>
                <p className="text-muted-foreground">
                  Al confirmar, tu reserva quedará en estado HOLD por 48 horas
                </p>
              </div>
              <Button size="lg" className="w-full" onClick={handleConfirmReservation} disabled={loading}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                {loading ? "Procesando..." : "Confirmar Reserva - HOLD 48h"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );


  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      default: return renderStep1();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
            Continuar Compra
          </h1>
          
          {/* Progress Bar */}
          <div className="space-y-2 mb-6">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-sm text-muted-foreground">
              {steps.map((step) => (
                <div key={step.number} className={`text-center ${currentStep >= step.number ? 'text-primary font-medium' : ''}`}>
                  <div className="font-medium">{step.title}</div>
                  <div className="text-xs">{step.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {renderCurrentStep()}
          
          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1) as WizardStep)}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>
            
            <Button
              onClick={() => {
                if (hasBlockingAvailabilityIssues) {
                  toast({
                    title: "No puedes continuar",
                    description: "Hay pantallas marcadas como no disponibles. Ajusta fechas o elimínalas.",
                    variant: "destructive",
                  });
                  return;
                }
                setCurrentStep(Math.min(3, currentStep + 1) as WizardStep);
              }}
              disabled={currentStep === 3 || cart.items.length === 0 || hasBlockingAvailabilityIssues}
            >
              Siguiente
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}