import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Monitor, Building, Loader2 } from "lucide-react";
import { InventoryFilters } from "@/pages/DisponibilidadAnuncios";
import { InventoryAsset } from "@/lib/mockInventory";
import { CartItemModalidad, CartItemConfig } from "@/types/cart";
import { Loader } from "@googlemaps/js-api-loader";
import { supabase } from "@/integrations/supabase/client";
import { formatTruncatedId } from "@/lib/utils";

interface AvailableInventoryMapProps {
  filters: InventoryFilters;
  onAddToCart: (asset: InventoryAsset, modalidad: CartItemModalidad, config: CartItemConfig, quantity?: number) => void;
}

interface Billboard {
  id: string;
  nombre: string;
  direccion: string;
  lat: number;
  lng: number;
  tipo: string;
  medidas: any;
  precio: any;
  digital: any;
  fotos: string[];
  owner_id: string;
}

export function AvailableInventoryMap({ filters, onAddToCart }: AvailableInventoryMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [billboards, setBillboards] = useState<Billboard[]>([]);
  const [selectedBillboard, setSelectedBillboard] = useState<Billboard | null>(null);

  // Fetch billboards from database
  useEffect(() => {
    const fetchBillboards = async () => {
      try {
        const { data, error } = await supabase
          .from('billboards')
          .select('*')
          .eq('status', 'disponible');

        if (error) throw error;
        setBillboards((data as Billboard[]) || []);
      } catch (error) {
        console.error("Error fetching billboards:", error);
      }
    };

    fetchBillboards();
  }, []);

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

        // Center map on first billboard or default location
        const centerLat = billboards.length > 0 ? billboards[0].lat : 21.0285;
        const centerLng = billboards.length > 0 ? billboards[0].lng : -89.6064;

        const map = new Map(mapRef.current, {
          center: { lat: centerLat, lng: centerLng },
          zoom: 12,
          mapId: "available-inventory-map",
          streetViewControl: false,
          mapTypeControl: false,
        });

        // Add markers for each billboard
        billboards.forEach((billboard) => {
          const markerElement = document.createElement('div');
          markerElement.style.cursor = 'pointer';
          markerElement.style.transition = 'transform 0.2s';
          
          const markerContent = document.createElement('div');
          const isDigital = billboard.digital || billboard.tipo === 'digital';
          markerContent.style.cssText = `
            background: white;
            border-radius: 8px;
            padding: 4px 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            border: 2px solid ${isDigital ? 'hsl(var(--primary))' : 'hsl(var(--secondary))'};
            min-width: 60px;
            text-align: center;
          `;
          
          const markerIcon = document.createElement('div');
          markerIcon.style.fontSize = '16px';
          markerIcon.style.lineHeight = '1';
          markerIcon.textContent = isDigital ? '📺' : '📋';
          
          const markerPrice = document.createElement('div');
          markerPrice.style.fontSize = '10px';
          markerPrice.style.fontWeight = 'bold';
          markerPrice.style.color = 'hsl(var(--primary))';
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

          markerElement.addEventListener('click', () => {
            setSelectedBillboard(billboard);
            map.panTo({ lat: billboard.lat, lng: billboard.lng });
          });
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Mapa de Inventario Disponible
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
              className="w-full h-96 rounded-md bg-muted"
            />
            
            {/* Map Legend */}
            <div className="absolute top-4 right-4 bg-background/95 backdrop-blur-sm rounded-lg p-3 shadow-lg">
              <h4 className="font-medium text-sm mb-2">Leyenda</h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                  <span>Espectacular Digital</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-secondary rounded-full"></div>
                  <span>Anuncio Fijo</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Billboard Details */}
      {selectedBillboard && (
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {selectedBillboard.digital || selectedBillboard.tipo === 'digital' ? (
                  <Monitor className="h-5 w-5" />
                ) : (
                  <Building className="h-5 w-5" />
                )}
                {selectedBillboard.nombre}
              </CardTitle>
              <Badge variant="outline">
                ID: {formatTruncatedId(selectedBillboard.id)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium">Ubicación</p>
                <p className="text-muted-foreground">{selectedBillboard.direccion}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Dimensiones</p>
                <p className="text-muted-foreground">
                  {selectedBillboard.medidas?.ancho_m || 0}m × {selectedBillboard.medidas?.alto_m || 0}m
                  {selectedBillboard.medidas?.caras > 1 && ` (${selectedBillboard.medidas.caras} caras)`}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Precio Mensual</p>
                <p className="text-lg font-semibold text-primary">
                  {formatPrice(selectedBillboard.precio?.mensual || 0)}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Tipo de espectacular:</p>
              <Badge variant={selectedBillboard.digital || selectedBillboard.tipo === 'digital' ? 'default' : 'secondary'}>
                {selectedBillboard.digital || selectedBillboard.tipo === 'digital' ? 'Digital' : 'Fijo'}
              </Badge>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1">
                Ver Detalles
              </Button>
              <Button className="flex-1">
                Reservar Ahora
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Billboards List */}
      <Card>
        <CardHeader>
          <CardTitle>Anuncios en el Mapa ({billboards.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {billboards.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {billboards.map((billboard) => {
                const isDigital = billboard.digital || billboard.tipo === 'digital';
                return (
                  <div
                    key={billboard.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent ${
                      selectedBillboard?.id === billboard.id ? 'border-primary bg-accent' : ''
                    }`}
                    onClick={() => setSelectedBillboard(billboard)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={isDigital ? 'default' : 'secondary'} className="text-xs">
                        {isDigital ? (
                          <>
                            <Monitor className="h-3 w-3 mr-1" />
                            Digital
                          </>
                        ) : (
                          <>
                            <Building className="h-3 w-3 mr-1" />
                            Fijo
                          </>
                        )}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        ID: {formatTruncatedId(billboard.id)}
                      </span>
                    </div>
                    <h4 className="font-medium text-sm">{billboard.nombre}</h4>
                    <p className="text-xs text-muted-foreground mb-1">{billboard.direccion}</p>
                    <p className="text-sm font-semibold text-primary">
                      {formatPrice(billboard.precio?.mensual || 0)}/mes
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay anuncios disponibles en este momento</p>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}