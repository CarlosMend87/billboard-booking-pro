import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { MapPin, Monitor, Building, Loader2, Camera, Users, Compass, TrendingUp, Calendar } from "lucide-react";
import { InventoryFilters } from "@/pages/DisponibilidadAnuncios";
import { InventoryAsset } from "@/lib/mockInventory";
import { CartItemModalidad, CartItemConfig } from "@/types/cart";
import { Loader } from "@googlemaps/js-api-loader";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { supabase } from "@/integrations/supabase/client";
import { formatTruncatedId } from "@/lib/utils";

interface AvailableInventoryMapProps {
  filters: InventoryFilters;
  onAddToCart: (asset: InventoryAsset, modalidad: CartItemModalidad, config: CartItemConfig, quantity?: number) => void;
}

// No mock data - using real billboards from Supabase

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
  const [isLoading, setIsLoading] = useState(true);
  const [billboards, setBillboards] = useState<MapBillboard[]>([]);
  const [selectedBillboard, setSelectedBillboard] = useState<MapBillboard | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  useEffect(() => {
    const fetchBillboards = async () => {
      try {
        const { data, error } = await supabase
          .from('billboards')
          .select('*')
          .eq('status', 'disponible');

        if (error) throw error;

        // Use only real billboards from Supabase
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

  // Get marker color based on billboard status and type
  const getMarkerColor = (billboard: MapBillboard) => {
    if (billboard.tipo === 'digital') return '#3b82f6'; // blue for digital
    return '#10b981'; // green for disponible fijo
  };

  const getMarkerIcon = (billboard: MapBillboard) => {
    return billboard.tipo === 'digital' ? '📱' : '📋';
  };

  // Calculate statistics
  const stats = {
    total: billboards.length,
    digital: billboards.filter(b => b.tipo === 'digital').length,
    fijo: billboards.filter(b => b.tipo !== 'digital').length,
    withCV: billboards.filter(b => b.has_computer_vision).length,
  };

  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current || billboards.length === 0) return;

      try {
        const loader = new Loader({
          apiKey: "AIzaSyB1ErtrPfoAKScTZR7Fa2pnxf47BRImu80",
          version: "weekly",
          libraries: ["places", "geometry"]
        });

        const { Map } = await loader.importLibrary("maps");
        const { AdvancedMarkerElement } = await loader.importLibrary("marker");

        // Center map on Mexico (geographic center)
        const center = { lat: 23.6345, lng: -102.5528 };

        const map = new Map(mapRef.current, {
          center,
          zoom: 5, // Zoom level appropriate for viewing all of Mexico
          mapId: "available-inventory-map",
          streetViewControl: false,
          mapTypeControl: false,
        });

        mapInstanceRef.current = map;

        // Create markers with clustering
        const markers: google.maps.marker.AdvancedMarkerElement[] = [];

        billboards.forEach((billboard) => {
          const markerElement = document.createElement('div');
          markerElement.style.cursor = 'pointer';
          markerElement.style.transition = 'all 0.3s ease';
          markerElement.className = 'billboard-marker';
          
          const markerColor = getMarkerColor(billboard);
          const markerContent = document.createElement('div');
          markerContent.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 6px 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            border: 3px solid ${markerColor};
            min-width: 70px;
            text-align: center;
            transition: all 0.3s ease;
          `;
          
          const markerIcon = document.createElement('div');
          markerIcon.style.fontSize = '18px';
          markerIcon.style.lineHeight = '1';
          markerIcon.textContent = getMarkerIcon(billboard);
          
          const markerPrice = document.createElement('div');
          markerPrice.style.fontSize = '11px';
          markerPrice.style.fontWeight = 'bold';
          markerPrice.style.color = markerColor;
          markerPrice.style.marginTop = '2px';
          const price = billboard.precio?.mensual || 0;
          markerPrice.textContent = `$${(price / 1000).toFixed(0)}K`;
          
          markerContent.appendChild(markerIcon);
          markerContent.appendChild(markerPrice);
          markerElement.appendChild(markerContent);

          const marker = new AdvancedMarkerElement({
            map,
            position: { lat: billboard.lat, lng: billboard.lng },
            content: markerElement,
            title: billboard.nombre
          });

          // Hover effect
          markerElement.addEventListener('mouseenter', () => {
            markerElement.style.transform = 'scale(1.15) translateY(-5px)';
            markerContent.style.boxShadow = '0 6px 20px rgba(0,0,0,0.25)';
          });

          markerElement.addEventListener('mouseleave', () => {
            markerElement.style.transform = 'scale(1) translateY(0)';
            markerContent.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
          });

          markerElement.addEventListener('click', () => {
            setSelectedBillboard(billboard);
            setIsPanelOpen(true);
            map.panTo({ lat: billboard.lat, lng: billboard.lng });
            map.setZoom(Math.max(map.getZoom() || 12, 12));
          });

          markers.push(marker);
        });

        // Add marker clustering
        new MarkerClusterer({
          map,
          markers,
          algorithmOptions: {
            maxZoom: 14,
          },
        });

        setIsLoading(false);
      } catch (error) {
        console.error("Error loading map:", error);
        setIsLoading(false);
      }
    };

    initMap();
  }, [billboards]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  };

  const recenterMap = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter({ lat: 23.6345, lng: -102.5528 });
      mapInstanceRef.current.setZoom(5);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Mapa de Inventario - México
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={recenterMap}
              className="flex items-center gap-2"
            >
              <Compass className="h-4 w-4" />
              Recentrar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 rounded-md">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Cargando mapa...</span>
                </div>
              </div>
            )}
            
            <div 
              ref={mapRef} 
              className="w-full h-[600px] rounded-md bg-muted"
            />
            
            {/* Mini Stats Cards Over Map */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
              <Card className="bg-background/95 backdrop-blur-sm border-2 border-primary/20 shadow-lg">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="text-lg font-bold text-primary">{stats.total}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-background/95 backdrop-blur-sm border-2 border-blue-500/20 shadow-lg">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Digitales</p>
                      <p className="text-lg font-bold text-blue-500">{stats.digital}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-background/95 backdrop-blur-sm border-2 border-green-500/20 shadow-lg">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Fijas</p>
                      <p className="text-lg font-bold text-green-500">{stats.fijo}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-background/95 backdrop-blur-sm border-2 border-purple-500/20 shadow-lg">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <Camera className="h-4 w-4 text-purple-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Con IA</p>
                      <p className="text-lg font-bold text-purple-500">{stats.withCV}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Map Legend */}
            <div className="absolute bottom-4 right-4 bg-background/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border">
              <h4 className="font-medium text-sm mb-2">Leyenda</h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#3b82f6' }}></div>
                  <span>Digital</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#10b981' }}></div>
                  <span>Fija</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Floating Side Panel for Selected Billboard */}
      <Sheet open={isPanelOpen} onOpenChange={setIsPanelOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          {selectedBillboard && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  {selectedBillboard.tipo === 'digital' ? (
                    <Monitor className="h-5 w-5 text-blue-500" />
                  ) : (
                    <Building className="h-5 w-5 text-green-500" />
                  )}
                  {selectedBillboard.nombre}
                </SheetTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    ID: {formatTruncatedId(selectedBillboard.id)}
                  </Badge>
                  {selectedBillboard.has_computer_vision && (
                    <Badge variant="default" className="bg-purple-600 text-xs">
                      <Camera className="h-3 w-3 mr-1" />
                      IA Activa
                    </Badge>
                  )}
                  <Badge className="bg-green-600 text-xs">Disponible</Badge>
                </div>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Photo */}
                <div className="rounded-lg overflow-hidden bg-muted">
                  <img 
                    src={`https://static.wixstatic.com/media/3aa6d8_ec45742e0c7642e29fff05d6e9636202~mv2.png/v1/fill/w_980,h_651,al_c,q_90,usm_0.66_1.00_0.01,enc_avif,quality_auto/Espectacular%202.png`}
                    alt={selectedBillboard.nombre}
                    className="w-full h-48 object-cover"
                  />
                </div>

                {/* Detection Stats */}
                {selectedBillboard.has_computer_vision && selectedBillboard.last_detection_count > 0 && (
                  <Card className="bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                          <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {selectedBillboard.last_detection_count.toLocaleString()}
                          </p>
                          <p className="text-sm text-purple-600 dark:text-purple-400">
                            personas detectadas ayer
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Technical Details */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Detalles Técnicos
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground">Tipo</p>
                        <p className="font-semibold">
                          {selectedBillboard.tipo === 'digital' ? 'Digital' : 'Espectacular'}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground">Dimensiones</p>
                        <p className="font-semibold">
                          {selectedBillboard.medidas?.ancho_m || 6}m × {selectedBillboard.medidas?.alto_m || 3}m
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">Ubicación</p>
                          <p className="font-medium">{selectedBillboard.direccion}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {selectedBillboard.lat.toFixed(4)}, {selectedBillboard.lng.toFixed(4)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Pricing */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Precio y Disponibilidad
                  </h3>

                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground mb-1">Precio Mensual</p>
                      <p className="text-3xl font-bold text-primary">
                        {formatPrice(selectedBillboard.precio?.mensual || 0)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">+ IVA</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <Button 
                    className="w-full"
                    size="lg"
                    onClick={() => {
                      const asset: InventoryAsset = {
                        id: selectedBillboard.id,
                        tipo: selectedBillboard.tipo as any,
                        nombre: selectedBillboard.nombre,
                        lat: selectedBillboard.lat,
                        lng: selectedBillboard.lng,
                        medidas: selectedBillboard.medidas,
                        contratacion: { mensual: true },
                        precio: selectedBillboard.precio,
                        estado: 'disponible',
                        foto: 'https://static.wixstatic.com/media/3aa6d8_ec45742e0c7642e29fff05d6e9636202~mv2.png/v1/fill/w_980,h_651,al_c,q_90,usm_0.66_1.00_0.01,enc_avif,quality_auto/Espectacular%202.png'
                      };
                      onAddToCart(asset, 'mensual', { fechaInicio: '', fechaFin: '' });
                      setIsPanelOpen(false);
                    }}
                  >
                    Agregar al Carrito
                  </Button>
                  <Button 
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      // Open in new window with Google Street View
                      window.open(
                        `https://www.google.com/maps/@${selectedBillboard.lat},${selectedBillboard.lng},3a,75y,90t/data=!3m6!1e1!3m4!1s0!2e0!7i13312!8i6656`,
                        '_blank'
                      );
                    }}
                  >
                    Ver Street View
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Available Billboards List */}
      <Card>
        <CardHeader>
          <CardTitle>Anuncios en el Mapa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {billboards.map((billboard) => (
              <div
                key={billboard.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent ${
                  selectedBillboard?.id === billboard.id ? 'border-primary bg-accent' : ''
                }`}
                onClick={() => setSelectedBillboard(billboard)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={billboard.tipo === 'digital' ? 'default' : 'secondary'} className="text-xs">
                      {billboard.tipo === 'digital' ? (
                        <>
                          <Monitor className="h-3 w-3 mr-1" />
                          Digital
                        </>
                      ) : (
                        <>
                          <Building className="h-3 w-3 mr-1" />
                          Espectacular
                        </>
                      )}
                    </Badge>
                    {billboard.has_computer_vision && (
                      <Badge variant="default" className="text-xs bg-blue-600">
                        <Camera className="h-3 w-3 mr-1" />
                        IA
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{formatTruncatedId(billboard.id)}</span>
                </div>
                <h4 className="font-medium text-sm">{billboard.nombre}</h4>
                <p className="text-xs text-muted-foreground mb-1">{billboard.direccion}</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-primary">
                    {formatPrice(billboard.precio?.mensual || 0)}/mes
                  </p>
                  {billboard.has_computer_vision && billboard.last_detection_count > 0 && (
                    <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                      <Users className="h-3 w-3" />
                      <span className="font-medium">{billboard.last_detection_count.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}