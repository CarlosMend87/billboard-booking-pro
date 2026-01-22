import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Scale, X, MapPin, Monitor, Users, Ruler, Zap, Calendar, Eye } from "lucide-react";
import { ScreenCardProps } from "./ScreenCard";
import { cn } from "@/lib/utils";
import defaultBillboard from "@/assets/default-billboard.avif";

interface ScreenCompareDrawerProps {
  screens: ScreenCardProps[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onReserve?: (screenId: string) => void;
}

export function ScreenCompareDrawer({ 
  screens, 
  onRemove, 
  onClear,
  onReserve 
}: ScreenCompareDrawerProps) {
  const [open, setOpen] = useState(false);

  const formatPrice = (price: number | null) => {
    if (price === null) return "Consultar";
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatNumber = (num: number | null) => {
    if (num === null) return "N/A";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(0) + "K";
    return num.toString();
  };

  if (screens.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button 
            size="lg" 
            className="shadow-xl gap-2 px-6 rounded-full"
          >
            <Scale className="h-5 w-5" />
            Comparar ({screens.length})
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[85vh] p-0">
          <SheetHeader className="p-6 border-b">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5" />
                Comparar Pantallas ({screens.length})
              </SheetTitle>
              <Button variant="ghost" size="sm" onClick={onClear}>
                Limpiar todo
              </Button>
            </div>
          </SheetHeader>
          
          <ScrollArea className="h-[calc(85vh-80px)]">
            <div className="p-6">
              {/* Comparison Grid */}
              <div className="grid gap-6" style={{ 
                gridTemplateColumns: `repeat(${Math.min(screens.length, 4)}, minmax(280px, 1fr))` 
              }}>
                {screens.map((screen) => (
                  <div 
                    key={screen.id} 
                    className="border rounded-xl overflow-hidden bg-card"
                  >
                    {/* Image */}
                    <div className="relative aspect-[4/3]">
                      <img
                        src={screen.imagenes[0] || defaultBillboard}
                        alt={screen.nombre}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = defaultBillboard;
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 bg-background/80 hover:bg-background rounded-full"
                        onClick={() => onRemove(screen.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <div className="absolute top-2 left-2 flex gap-1">
                        {screen.badge && (
                          <Badge className={cn(
                            screen.badge === "premium" && "bg-amber-500",
                            screen.badge === "alta-demanda" && "bg-rose-500",
                            screen.badge === "disponible" && "bg-green-500"
                          )}>
                            {screen.badge === "premium" ? "Premium" : 
                             screen.badge === "alta-demanda" ? "Alta demanda" : "Disponible"}
                          </Badge>
                        )}
                        {screen.hasComputerVision && (
                          <Badge className="bg-violet-500">
                            <Eye className="h-3 w-3 mr-1" />
                            AI
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4 space-y-4">
                      <div>
                        <h3 className="font-semibold text-lg line-clamp-1">{screen.nombre}</h3>
                        <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                          <MapPin className="h-3 w-3" />
                          <span className="line-clamp-1">{screen.ubicacion}, {screen.ciudad}</span>
                        </div>
                      </div>

                      <Separator />

                      {/* Specs Grid */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-muted-foreground text-xs">Tipo</p>
                            <p className="font-medium capitalize">{screen.tipo || "N/A"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-muted-foreground text-xs">Impactos/mes</p>
                            <p className="font-medium">{formatNumber(screen.impactos)}</p>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Price */}
                      <div className="flex items-baseline justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Precio mensual</p>
                          <p className="text-xl font-bold text-primary">
                            {formatPrice(screen.precio)}
                          </p>
                        </div>
                        {screen.impactos && screen.precio && (
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">CPM</p>
                            <p className="font-medium">
                              ${((screen.precio / screen.impactos) * 1000).toFixed(2)}
                            </p>
                          </div>
                        )}
                      </div>

                      {onReserve && (
                        <Button 
                          className="w-full" 
                          onClick={() => {
                            onReserve(screen.id);
                            setOpen(false);
                          }}
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Reservar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary Table */}
              {screens.length >= 2 && (
                <div className="mt-8 border rounded-xl overflow-hidden">
                  <div className="bg-muted/50 px-4 py-3">
                    <h3 className="font-semibold">Resumen comparativo</h3>
                  </div>
                  <div className="divide-y">
                    {/* Price row */}
                    <div className="grid gap-4 p-4" style={{ 
                      gridTemplateColumns: `150px repeat(${screens.length}, 1fr)` 
                    }}>
                      <div className="font-medium text-muted-foreground">Precio/mes</div>
                      {screens.map((s) => (
                        <div key={s.id} className="font-semibold">
                          {formatPrice(s.precio)}
                        </div>
                      ))}
                    </div>
                    {/* Impacts row */}
                    <div className="grid gap-4 p-4" style={{ 
                      gridTemplateColumns: `150px repeat(${screens.length}, 1fr)` 
                    }}>
                      <div className="font-medium text-muted-foreground">Impactos/mes</div>
                      {screens.map((s) => (
                        <div key={s.id} className="font-semibold">
                          {formatNumber(s.impactos)}
                        </div>
                      ))}
                    </div>
                    {/* CPM row */}
                    <div className="grid gap-4 p-4" style={{ 
                      gridTemplateColumns: `150px repeat(${screens.length}, 1fr)` 
                    }}>
                      <div className="font-medium text-muted-foreground">CPM</div>
                      {screens.map((s) => (
                        <div key={s.id} className="font-semibold">
                          {s.impactos && s.precio 
                            ? `$${((s.precio / s.impactos) * 1000).toFixed(2)}`
                            : "N/A"}
                        </div>
                      ))}
                    </div>
                    {/* Type row */}
                    <div className="grid gap-4 p-4" style={{ 
                      gridTemplateColumns: `150px repeat(${screens.length}, 1fr)` 
                    }}>
                      <div className="font-medium text-muted-foreground">Tipo</div>
                      {screens.map((s) => (
                        <div key={s.id} className="capitalize">
                          {s.tipo || "N/A"}
                        </div>
                      ))}
                    </div>
                    {/* Location row */}
                    <div className="grid gap-4 p-4" style={{ 
                      gridTemplateColumns: `150px repeat(${screens.length}, 1fr)` 
                    }}>
                      <div className="font-medium text-muted-foreground">Ciudad</div>
                      {screens.map((s) => (
                        <div key={s.id}>{s.ciudad}</div>
                      ))}
                    </div>
                    {/* Computer Vision row */}
                    <div className="grid gap-4 p-4" style={{ 
                      gridTemplateColumns: `150px repeat(${screens.length}, 1fr)` 
                    }}>
                      <div className="font-medium text-muted-foreground">AI Vision</div>
                      {screens.map((s) => (
                        <div key={s.id}>
                          {s.hasComputerVision ? (
                            <Badge className="bg-violet-500">Sí</Badge>
                          ) : (
                            <span className="text-muted-foreground">No</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}
