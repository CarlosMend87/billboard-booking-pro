import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import { BookingDates, SelectedBillboard } from "@/types/booking";
import { Billboard } from "@/types/billboard";
import { Loader } from "@googlemaps/js-api-loader";

// Mock data - En producción esto vendría de la API
const mockBillboards: Billboard[] = [
  {
    id: "1",
    type: "fixed",
    location: "Av. Insurgentes Sur 123, CDMX",
    size: { width_meters: 14, height_meters: 7 },
    monthlyPrice: 45000,
    status: "available"
  },
  {
    id: "2",
    type: "digital",
    location: "Polanco, Miguel Hidalgo, CDMX",
    size: { width_meters: 10, height_meters: 6, width_pixels: 1920, height_pixels: 1080 },
    maxClients: 15,
    currentClients: [],
    pricePerMonth: 25000,
    status: "available",
    availableSlots: 15
  },
  {
    id: "3",
    type: "fixed",
    location: "Santa Fe, Álvaro Obregón, CDMX",
    size: { width_meters: 12, height_meters: 6 },
    monthlyPrice: 38000,
    status: "available"
  }
];

interface BillboardMapProps {
  selectedDates: BookingDates | null;
  onBillboardSelect: (billboard: Billboard) => void;
  selectedBillboards: SelectedBillboard[];
}

export function BillboardMap({ 
  selectedDates, 
  onBillboardSelect,
  selectedBillboards 
}: BillboardMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const availableBillboards = selectedDates 
    ? mockBillboards.filter(b => b.status === "available")
    : [];

  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current) return;

      const loader = new Loader({
        apiKey: "AIzaSyB1ErtrPfoAKScTZR7Fa2pnxf47BRImu80",
        version: "weekly",
        libraries: ["places", "geometry"]
      });

      try {
        await loader.load();
        
        const mapInstance = new google.maps.Map(mapRef.current, {
          center: { lat: 19.4326, lng: -99.1332 }, // CDMX
          zoom: 11,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            }
          ]
        });

        // Add markers for available billboards
        availableBillboards.forEach((billboard, index) => {
          // Mock coordinates for demo - in production these would come from the billboard data
          const lat = 19.4326 + (Math.random() - 0.5) * 0.1;
          const lng = -99.1332 + (Math.random() - 0.5) * 0.1;
          
          const marker = new google.maps.Marker({
            position: { lat, lng },
            map: mapInstance,
            title: billboard.location,
            icon: {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="20" cy="20" r="15" fill="${billboard.type === 'fixed' ? '#ef4444' : '#3b82f6'}" stroke="white" stroke-width="3"/>
                  <text x="20" y="25" text-anchor="middle" fill="white" font-size="12" font-weight="bold">$</text>
                </svg>
              `),
              scaledSize: new google.maps.Size(40, 40),
            }
          });

          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div class="p-2">
                <div class="font-semibold">${billboard.location}</div>
                <div class="text-sm text-gray-600">${billboard.size.width_meters}m × ${billboard.size.height_meters}m</div>
                <div class="text-lg font-bold text-green-600">
                  $${(billboard.type === "fixed" ? billboard.monthlyPrice : billboard.pricePerMonth || 0).toLocaleString('es-MX')} MXN/mes
                </div>
                <button class="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600" 
                        onclick="window.selectBillboard('${billboard.id}')">
                  Seleccionar
                </button>
              </div>
            `
          });

          marker.addListener("click", () => {
            infoWindow.open(mapInstance, marker);
          });

          // Make billboard selection available globally for the info window button
          (window as any).selectBillboard = (billboardId: string) => {
            const selectedBillboard = availableBillboards.find(b => b.id === billboardId);
            if (selectedBillboard) {
              onBillboardSelect(selectedBillboard);
              infoWindow.close();
            }
          };
        });

        setMap(mapInstance);
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading Google Maps:", error);
        setIsLoading(false);
      }
    };

    if (selectedDates) {
      initMap();
    }
  }, [selectedDates, onBillboardSelect]);

  if (isLoading) {
    return (
      <Card className="h-[600px] flex items-center justify-center">
        <CardContent className="text-center space-y-4">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto animate-pulse" />
          <div>
            <h3 className="text-lg font-semibold mb-2">Cargando Mapa</h3>
            <p className="text-muted-foreground">
              Preparando el mapa interactivo con los anuncios disponibles...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Google Maps */}
      <Card className="h-[500px] overflow-hidden">
        <div ref={mapRef} className="w-full h-full" />
      </Card>

      {/* Lista de anuncios en el mapa */}
      {selectedDates && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableBillboards.map((billboard) => {
            const isSelected = selectedBillboards.some(item => item.billboard.id === billboard.id);
            const price = billboard.type === "fixed" ? billboard.monthlyPrice : billboard.pricePerMonth || 0;
            
            return (
              <Card key={billboard.id} className={`transition-all hover:shadow-medium ${isSelected ? 'ring-2 ring-primary' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <Badge variant={billboard.type === "fixed" ? "secondary" : "default"}>
                        {billboard.type === "fixed" ? "Fijo" : "Digital"}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        ${price.toLocaleString('es-MX')} MXN
                      </div>
                      <div className="text-xs text-muted-foreground">por mes</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span className="text-sm">{billboard.location}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {billboard.size.width_meters}m × {billboard.size.height_meters}m
                      {billboard.type === "digital" && billboard.size.width_pixels && (
                        <span> ({billboard.size.width_pixels}×{billboard.size.height_pixels}px)</span>
                      )}
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => onBillboardSelect(billboard)}
                    className="w-full"
                    variant={isSelected ? "secondary" : "default"}
                  >
                    {isSelected ? "Seleccionado" : "Seleccionar"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      
      {!selectedDates && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              Selecciona las fechas de tu campaña para ver los anuncios disponibles en el mapa
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}