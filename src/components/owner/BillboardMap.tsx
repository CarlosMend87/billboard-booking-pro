import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Map, MapPin, Maximize2 } from "lucide-react";
import { Billboard } from "@/hooks/useBillboards";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader } from "@googlemaps/js-api-loader";

interface BillboardMapProps {
  billboards: Billboard[];
}

export function BillboardMap({ billboards }: BillboardMapProps) {
  const [selectedBillboard, setSelectedBillboard] = useState<Billboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'disponible': return '#10b981'; // green-500
      case 'ocupada': return '#ef4444'; // red-500
      case 'mantenimiento': return '#f59e0b'; // amber-500
      default: return '#6b7280'; // gray-500
    }
  };

  // Simulamos coordenadas para los billboards (en producción vendrían de la BD)
  const billboardsWithCoords = billboards.map((billboard, index) => ({
    ...billboard,
    lat: 19.432608 + (Math.random() - 0.5) * 0.1, // Centro de CDMX
    lng: -99.133209 + (Math.random() - 0.5) * 0.1
  }));

  useEffect(() => {
    const initializeMap = async () => {
      if (!mapRef.current) return;

      try {
        const loader = new Loader({
          apiKey: "AIzaSyB_example_key", // Se reemplazará con el secret de Supabase
          version: "weekly",
        });

        await loader.load();
        
        const map = new google.maps.Map(mapRef.current, {
          center: { lat: 19.432608, lng: -99.133209 }, // Ciudad de México
          zoom: 11,
          styles: [
            {
              featureType: "all",
              elementType: "geometry.fill",
              stylers: [{ color: "#f5f5f5" }]
            },
            {
              featureType: "water",
              elementType: "geometry",
              stylers: [{ color: "#e9e9e9" }]
            }
          ]
        });

        mapInstanceRef.current = map;

        // Agregar marcadores para cada billboard
        billboardsWithCoords.forEach((billboard) => {
          const marker = new google.maps.Marker({
            position: { lat: billboard.lat, lng: billboard.lng },
            map: map,
            title: billboard.nombre,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: getStatusColor(billboard.status),
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
              scale: 8
            }
          });

          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div class="p-2">
                <h3 class="font-semibold text-sm">${billboard.nombre}</h3>
                <p class="text-xs text-gray-600">${billboard.direccion}</p>
                <p class="text-xs">Estado: <span style="color: ${getStatusColor(billboard.status)}">${billboard.status}</span></p>
              </div>
            `
          });

          marker.addListener('click', () => {
            setSelectedBillboard(billboard);
            infoWindow.open(map, marker);
          });
        });

        setIsLoading(false);
      } catch (error) {
        console.error('Error loading Google Maps:', error);
        setIsLoading(false);
      }
    };

    initializeMap();
  }, [billboardsWithCoords]);

  return (
    <>
      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5" />
            Mapa de Pantallas
          </CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Maximize2 className="h-4 w-4 mr-1" />
                Vista Completa
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Mapa Interactivo de Pantallas</DialogTitle>
              </DialogHeader>
              <MapFullView billboards={billboardsWithCoords} />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64 bg-muted/30 rounded-lg">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Cargando mapa...</p>
              </div>
            </div>
          ) : (
            <div className="relative h-64 rounded-lg overflow-hidden">
              <div ref={mapRef} className="w-full h-full" />
              
              {/* Leyenda */}
              <div className="absolute bottom-4 left-4 bg-white/90 rounded-lg p-3 text-xs shadow-lg">
                <h4 className="font-medium mb-2">Estado de Pantallas</h4>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span>Disponible</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span>Ocupada</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <span>Mantenimiento</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedBillboard && (
        <Card className="mb-4 border-primary">
          <CardContent className="pt-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{selectedBillboard.nombre}</h3>
                <p className="text-sm text-muted-foreground">{selectedBillboard.direccion}</p>
                <p className="text-sm">Estado: <span className={getStatusColor(selectedBillboard.status)}>
                  {selectedBillboard.status}
                </span></p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setSelectedBillboard(null)}>
                Cerrar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

function MapFullView({ billboards }: { billboards: any[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeFullMap = async () => {
      if (!mapRef.current) return;

      try {
        const loader = new Loader({
          apiKey: "AIzaSyB_example_key", // Se reemplazará con el secret de Supabase
          version: "weekly",
        });

        await loader.load();
        
        const map = new google.maps.Map(mapRef.current, {
          center: { lat: 19.432608, lng: -99.133209 },
          zoom: 11,
          styles: [
            {
              featureType: "all",
              elementType: "geometry.fill",
              stylers: [{ color: "#f5f5f5" }]
            },
            {
              featureType: "water",
              elementType: "geometry",
              stylers: [{ color: "#e9e9e9" }]
            }
          ]
        });

        // Agregar marcadores
        billboards.forEach((billboard) => {
          const marker = new google.maps.Marker({
            position: { lat: billboard.lat, lng: billboard.lng },
            map: map,
            title: billboard.nombre,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: billboard.status === 'disponible' ? '#10b981' :
                        billboard.status === 'ocupada' ? '#ef4444' : '#f59e0b',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
              scale: 10
            }
          });

          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div class="p-3">
                <h3 class="font-semibold">${billboard.nombre}</h3>
                <p class="text-sm text-gray-600">${billboard.direccion}</p>
                <p class="text-sm capitalize">Estado: ${billboard.status}</p>
              </div>
            `
          });

          marker.addListener('click', () => {
            infoWindow.open(map, marker);
          });
        });

        setIsLoading(false);
      } catch (error) {
        console.error('Error loading Google Maps:', error);
        setIsLoading(false);
      }
    };

    initializeFullMap();
  }, [billboards]);

  return (
    <div className="relative h-96 rounded-lg overflow-hidden">
      {isLoading ? (
        <div className="flex items-center justify-center h-full bg-muted/30">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Cargando mapa completo...</p>
          </div>
        </div>
      ) : (
        <div ref={mapRef} className="w-full h-full" />
      )}
    </div>
  );
}