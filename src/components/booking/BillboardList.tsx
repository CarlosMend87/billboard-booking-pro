import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Monitor, Image } from "lucide-react";
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
  },
  {
    id: "4",
    type: "digital",
    location: "Roma Norte, Cuauhtémoc, CDMX",
    size: { width_meters: 8, height_meters: 4, width_pixels: 1600, height_pixels: 900 },
    maxClients: 12,
    currentClients: [],
    pricePerMonth: 18000,
    status: "available",
    availableSlots: 12
  }
];

interface BillboardListProps {
  selectedDates: BookingDates | null;
  onBillboardSelect: (billboard: Billboard) => void;
  selectedBillboards: SelectedBillboard[];
}

export function BillboardList({ 
  selectedDates, 
  onBillboardSelect,
  selectedBillboards 
}: BillboardListProps) {
  const availableBillboards = selectedDates 
    ? mockBillboards.filter(b => b.status === "available")
    : [];

  if (!selectedDates) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">
            Selecciona las fechas de tu campaña para ver los anuncios disponibles
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Anuncios Disponibles</h2>
        <Badge variant="secondary" className="text-base px-3 py-1">
          {availableBillboards.length} disponibles
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {availableBillboards.map((billboard) => {
          const isSelected = selectedBillboards.some(item => item.billboard.id === billboard.id);
          const selectedItem = selectedBillboards.find(item => item.billboard.id === billboard.id);
          const price = billboard.type === "fixed" ? billboard.monthlyPrice : billboard.pricePerMonth || 0;
          
          return (
            <Card 
              key={billboard.id} 
              className={`transition-all hover:shadow-medium cursor-pointer ${
                isSelected ? 'ring-2 ring-primary shadow-medium' : ''
              }`}
            >
              <CardContent className="p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    {billboard.type === "fixed" ? (
                      <Image className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Monitor className="h-5 w-5 text-primary" />
                    )}
                    <Badge variant={billboard.type === "fixed" ? "secondary" : "default"}>
                      {billboard.type === "fixed" ? "Anuncio Fijo" : "Anuncio Digital"}
                    </Badge>
                    {billboard.type === "digital" && (
                      <Badge variant="outline" className="text-xs">
                        {billboard.availableSlots} slots disponibles
                      </Badge>
                    )}
                  </div>
                  
                  {isSelected && selectedItem && (
                    <Badge variant="default" className="bg-status-confirmed">
                      {selectedItem.quantity} seleccionado{selectedItem.quantity > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>

                {/* Location */}
                <div className="flex items-start gap-2 mb-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                  <span className="text-sm font-medium">{billboard.location}</span>
                </div>

                {/* Specifications */}
                <div className="space-y-2 mb-4">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Dimensiones:</span>{' '}
                    <span className="font-medium">
                      {billboard.size.width_meters}m × {billboard.size.height_meters}m
                    </span>
                  </div>
                  
                  {billboard.type === "digital" && billboard.size.width_pixels && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Resolución:</span>{' '}
                      <span className="font-medium">
                        {billboard.size.width_pixels} × {billboard.size.height_pixels} px
                      </span>
                    </div>
                  )}
                  
                  {billboard.type === "digital" && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Capacidad:</span>{' '}
                      <span className="font-medium">
                        Hasta {billboard.maxClients} anunciantes simultáneos
                      </span>
                    </div>
                  )}
                </div>

                {/* Pricing */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <div className="text-2xl font-bold text-primary">
                        ${price.toLocaleString('es-MX')} MXN
                      </div>
                      <div className="text-sm text-muted-foreground">por mes</div>
                    </div>
                    
                    {isSelected && selectedItem && (
                      <div className="text-right">
                        <div className="text-lg font-bold">
                          ${selectedItem.totalPrice.toLocaleString('es-MX')} MXN
                        </div>
                        <div className="text-xs text-muted-foreground">
                          total ({selectedItem.quantity} × ${price.toLocaleString('es-MX')})
                        </div>
                      </div>
                    )}
                  </div>

                  <Button 
                    onClick={() => onBillboardSelect(billboard)}
                    className="w-full"
                    variant={isSelected ? "secondary" : "default"}
                  >
                    {isSelected ? "Agregar Otro" : "Seleccionar Anuncio"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}