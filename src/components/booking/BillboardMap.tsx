import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Settings } from "lucide-react";
import { BookingDates, SelectedBillboard } from "@/types/booking";
import { Billboard } from "@/types/billboard";

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
  const [mapboxToken, setMapboxToken] = useState<string>("");
  const [needsToken, setNeedsToken] = useState(true);

  // Simulamos el token por ahora
  useEffect(() => {
    // En producción, el token vendría de las variables de entorno
    const token = process.env.MAPBOX_ACCESS_TOKEN || "";
    if (token) {
      setMapboxToken(token);
      setNeedsToken(false);
    }
  }, []);

  const availableBillboards = selectedDates 
    ? mockBillboards.filter(b => b.status === "available")
    : [];

  if (needsToken) {
    return (
      <Card className="h-[600px] flex items-center justify-center">
        <CardContent className="text-center space-y-4">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto" />
          <div>
            <h3 className="text-lg font-semibold mb-2">Configuración de Mapa</h3>
            <p className="text-muted-foreground mb-4">
              Para mostrar el mapa interactivo, necesitas configurar tu token de Mapbox
            </p>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Ingresa tu token de Mapbox"
                className="w-full max-w-md px-3 py-2 border rounded-md"
                onChange={(e) => setMapboxToken(e.target.value)}
              />
              <Button 
                onClick={() => setNeedsToken(false)}
                disabled={!mapboxToken}
              >
                <Settings className="h-4 w-4 mr-2" />
                Configurar Mapa
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Obtén tu token gratuito en{" "}
              <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                mapbox.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mapa simulado */}
      <Card className="h-[400px] bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-dashed">
        <CardContent className="h-full flex items-center justify-center">
          <div className="text-center space-y-2">
            <MapPin className="h-8 w-8 text-primary mx-auto" />
            <p className="text-lg font-medium">Mapa Interactivo</p>
            <p className="text-sm text-muted-foreground">
              Vista de anuncios disponibles en {selectedDates ? "las fechas seleccionadas" : "tiempo real"}
            </p>
            {selectedDates && (
              <Badge variant="secondary">
                {availableBillboards.length} anuncios disponibles
              </Badge>
            )}
          </div>
        </CardContent>
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