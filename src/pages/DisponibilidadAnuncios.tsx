import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { LocationKeywordFilter } from "@/components/advertiser/LocationKeywordFilter";
import { DateAvailabilityFilter } from "@/components/advertiser/DateAvailabilityFilter";
import { AvailableInventoryMap } from "@/components/advertiser/AvailableInventoryMap";
import { AvailableInventoryList } from "@/components/advertiser/AvailableInventoryList";
import { CartSidebar } from "@/components/cart/CartSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, List, Search, Filter, ShoppingCart } from "lucide-react";
import { useCartContext } from "@/context/CartContext";
import { Link } from "react-router-dom";

export interface InventoryFilters {
  locationKeywords: string[];
  dateRange: {
    startDate: Date | null;
    endDate: Date | null;
  };
  billboardType?: string;
}

export default function DisponibilidadAnuncios() {
  const [viewMode, setViewMode] = useState<'map' | 'list'>('list');
  const [filters, setFilters] = useState<InventoryFilters>({
    locationKeywords: [],
    dateRange: {
      startDate: null,
      endDate: null
    }
  });
  
  const { cart, addItem, removeItem, updateQuantity, clearCart } = useCartContext();

  const handleFilterChange = (newFilters: Partial<InventoryFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const activeFiltersCount = filters.locationKeywords.length + 
    (filters.dateRange.startDate && filters.dateRange.endDate ? 1 : 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Disponibilidad de Anuncios
              </h1>
              <p className="text-muted-foreground mt-2">
                Consulta el inventario disponible y encuentra los mejores espacios publicitarios
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {cart.itemCount > 0 && (
                <Button asChild size="sm" className="bg-primary hover:bg-primary/90">
                  <Link to="/booking-wizard">
                    <ShoppingCart className="h-4 w-4 mr-1" />
                    Continuar Reserva ({cart.itemCount})
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Filters Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Search className="h-5 w-5" />
                      Filtros de Búsqueda
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <LocationKeywordFilter
                      selectedKeywords={filters.locationKeywords}
                      onKeywordChange={(locationKeywords) => handleFilterChange({ locationKeywords })}
                    />
                    
                    <DateAvailabilityFilter
                      dateRange={filters.dateRange}
                      onDateRangeChange={(dateRange) => handleFilterChange({ dateRange })}
                    />
                  </CardContent>
                </Card>

                {/* Filtros Activos */}
                {activeFiltersCount > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Filtros Activos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Filter className="h-3 w-3" />
                        {activeFiltersCount} filtros aplicados
                      </Badge>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Main Content */}
              <div className="lg:col-span-3">
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Inventario Disponible</h3>
                    <div className="flex bg-muted rounded-lg p-1">
                      <Button
                        variant={viewMode === 'list' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                        className="flex items-center gap-1"
                      >
                        <List className="h-4 w-4" />
                        Lista
                      </Button>
                      <Button
                        variant={viewMode === 'map' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('map')}
                        className="flex items-center gap-1"
                      >
                        <MapPin className="h-4 w-4" />
                        Mapa
                      </Button>
                    </div>
                  </div>
                </div>

                {viewMode === 'map' ? (
                  <AvailableInventoryMap filters={filters} onAddToCart={addItem} />
                ) : (
                  <AvailableInventoryList filters={filters} onAddToCart={addItem} />
                )}
              </div>
              
              {/* Cart Sidebar */}
              <div className="lg:col-span-1">
                <CartSidebar 
                  cart={cart}
                  onRemoveItem={removeItem}
                  onUpdateQuantity={updateQuantity}
                  onClearCart={clearCart}
                />
              </div>
            </div>
        </div>
      </main>
    </div>
  );
}