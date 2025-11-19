import { useEffect, useRef, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Monitor, Building, Loader2, Camera, Users, Navigation, Eye, ShoppingCart } from "lucide-react";
import { InventoryFilters } from "@/pages/DisponibilidadAnuncios";
import { InventoryAsset } from "@/lib/mockInventory";
import { CartItemModalidad, CartItemConfig } from "@/types/cart";
import { supabase } from "@/integrations/supabase/client";
import { formatTruncatedId } from "@/lib/utils";
import { useDateAvailability } from "@/hooks/useDateAvailability";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";

interface AvailableInventoryMapProps {
  filters: InventoryFilters;
  onAddToCart: (asset: InventoryAsset, modalidad: CartItemModalidad, config: CartItemConfig, quantity?: number) => void;
}

interface MapBillboard {
  id: string;
  nombre: string;
  direccion: string;
  lat: number;
  lng: number;
  tipo: string;
  owner_id: string;
  precio: any;
  medidas: any;
  has_computer_vision?: boolean;
  last_detection_count?: number;
  last_detection_date?: string;
}

export function AvailableInventoryMap({ filters, onAddToCart }: AvailableInventoryMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const [billboards, setBillboards] = useState<MapBillboard[]>([]);
  const [selectedBillboard, setSelectedBillboard] = useState<MapBillboard | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { loaded: mapsLoaded, loading: mapsLoading, error: mapsError } = useGoogleMaps();
  const { isAvailable } = useDateAvailability(
    filters.dateRange.startDate || new Date(),
    filters.dateRange.endDate || new Date()
  );

  useEffect(() => {
    const fetchBillboards = async () => {
      try {
        const { data, error } = await supabase
          .from('billboards')
          .select('*')
          .eq('status', 'disponible');

        if (error) throw error;

        const realBillboards = data?.map(billboard => ({
          id: billboard.id,
          nombre: billboard.nombre,
          direccion: billboard.direccion,
          lat: Number(billboard.lat),
          lng: Number(billboard.lng),
          tipo: billboard.tipo,
          owner_id: billboard.owner_id,
          precio: billboard.precio,
          medidas: billboard.medidas,
          has_computer_vision: billboard.has_computer_vision || false,
          last_detection_count: billboard.last_detection_count || 0,
          last_detection_date: billboard.last_detection_date
        })) || [];

        setBillboards(realBillboards);
      } catch (error) {
        console.error('Error fetching billboards:', error);
        setBillboards([]);
      }
    };

    fetchBillboards();
  }, []);

  const filteredBillboards = useMemo(() => {
    let filtered = [...billboards];

    if (filters.advancedFilters.billboardTypes.length > 0) {
      filtered = filtered.filter(b => 
        filters.advancedFilters.billboardTypes.includes(b.tipo)
      );
    }

    if (filters.advancedFilters.hasComputerVision !== null) {
      filtered = filtered.filter(b => 
        b.has_computer_vision === filters.advancedFilters.hasComputerVision
      );
    }

    filtered = filtered.filter(b => {
      const mensual = b.precio?.mensual || 0;
      return mensual >= filters.advancedFilters.priceRange[0] && 
             mensual <= filters.advancedFilters.priceRange[1];
    });

    if (filters.dateRange.startDate && filters.dateRange.endDate) {
      filtered = filtered.filter(b => isAvailable(b.id));
    }

    return filtered;
  }, [billboards, filters, isAvailable]);

  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current || !mapsLoaded) return;

      try {
        const { Map } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;
        const center = { lat: 20.97, lng: -89.62 };

        const map = new Map(mapRef.current, {
          center,
          zoom: 12,
          mapId: "available-inventory-map",
          streetViewControl: true,
          mapTypeControl: true,
          fullscreenControl: true,
          zoomControl: true,
        });

        mapInstanceRef.current = map;
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    initMap();
  }, [mapsLoaded]);

  useEffect(() => {
    if (!mapInstanceRef.current || !mapsLoaded) return;

    const updateMarkers = async () => {
      try {
        const { AdvancedMarkerElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;

        markersRef.current.forEach(marker => {
          const element = marker.element as HTMLElement;
          if (element) {
            element.style.transition = 'opacity 0.3s';
            element.style.opacity = '0';
            setTimeout(() => { marker.map = null; }, 300);
          }
        });
        markersRef.current = [];

        filteredBillboards.forEach((billboard) => {
          const markerElement = document.createElement('div');
          markerElement.style.cssText = 'cursor: pointer; transition: all 0.3s ease; opacity: 0; transform: scale(0.8);';
          
          let markerColor = '#3b82f6';
          if (billboard.has_computer_vision) markerColor = '#10b981';
          if (billboard.tipo === 'digital') markerColor = '#8b5cf6';
          
          const markerContent = document.createElement('div');
          markerContent.style.cssText = `background: ${markerColor}; border-radius: 50% 50% 50% 0; padding: 16px; box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3); color: white; font-weight: bold; font-size: 14px; display: flex; align-items: center; justify-content: center; min-width: 48px; min-height: 48px; transform: rotate(-45deg);`;
          
          const iconWrapper = document.createElement('div');
          iconWrapper.style.cssText = 'transform: rotate(45deg);';
          
          const iconMap: Record<string, string> = {
            'espectacular': '📊', 'valla': '🏗️', 'muro': '🧱', 'parabus': '🚌', 'digital': '💻'
          };
          
          iconWrapper.textContent = iconMap[billboard.tipo.toLowerCase()] || '📍';
          markerContent.appendChild(iconWrapper);
          markerElement.appendChild(markerContent);

          const marker = new AdvancedMarkerElement({
            map: mapInstanceRef.current,
            position: { lat: billboard.lat, lng: billboard.lng },
            content: markerElement,
            title: billboard.nombre,
          });

          setTimeout(() => {
            markerElement.style.opacity = '1';
            markerElement.style.transform = 'scale(1)';
          }, 100);

          markerElement.addEventListener('click', () => {
            setSelectedBillboard(billboard);
            setIsSidebarOpen(true);
            mapInstanceRef.current?.panTo({ lat: billboard.lat, lng: billboard.lng });
            mapInstanceRef.current?.setZoom(16);
          });

          markerElement.addEventListener('mouseenter', () => {
            markerElement.style.transform = 'scale(1.15)';
            markerElement.style.zIndex = '1000';
          });

          markerElement.addEventListener('mouseleave', () => {
            markerElement.style.transform = 'scale(1)';
            markerElement.style.zIndex = 'auto';
          });

          markersRef.current.push(marker);
        });

        if (filteredBillboards.length > 0) {
          const bounds = new google.maps.LatLngBounds();
          filteredBillboards.forEach(billboard => {
            bounds.extend({ lat: billboard.lat, lng: billboard.lng });
          });
          mapInstanceRef.current?.fitBounds(bounds, 80);
        }
      } catch (error) {
        console.error('Error updating markers:', error);
      }
    };

    updateMarkers();
  }, [filteredBillboards, mapsLoaded]);

  const handleRecenter = () => {
    if (!mapInstanceRef.current || filteredBillboards.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    filteredBillboards.forEach(billboard => bounds.extend({ lat: billboard.lat, lng: billboard.lng }));
    mapInstanceRef.current.fitBounds(bounds, 80);
  };

  const stats = useMemo(() => {
    const total = filteredBillboards.length;
    const digital = filteredBillboards.filter(b => b.tipo === 'digital').length;
    const withVision = filteredBillboards.filter(b => b.has_computer_vision).length;
    const avgPrice = filteredBillboards.reduce((sum, b) => sum + (b.precio?.mensual || 0), 0) / total || 0;
    return { total, digital, withVision, avgPrice };
  }, [filteredBillboards]);

  return (
    <>
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Pantallas</p>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                </div>
                <MapPin className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Digitales</p>
                  <p className="text-2xl font-bold text-foreground">{stats.digital}</p>
                </div>
                <Monitor className="h-8 w-8 text-purple-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Con Detección</p>
                  <p className="text-2xl font-bold text-foreground">{stats.withVision}</p>
                </div>
                <Camera className="h-8 w-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Precio Prom.</p>
                  <p className="text-2xl font-bold text-foreground">${stats.avgPrice.toFixed(0)}</p>
                </div>
                <Building className="h-8 w-8 text-orange-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="overflow-hidden shadow-soft hover:shadow-medium transition-shadow">
          <CardContent className="p-0 relative">
            {(mapsLoading || !mapsLoaded) && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                <div className="text-center space-y-2">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  <p className="text-sm text-muted-foreground">Cargando mapa...</p>
                </div>
              </div>
            )}
            
            {mapsError && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                <div className="text-center space-y-2 p-4">
                  <p className="text-sm text-destructive">Error al cargar el mapa</p>
                  <p className="text-xs text-muted-foreground">{mapsError.message}</p>
                </div>
              </div>
            )}
            
            <div ref={mapRef} style={{ height: '600px', width: '100%' }} />
            
            <Button onClick={handleRecenter} className="absolute top-4 left-4 shadow-lg bg-card hover:bg-card/90 text-foreground border border-border" size="sm">
              <Navigation className="h-4 w-4 mr-2" />
              Recentrar Mapa
            </Button>
            
            <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm p-4 rounded-lg shadow-medium border border-border">
              <p className="text-xs font-semibold mb-3 text-foreground flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Leyenda de Marcadores
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-4 rounded-full bg-blue-500 shadow-sm" />
                  <span className="text-muted-foreground">Estándar</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-4 rounded-full bg-green-500 shadow-sm" />
                  <span className="text-muted-foreground">Con Detección</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-4 rounded-full bg-purple-500 shadow-sm" />
                  <span className="text-muted-foreground">Digital</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="right" className="w-full sm:w-[400px] overflow-y-auto">
          {selectedBillboard && (
            <>
              <SheetHeader>
                <div className="flex items-center justify-between">
                  <SheetTitle className="text-xl font-bold">{selectedBillboard.nombre}</SheetTitle>
                  <Badge variant="outline" className={selectedBillboard.tipo === 'digital' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' : 'bg-primary/10 text-primary border-primary/20'}>
                    {selectedBillboard.tipo}
                  </Badge>
                </div>
              </SheetHeader>

              <div className="space-y-6 mt-6">
                <div className="w-full h-48 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg flex items-center justify-center border border-border">
                  <div className="text-center">
                    <Building className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Foto no disponible</p>
                  </div>
                </div>

                <div className="space-y-3 p-4 bg-card rounded-lg border border-border">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground mb-1">Ubicación</p>
                      <p className="text-sm text-muted-foreground">{selectedBillboard.direccion}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Lat: {selectedBillboard.lat.toFixed(6)}, Lng: {selectedBillboard.lng.toFixed(6)}
                      </p>
                    </div>
                  </div>
                </div>

                {selectedBillboard.precio && (
                  <div className="space-y-3 p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                    <h3 className="text-sm font-semibold text-foreground mb-3">Precio</h3>
                    <div className="text-center py-4">
                      <p className="text-3xl font-bold text-primary">${selectedBillboard.precio.mensual?.toLocaleString('es-MX')}</p>
                      <p className="text-sm text-muted-foreground mt-1">por mes</p>
                    </div>
                  </div>
                )}

                <Button onClick={() => {
                    const asset: InventoryAsset = {
                      id: selectedBillboard.id, 
                      nombre: selectedBillboard.nombre, 
                      tipo: selectedBillboard.tipo as any,
                      lat: selectedBillboard.lat, 
                      lng: selectedBillboard.lng,
                      medidas: selectedBillboard.medidas, 
                      precio: selectedBillboard.precio,
                      contratacion: { mensual: true },
                      estado: 'disponible',
                      foto: '',
                      digital: selectedBillboard.tipo === 'digital' ? { loop_seg: 10, slot_seg: 5 } : undefined
                    };
                    const startDate = new Date();
                    const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                    onAddToCart(asset, 'mensual', { 
                      fechaInicio: startDate.toISOString(), 
                      fechaFin: endDate.toISOString(), 
                      meses: 1
                    });
                    setIsSidebarOpen(false);
                  }} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg" size="lg">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Agregar al Carrito
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
