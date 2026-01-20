import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  X, 
  Heart, 
  Share, 
  Star, 
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
  precio: any;
  medidas: any;
  digital: any;
  fotos: string[];
  contratacion: any;
  has_computer_vision: boolean;
  status: string;
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

  useEffect(() => {
    if (open) {
      setCurrentImageIndex(0);
      setMapLoaded(false);
      // Simulate map loading
      const timer = setTimeout(() => setMapLoaded(true), 500);
      return () => clearTimeout(timer);
    }
  }, [open, screen?.id]);

  if (!screen) return null;

  const images = screen.fotos?.length > 0 ? screen.fotos : ["/placeholder.svg"];
  
  const getPrecioMensual = () => {
    if (typeof screen.precio === 'object' && screen.precio?.mensual) {
      return screen.precio.mensual;
    }
    if (typeof screen.precio === 'number') {
      return screen.precio;
    }
    return 25000;
  };

  const getMedidas = () => {
    if (typeof screen.medidas === 'object') {
      return `${screen.medidas.ancho || 0}m x ${screen.medidas.alto || 0}m`;
    }
    return "Consultar";
  };

  const getArea = () => {
    if (typeof screen.medidas === 'object' && screen.medidas.ancho && screen.medidas.alto) {
      return (screen.medidas.ancho * screen.medidas.alto).toFixed(1);
    }
    return "N/A";
  };

  const isDigital = () => {
    if (typeof screen.digital === 'object') {
      return screen.digital.es_digital === true;
    }
    return screen.tipo === 'digital' || screen.tipo === 'led';
  };

  const getModalidades = () => {
    if (typeof screen.contratacion === 'object') {
      const modalidades = [];
      if (screen.contratacion.mensual) modalidades.push("Mensual");
      if (screen.contratacion.catorcena) modalidades.push("Catorcena");
      if (screen.contratacion.semanal) modalidades.push("Semanal");
      if (screen.contratacion.impresiones) modalidades.push("Por impresiones");
      return modalidades;
    }
    return ["Mensual"];
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

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
          <img
            src={images[currentImageIndex]}
            alt={screen.nombre}
            className="w-full h-full object-cover"
          />
          
          {images.length > 1 && (
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
              
              {/* Thumbnails */}
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
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-foreground text-foreground" />
                  <span className="font-medium">4.8</span>
                  <span className="text-muted-foreground">(24 campañas)</span>
                </div>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground capitalize">{screen.tipo}</span>
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
                  <span className="font-medium">{getMedidas()}</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-muted/50 rounded-xl">
                  <Monitor className="h-6 w-6 mb-2 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Área</span>
                  <span className="font-medium">{getArea()} m²</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-muted/50 rounded-xl">
                  <Users className="h-6 w-6 mb-2 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Impactos/mes</span>
                  <span className="font-medium">250K+</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-muted/50 rounded-xl">
                  <Clock className="h-6 w-6 mb-2 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Disponible</span>
                  <span className="font-medium text-emerald-600">Ahora</span>
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

            <Separator />

            {/* Map */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Ubicación</h2>
              <div className="aspect-video bg-muted rounded-xl overflow-hidden relative">
                {mapLoaded ? (
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
                    <div className="animate-pulse text-muted-foreground">Cargando mapa...</div>
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {screen.ubicacion || screen.direccion}
              </p>
            </div>
          </div>

          {/* Right Column - Booking Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 border border-border rounded-xl p-6 shadow-lg bg-card">
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-2xl font-semibold">
                  ${getPrecioMensual().toLocaleString("es-MX")}
                </span>
                <span className="text-muted-foreground">MXN / mes</span>
              </div>

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
                    <span className="text-sm">Mensual</span>
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

              <Separator className="my-6" />

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="underline">${getPrecioMensual().toLocaleString("es-MX")} x 1 mes</span>
                  <span>${getPrecioMensual().toLocaleString("es-MX")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="underline">Tarifa de servicio</span>
                  <span>${Math.round(getPrecioMensual() * 0.1).toLocaleString("es-MX")}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>${Math.round(getPrecioMensual() * 1.1).toLocaleString("es-MX")} MXN</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
