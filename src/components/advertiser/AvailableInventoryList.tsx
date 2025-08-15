import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  MapPin, 
  Calendar, 
  DollarSign, 
  Monitor, 
  Building, 
  Search,
  Eye,
  ShoppingCart
} from "lucide-react";
import { InventoryFilters } from "@/pages/DisponibilidadAnuncios";
import { Billboard } from "@/types/billboard";
import { generateMockBillboards } from "@/lib/mockData";

interface AvailableInventoryListProps {
  filters: InventoryFilters;
}

// Mock available dates for demonstration
const getRandomAvailableDates = () => {
  const dates = [];
  const currentDate = new Date();
  for (let i = 1; i <= 28; i++) {
    if (Math.random() > 0.3) { // 70% chance of being available
      dates.push(i);
    }
  }
  return dates;
};

export function AvailableInventoryList({ filters }: AvailableInventoryListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const mockBillboards = useMemo(() => generateMockBillboards(50), []);

  // Filter available billboards based on filters
  const availableBillboards = useMemo(() => {
    return mockBillboards.filter(billboard => {
      // Only show available billboards
      if (billboard.status !== "available") return false;

      // Filter by location search
      if (searchTerm && !billboard.location.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Here you would implement owner filtering, location keyword filtering, etc.
      // For now, we'll show all available billboards
      return true;
    });
  }, [mockBillboards, searchTerm, filters]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  };

  const getBillboardTypeLabel = (billboard: Billboard) => {
    if (billboard.type === 'digital') {
      return 'Espectacular Digital';
    } else {
      // For fixed billboards, we can categorize by size or add a type field
      const area = billboard.size.width_meters * billboard.size.height_meters;
      if (area > 50) return 'Espectacular Fijo';
      if (area > 20) return 'Anuncio';
      return 'Muro';
    }
  };

  const getContractPeriod = (billboard: Billboard) => {
    const type = getBillboardTypeLabel(billboard);
    switch (type) {
      case 'Espectacular Digital':
        return 'Hora/Día/Mes/Spot';
      case 'Espectacular Fijo':
        return 'Catorcenal';
      default:
        return 'Mensual';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Inventario Disponible
            </CardTitle>
            <Badge variant="secondary">
              {availableBillboards.length} anuncios disponibles
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por ubicación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {availableBillboards.map((billboard) => {
          const availableDates = getRandomAvailableDates();
          const typeLabel = getBillboardTypeLabel(billboard);
          const contractPeriod = getContractPeriod(billboard);
          
          return (
            <Card key={billboard.id} className="hover:shadow-medium transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {billboard.type === 'digital' ? <Monitor className="h-3 w-3 mr-1" /> : <Building className="h-3 w-3 mr-1" />}
                        {typeLabel}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        ID: {billboard.id}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-lg">{billboard.location}</h3>
                  </div>
                  <Badge className="bg-status-confirmed text-white">
                    Disponible
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">Dimensiones:</span>
                    </div>
                    <p className="text-muted-foreground ml-4">
                      {billboard.size.width_meters}m × {billboard.size.height_meters}m
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">Período:</span>
                    </div>
                    <p className="text-muted-foreground ml-4">{contractPeriod}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium text-sm">Precio:</span>
                  </div>
                  <div className="ml-4">
                    {billboard.type === 'digital' ? (
                      <div className="space-y-1 text-sm">
                        {billboard.pricePerMonth && <p>Mes: {formatPrice(billboard.pricePerMonth)}</p>}
                        {billboard.pricePerDay && <p>Día: {formatPrice(billboard.pricePerDay)}</p>}
                        {billboard.pricePerHour && <p>Hora: {formatPrice(billboard.pricePerHour)}</p>}
                        {billboard.pricePerSpot && <p>Spot: {formatPrice(billboard.pricePerSpot)}</p>}
                      </div>
                    ) : (
                      <p className="text-lg font-semibold text-primary">
                        {formatPrice(billboard.monthlyPrice)}/mes
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium text-sm">Días disponibles este mes:</span>
                  </div>
                  <div className="ml-4 flex flex-wrap gap-1">
                    {availableDates.slice(0, 10).map(date => (
                      <Badge key={date} variant="outline" className="text-xs">
                        {date}
                      </Badge>
                    ))}
                    {availableDates.length > 10 && (
                      <Badge variant="secondary" className="text-xs">
                        +{availableDates.length - 10} más
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="h-4 w-4 mr-1" />
                    Ver Detalles
                  </Button>
                  <Button size="sm" className="flex-1">
                    <ShoppingCart className="h-4 w-4 mr-1" />
                    Reservar
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {availableBillboards.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No se encontraron anuncios</h3>
            <p className="text-muted-foreground">
              Intenta ajustar los filtros para encontrar más opciones disponibles.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}