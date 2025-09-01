import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Monitor, Building, Loader2 } from "lucide-react";
import { InventoryFilters } from "@/pages/DisponibilidadAnuncios";
import { InventoryAsset } from "@/lib/mockInventory";
import { CartItemModalidad, CartItemConfig } from "@/types/cart";
import { Loader } from "@googlemaps/js-api-loader";

interface AvailableInventoryMapProps {
  filters: InventoryFilters;
  onAddToCart: (asset: InventoryAsset, modalidad: CartItemModalidad, config: CartItemConfig, quantity?: number) => void;
}

// Mock billboard data with coordinates for Mexico City
const mockMapBillboards = [
  {
    id: "ANU-001",
    type: "fixed" as const,
    location: "Av. Insurgentes Sur 123",
    lat: 19.3640,
    lng: -99.1678,
    owner: "JCDecaux",
    price: 25000,
    size: "6m × 3m",
    availableDates: [12, 13, 14, 15, 16, 20, 21, 22]
  },
  {
    id: "DIG-002", 
    type: "digital" as const,
    location: "Av. Reforma 456",
    lat: 19.4260,
    lng: -99.1679,
    owner: "Rentable",
    price: 45000,
    size: "8m × 4m",
    availableDates: [10, 11, 12, 18, 19, 25, 26, 27]
  },
  {
    id: "ANU-003",
    type: "fixed" as const,
    location: "Eje Central 789",
    lat: 19.4000,
    lng: -99.1500,
    owner: "Grupo Vallas",
    price: 18000,
    size: "4m × 2m", 
    availableDates: [5, 6, 7, 8, 15, 16, 17, 28]
  },
  {
    id: "DIG-004",
    type: "digital" as const,
    location: "Periférico Sur 321",
    lat: 19.3200,
    lng: -99.1800,
    owner: "Visual Shot",
    price: 35000,
    size: "10m × 5m",
    availableDates: [14, 15, 16, 17, 18, 24, 25, 26]
  }
];

export function AvailableInventoryMap({ filters, onAddToCart }: AvailableInventoryMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBillboard, setSelectedBillboard] = useState<typeof mockMapBillboards[0] | null>(null);

  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current) return;

      try {
        const loader = new Loader({
          apiKey: "AIzaSyB1ErtrPfoAKScTZR7Fa2pnxf47BRImu80",
          version: "weekly",
          libraries: ["places", "geometry"]
        });

        const { Map } = await loader.importLibrary("maps");
        const { AdvancedMarkerElement } = await loader.importLibrary("marker");

        // Initialize map centered on Mexico City
        const map = new Map(mapRef.current, {
          center: { lat: 19.4326, lng: -99.1332 },
          zoom: 11,
          mapId: "available-inventory-map",
          streetViewControl: false,
          mapTypeControl: false,
        });

        // Add markers for each billboard
        mockMapBillboards.forEach((billboard) => {
          const markerElement = document.createElement('div');
          markerElement.style.cursor = 'pointer';
          markerElement.style.transition = 'transform 0.2s';
          
          const markerContent = document.createElement('div');
          markerContent.style.cssText = `
            background: white;
            border-radius: 8px;
            padding: 4px 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            border: 2px solid ${billboard.type === 'digital' ? 'hsl(var(--primary))' : 'hsl(var(--secondary))'};
            min-width: 60px;
            text-align: center;
          `;
          
          const markerIcon = document.createElement('div');
          markerIcon.style.fontSize = '16px';
          markerIcon.style.lineHeight = '1';
          markerIcon.textContent = billboard.type === 'digital' ? '📺' : '📋';
          
          const markerPrice = document.createElement('div');
          markerPrice.style.fontSize = '10px';
          markerPrice.style.fontWeight = 'bold';
          markerPrice.style.color = 'hsl(var(--primary))';
          markerPrice.textContent = `$${(billboard.price / 1000).toFixed(0)}K`;
          
          markerContent.appendChild(markerIcon);
          markerContent.appendChild(markerPrice);
          markerElement.appendChild(markerContent);

          const marker = new AdvancedMarkerElement({
            map,
            position: { lat: billboard.lat, lng: billboard.lng },
            content: markerElement,
            title: billboard.location
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
  }, []);

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
                {selectedBillboard.type === 'digital' ? (
                  <Monitor className="h-5 w-5" />
                ) : (
                  <Building className="h-5 w-5" />
                )}
                {selectedBillboard.location}
              </CardTitle>
              <Badge variant="outline">
                ID: {selectedBillboard.id}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium">Propietario</p>
                <p className="text-muted-foreground">{selectedBillboard.owner}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Dimensiones</p>
                <p className="text-muted-foreground">{selectedBillboard.size}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Precio Mensual</p>
                <p className="text-lg font-semibold text-primary">
                  {formatPrice(selectedBillboard.price)}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Días disponibles este mes:</p>
              <div className="flex flex-wrap gap-1">
                {selectedBillboard.availableDates.map(date => (
                  <Badge key={date} variant="outline" className="text-xs">
                    {date}
                  </Badge>
                ))}
              </div>
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
          <CardTitle>Anuncios en el Mapa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {mockMapBillboards.map((billboard) => (
              <div
                key={billboard.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent ${
                  selectedBillboard?.id === billboard.id ? 'border-primary bg-accent' : ''
                }`}
                onClick={() => setSelectedBillboard(billboard)}
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={billboard.type === 'digital' ? 'default' : 'secondary'} className="text-xs">
                    {billboard.type === 'digital' ? (
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
                  <span className="text-xs text-muted-foreground">{billboard.id}</span>
                </div>
                <h4 className="font-medium text-sm">{billboard.location}</h4>
                <p className="text-xs text-muted-foreground mb-1">{billboard.owner}</p>
                <p className="text-sm font-semibold text-primary">
                  {formatPrice(billboard.price)}/mes
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}