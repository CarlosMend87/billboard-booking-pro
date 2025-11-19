import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Monitor, Building, Loader2, Camera, Users } from "lucide-react";
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
  const [isLoading, setIsLoading] = useState(true);
  const [billboards, setBillboards] = useState<MapBillboard[]>([]);
  const [selectedBillboard, setSelectedBillboard] = useState<MapBillboard | null>(null);

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

        // Center map on Mérida, Yucatán where most billboards are located
        const center = { lat: 20.97, lng: -89.62 };

        const map = new Map(mapRef.current, {
          center,
          zoom: 12, // Zoom level appropriate for Mérida city
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
          markerContent.style.cssText = `
            background: white;
            border-radius: 8px;
            padding: 4px 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            border: 2px solid ${billboard.tipo === 'digital' ? 'hsl(var(--primary))' : 'hsl(var(--secondary))'};
            min-width: 60px;
            text-align: center;
          `;
          
          const markerIcon = document.createElement('div');
          markerIcon.style.fontSize = '16px';
          markerIcon.style.lineHeight = '1';
          markerIcon.textContent = billboard.tipo === 'digital' ? '📺' : '📋';
          
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
            title: billboard.direccion
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
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="flex items-center gap-2">
                  {selectedBillboard.tipo === 'digital' ? (
                    <Monitor className="h-5 w-5" />
                  ) : (
                    <Building className="h-5 w-5" />
                  )}
                  {selectedBillboard.nombre}
                </CardTitle>
                {selectedBillboard.has_computer_vision && (
                  <Badge variant="default" className="bg-blue-600">
                    <Camera className="h-3 w-3 mr-1" />
                    IA Activa
                  </Badge>
                )}
              </div>
              <Badge variant="outline">
                ID: {formatTruncatedId(selectedBillboard.id)}
              </Badge>
            </div>
            {selectedBillboard.has_computer_vision && selectedBillboard.last_detection_count > 0 && (
              <div className="flex items-center gap-2 mt-2 text-sm text-blue-600 dark:text-blue-400">
                <Users className="h-4 w-4" />
                <span className="font-medium">{selectedBillboard.last_detection_count.toLocaleString()}</span>
                <span className="text-muted-foreground">personas detectadas ayer</span>
              </div>
            )}
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
                  {selectedBillboard.medidas?.ancho_m || 6}m × {selectedBillboard.medidas?.alto_m || 3}m
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
              <p className="text-sm font-medium mb-2">Estado:</p>
              <Badge variant="secondary">Disponible</Badge>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  // You can add a modal to show more details here
                }}
              >
                Ver Detalles
              </Button>
              <Button 
                className="flex-1"
                onClick={() => {
                  // Convert billboard to InventoryAsset format
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
                }}
              >
                Agregar al Carrito
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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