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

  // Usar las coordenadas reales de la base de datos
  console.log('Billboards recibidos:', billboards);
  const billboardsWithCoords = billboards.map((billboard) => {
    console.log(`Billboard ${billboard.nombre}: lat=${billboard.lat}, lng=${billboard.lng}`);
    return {
      ...billboard,
      lat: Number(billboard.lat) || 19.432608,
      lng: Number(billboard.lng) || -99.133209
    };
  });

  useEffect(() => {
    const initializeMap = async () => {
      if (!mapRef.current) return;

      try {
        const loader = new Loader({
          apiKey: "AIzaSyB1ErtrPfoAKScTZR7Fa2pnxf47BRImu80",
          version: "weekly",
          libraries: ["places", "geometry"]
        });

        const { Map } = await loader.importLibrary("maps");
        const { AdvancedMarkerElement } = await loader.importLibrary("marker");
        
        const map = new Map(mapRef.current, {
          center: { lat: 19.432608, lng: -99.133209 }, // Ciudad de México
          zoom: 11,
          mapId: "billboard-owner-map",
          streetViewControl: false,
          mapTypeControl: false,
        });

        mapInstanceRef.current = map;

        // Agregar marcadores para cada billboard
        billboardsWithCoords.forEach((billboard) => {
          const markerElement = document.createElement('div');
          markerElement.style.cursor = 'pointer';
          markerElement.style.transition = 'transform 0.2s';
          
          const markerContent = document.createElement('div');
          markerContent.style.cssText = `
            background: white;
            border-radius: 8px;
            padding: 4px 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            border: 2px solid ${getStatusColor(billboard.status)};
            min-width: 60px;
            text-align: center;
          `;
          
          const markerIcon = document.createElement('div');
          markerIcon.style.fontSize = '16px';
          markerIcon.style.lineHeight = '1';
          markerIcon.textContent = '📺';
          
          const markerStatus = document.createElement('div');
          markerStatus.style.fontSize = '9px';
          markerStatus.style.fontWeight = 'bold';
          markerStatus.style.color = getStatusColor(billboard.status);
          markerStatus.textContent = billboard.status.toUpperCase();
          
          markerContent.appendChild(markerIcon);
          markerContent.appendChild(markerStatus);
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

          markerElement.addEventListener('mouseenter', () => {
            markerElement.style.transform = 'scale(1.1)';
          });

          markerElement.addEventListener('mouseleave', () => {
            markerElement.style.transform = 'scale(1)';
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
          apiKey: "AIzaSyB1ErtrPfoAKScTZR7Fa2pnxf47BRImu80",
          version: "weekly",
          libraries: ["places", "geometry"]
        });

        const { Map } = await loader.importLibrary("maps");
        const { AdvancedMarkerElement } = await loader.importLibrary("marker");
        
        const map = new Map(mapRef.current, {
          center: { lat: 19.432608, lng: -99.133209 },
          zoom: 11,
          mapId: "billboard-owner-fullview-map",
          streetViewControl: false,
          mapTypeControl: false,
        });

        // Agregar marcadores
        billboards.forEach((billboard) => {
          const markerElement = document.createElement('div');
          markerElement.style.cursor = 'pointer';
          markerElement.style.transition = 'transform 0.2s';
          
          const markerContent = document.createElement('div');
          markerContent.style.cssText = `
            background: white;
            border-radius: 8px;
            padding: 6px 10px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            border: 2px solid ${billboard.status === 'disponible' ? '#10b981' :
                              billboard.status === 'ocupada' ? '#ef4444' : '#f59e0b'};
            min-width: 80px;
            text-align: center;
          `;
          
          const markerIcon = document.createElement('div');
          markerIcon.style.fontSize = '20px';
          markerIcon.style.lineHeight = '1';
          markerIcon.textContent = '📺';
          
          const markerName = document.createElement('div');
          markerName.style.fontSize = '10px';
          markerName.style.fontWeight = 'bold';
          markerName.style.marginTop = '2px';
          markerName.textContent = billboard.nombre;
          
          const markerStatus = document.createElement('div');
          markerStatus.style.fontSize = '8px';
          markerStatus.style.textTransform = 'uppercase';
          markerStatus.style.color = billboard.status === 'disponible' ? '#10b981' :
                                   billboard.status === 'ocupada' ? '#ef4444' : '#f59e0b';
          markerStatus.textContent = billboard.status;
          
          markerContent.appendChild(markerIcon);
          markerContent.appendChild(markerName);
          markerContent.appendChild(markerStatus);
          markerElement.appendChild(markerContent);

          console.log(`MapFullView - Billboard ${billboard.nombre}: lat=${billboard.lat}, lng=${billboard.lng}`);
          const marker = new AdvancedMarkerElement({
            map,
            position: { lat: Number(billboard.lat), lng: Number(billboard.lng) },
            content: markerElement,
            title: `${billboard.nombre} - ${billboard.direccion}`
          });

          markerElement.addEventListener('mouseenter', () => {
            markerElement.style.transform = 'scale(1.1)';
          });

          markerElement.addEventListener('mouseleave', () => {
            markerElement.style.transform = 'scale(1)';
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