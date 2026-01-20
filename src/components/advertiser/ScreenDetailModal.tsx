import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  X, 
  Heart, 
  Share, 
  MapPin, 
  Monitor, 
  Eye, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Ruler,
  Zap,
  Users,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ScreenDetail {
  id: string;
  nombre: string;
  direccion: string;
  ubicacion: string;
  tipo: string;
  lat: number;
  lng: number;
  precio: Record<string, number> | null;
  medidas: Record<string, number | string> | null;
  digital: Record<string, boolean | string | number> | null;
  fotos: string[];
  contratacion: Record<string, boolean | number> | null;
  has_computer_vision: boolean;
  status: string;
  last_detection_count?: number | null;
}

interface ScreenDetailModalProps {
  screen: ScreenDetail | null;
  open: boolean;
  onClose: () => void;
  onReserve: (screen: ScreenDetail) => void;
}

export function ScreenDetailModal({ screen, open, onClose, onReserve }: ScreenDetailModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (open) {
      setCurrentImageIndex(0);
      setMapLoaded(false);
      setImageError(false);
      const timer = setTimeout(() => setMapLoaded(true), 500);
      return () => clearTimeout(timer);
    }
  }, [open, screen?.id]);

  if (!screen) return null;

  const images = screen.fotos?.length > 0 ? screen.fotos : [];
  const hasImages = images.length > 0 && !imageError;
  
  // Obtener precio mensual real
  const getPrecioMensual = (): number | null => {
    if (!screen.precio) return null;
    
    if (typeof screen.precio === 'object') {
      if (screen.precio.mensual) return screen.precio.mensual;
      if (screen.precio.catorcenal) return screen.precio.catorcenal * 2;
      if (screen.precio.semanal) return screen.precio.semanal * 4;
    }
    
    return null;
  };

  // Obtener medidas reales
  const getMedidas = (): string => {
    if (!screen.medidas) return "Sin datos";
    
    const ancho = screen.medidas.ancho || screen.medidas.ancho_m;
    const alto = screen.medidas.alto || screen.medidas.alto_m;
    
    if (ancho && alto) {
      // Detectar si son pixeles o metros
      if (Number(ancho) > 100 || Number(alto) > 100) {
        return `${ancho} x ${alto} px`;
      }
      return `${ancho}m x ${alto}m`;
    }
    
    if (screen.medidas.dimension_pixel) {
      return screen.medidas.dimension_pixel as string;
    }
    
    return "Sin datos";
  };

  // Obtener área real
  const getArea = (): string => {
    if (!screen.medidas) return "N/A";
    
    const ancho = Number(screen.medidas.ancho || screen.medidas.ancho_m || 0);
    const alto = Number(screen.medidas.alto || screen.medidas.alto_m || 0);
    
    if (ancho > 0 && alto > 0) {
      // Si son pixeles, no calcular área en m²
      if (ancho > 100 || alto > 100) {
        return "Digital";
      }
      return `${(ancho * alto).toFixed(1)} m²`;
    }
    
    return "N/A";
  };

  // Calcular impactos reales
  const getImpactos = (): string => {
    if (screen.has_computer_vision && screen.last_detection_count) {
      const mensual = screen.last_detection_count * 30;
      if (mensual >= 1000000) return `${(mensual / 1000000).toFixed(1)}M`;
      if (mensual >= 1000) return `${(mensual / 1000).toFixed(0)}K`;
      return mensual.toString();
    }
    
    // Si es digital, estimar basado en slots
    if (screen.digital && screen.digital.slots_por_hora) {
      const slotsHora = Number(screen.digital.slots_por_hora) || 12;
      const estimado = slotsHora * 16 * 30 * 50;
      return `~${(estimado / 1000).toFixed(0)}K`;
    }
    
    return "Sin datos";
  };

  const isDigital = (): boolean => {
    return screen.tipo === 'digital' || 
           (screen.digital !== null && Boolean(screen.digital.cantidad_slots));
  };

  // Obtener modalidades reales de contratación
  const getModalidades = (): string[] => {
    if (!screen.contratacion) return [];
    
    const modalidades: string[] = [];
    if (screen.contratacion.mensual) modalidades.push("Mensual");
    if (screen.contratacion.catorcenal) modalidades.push("Catorcenal");
    if (screen.contratacion.semanal) modalidades.push("Semanal");
    if (screen.contratacion.dia) modalidades.push("Diario");
    if (screen.contratacion.hora) modalidades.push("Por hora");
    if (screen.contratacion.spot) modalidades.push("Por spot");
    if (screen.contratacion.programatico) modalidades.push("Programático");
    
    return modalidades.length > 0 ? modalidades : ["Consultar"];
  };

  // Obtener precios por modalidad
  const getPreciosPorModalidad = (): { modalidad: string; precio: number }[] => {
    if (!screen.precio || typeof screen.precio !== 'object') return [];
    
    const precios: { modalidad: string; precio: number }[] = [];
    
    if (screen.precio.mensual) precios.push({ modalidad: "Mensual", precio: screen.precio.mensual });
    if (screen.precio.catorcenal) precios.push({ modalidad: "Catorcenal", precio: screen.precio.catorcenal });
    if (screen.precio.semanal) precios.push({ modalidad: "Semanal", precio: screen.precio.semanal });
    if (screen.precio.dia) precios.push({ modalidad: "Diario", precio: screen.precio.dia });
    if (screen.precio.spot) precios.push({ modalidad: "Spot", precio: screen.precio.spot });
    
    return precios;
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const precioMensual = getPrecioMensual();
  const precios = getPreciosPorModalidad();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-6 py-4 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="gap-2 rounded-full">
              <Share className="h-4 w-4" />
              <span className="hidden sm:inline">Compartir</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2 rounded-full"
              onClick={() => setIsFavorite(!isFavorite)}
            >
              <Heart className={cn("h-4 w-4", isFavorite && "fill-rose-500 text-rose-500")} />
              <span className="hidden sm:inline">Guardar</span>
            </Button>
          </div>
        </div>

        {/* Image Gallery */}
        <div className="relative aspect-[16/9] bg-muted">
          {hasImages ? (
            <img
              src={images[currentImageIndex]}
              alt={screen.nombre}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <Monitor className="h-16 w-16 text-muted-foreground mb-3" />
              <span className="text-muted-foreground">Sin imágenes disponibles</span>
            </div>
          )}
          
          {hasImages && images.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {images.slice(0, 5).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      index === currentImageIndex ? "bg-white scale-125" : "bg-white/60"
                    )}
                  />
                ))}
                {images.length > 5 && (
                  <span className="text-white text-xs ml-2">+{images.length - 5}</span>
                )}
              </div>
            </>
          )}

          {/* Badges */}
          <div className="absolute top-4 left-4 flex gap-2">
            {isDigital() && (
              <Badge className="bg-primary text-primary-foreground">
                <Zap className="h-3 w-3 mr-1" />
                Digital
              </Badge>
            )}
            {screen.has_computer_vision && (
              <Badge className="bg-emerald-500 text-white">
                <Eye className="h-3 w-3 mr-1" />
                Computer Vision
              </Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title Section */}
            <div>
              <h1 className="text-2xl font-semibold text-foreground">{screen.nombre}</h1>
              <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{screen.direccion}</span>
              </div>
              <div className="flex items-center gap-4 mt-3">
                <span className="text-muted-foreground capitalize">{screen.tipo}</span>
                <span className="text-muted-foreground">•</span>
                <span className={cn(
                  "capitalize",
                  screen.status === 'disponible' ? "text-emerald-600" : "text-muted-foreground"
                )}>
                  {screen.status}
                </span>
              </div>
            </div>

            <Separator />

            {/* Specifications */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Especificaciones</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col items-center p-4 bg-muted/50 rounded-xl">
                  <Ruler className="h-6 w-6 mb-2 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Dimensiones</span>
                  <span className="font-medium text-center">{getMedidas()}</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-muted/50 rounded-xl">
                  <Monitor className="h-6 w-6 mb-2 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Área</span>
                  <span className="font-medium">{getArea()}</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-muted/50 rounded-xl">
                  <Users className="h-6 w-6 mb-2 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Impactos/mes</span>
                  <span className="font-medium">{getImpactos()}</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-muted/50 rounded-xl">
                  <Clock className="h-6 w-6 mb-2 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Estado</span>
                  <span className={cn(
                    "font-medium",
                    screen.status === 'disponible' ? "text-emerald-600" : "text-amber-600"
                  )}>
                    {screen.status === 'disponible' ? 'Disponible' : screen.status}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Modalidades */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Modalidades de contratación</h2>
              <div className="flex flex-wrap gap-2">
                {getModalidades().map((modalidad) => (
                  <Badge key={modalidad} variant="outline" className="py-2 px-4">
                    <Calendar className="h-4 w-4 mr-2" />
                    {modalidad}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Precios por modalidad */}
            {precios.length > 0 && (
              <>
                <Separator />
                <div>
                  <h2 className="text-lg font-semibold mb-4">Precios</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {precios.map(({ modalidad, precio }) => (
                      <div key={modalidad} className="p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm text-muted-foreground block">{modalidad}</span>
                        <span className="font-semibold">
                          ${precio.toLocaleString("es-MX")} MXN
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Map */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Ubicación</h2>
              <div className="aspect-video bg-muted rounded-xl overflow-hidden relative">
                {mapLoaded && screen.lat && screen.lng ? (
                  <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${screen.lat},${screen.lng}&zoom=15`}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="animate-pulse text-muted-foreground">
                      {!screen.lat || !screen.lng ? "Ubicación no disponible" : "Cargando mapa..."}
                    </div>
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {screen.direccion}
              </p>
            </div>
          </div>

          {/* Right Column - Booking Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 border border-border rounded-xl p-6 shadow-lg bg-card">
              {precioMensual !== null ? (
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-2xl font-semibold">
                    ${precioMensual.toLocaleString("es-MX")}
                  </span>
                  <span className="text-muted-foreground">MXN / mes</span>
                </div>
              ) : (
                <div className="mb-4">
                  <span className="text-lg font-medium text-muted-foreground">
                    Precio bajo consulta
                  </span>
                </div>
              )}

              <div className="space-y-4">
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2">
                    <div className="p-3 border-r border-b border-border">
                      <label className="text-xs font-medium text-muted-foreground block">INICIO</label>
                      <span className="text-sm">Seleccionar</span>
                    </div>
                    <div className="p-3 border-b border-border">
                      <label className="text-xs font-medium text-muted-foreground block">FIN</label>
                      <span className="text-sm">Seleccionar</span>
                    </div>
                  </div>
                  <div className="p-3">
                    <label className="text-xs font-medium text-muted-foreground block">MODALIDAD</label>
                    <span className="text-sm">{getModalidades()[0] || "Mensual"}</span>
                  </div>
                </div>

                <Button 
                  className="w-full py-6 text-base font-medium rounded-lg"
                  onClick={() => onReserve(screen)}
                >
                  Reservar pantalla
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  No se te cobrará todavía
                </p>
              </div>

              {precioMensual !== null && (
                <>
                  <Separator className="my-6" />

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="underline">${precioMensual.toLocaleString("es-MX")} x 1 mes</span>
                      <span>${precioMensual.toLocaleString("es-MX")}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="underline">Tarifa de servicio</span>
                      <span>${Math.round(precioMensual * 0.1).toLocaleString("es-MX")}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total estimado</span>
                      <span>${Math.round(precioMensual * 1.1).toLocaleString("es-MX")} MXN</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
