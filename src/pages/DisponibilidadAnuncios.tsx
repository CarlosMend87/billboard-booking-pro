import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { LocationKeywordFilter } from "@/components/advertiser/LocationKeywordFilter";
import { DateAvailabilityFilter } from "@/components/advertiser/DateAvailabilityFilter";
import { AdvancedFilters, AdvancedFiltersState } from "@/components/advertiser/AdvancedFilters";
import { SortOptions, SortOption } from "@/components/advertiser/SortOptions";
import { AvailableInventoryMap } from "@/components/advertiser/AvailableInventoryMap";
import { AvailableInventoryList } from "@/components/advertiser/AvailableInventoryList";
import { CartSidebar } from "@/components/cart/CartSidebar";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useCartContext } from "@/context/CartContext";
import { Link } from "react-router-dom";

export interface InventoryFilters {
  locationKeywords: string[];
  dateRange: {
    startDate: Date | null;
    endDate: Date | null;
  };
  billboardType?: string;
  advancedFilters: AdvancedFiltersState;
  sortBy: SortOption;
}

export default function DisponibilidadAnuncios() {
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [filters, setFilters] = useState<InventoryFilters>({
    locationKeywords: [],
    dateRange: {
      startDate: null,
      endDate: null
    },
    advancedFilters: {
      billboardTypes: [],
      modalidades: [],
      proximityFilters: [],
      priceRange: [0, 100000],
      hasComputerVision: null
    },
    sortBy: "nombre-asc" as SortOption
  });
  
  const { cart, addItem, removeItem, updateQuantity, clearCart } = useCartContext();

  const handleFilterChange = (newFilters: Partial<InventoryFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleAdvancedFiltersChange = (newAdvancedFilters: Partial<AdvancedFiltersState>) => {
    setFilters(prev => ({ 
      ...prev, 
      advancedFilters: { ...prev.advancedFilters, ...newAdvancedFilters }
    }));
  };

  const handleClearAdvancedFilters = () => {
    setFilters(prev => ({
      ...prev,
      advancedFilters: {
        billboardTypes: [],
        modalidades: [],
        proximityFilters: [],
        priceRange: [0, 100000],
        hasComputerVision: null
      }
    }));
  };

  const activeFiltersCount = 
    filters.locationKeywords.length + 
    (filters.dateRange.startDate && filters.dateRange.endDate ? 1 : 0) +
    filters.advancedFilters.billboardTypes.length +
    filters.advancedFilters.modalidades.length +
    filters.advancedFilters.proximityFilters.length +
    (filters.advancedFilters.hasComputerVision !== null ? 1 : 0) +
    (filters.advancedFilters.priceRange[0] > 0 || filters.advancedFilters.priceRange[1] < 100000 ? 1 : 0);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      {/* Fixed Header Section with Filters */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Disponibilidad de Anuncios
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {activeFiltersCount} filtros aplicados
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

          {/* Compact Filters Row */}
          <div className="flex items-center gap-2 flex-wrap">
            <LocationKeywordFilter
              selectedKeywords={filters.locationKeywords}
              onKeywordChange={(locationKeywords) => handleFilterChange({ locationKeywords })}
            />
            
            <DateAvailabilityFilter
              dateRange={filters.dateRange}
              onDateRangeChange={(dateRange) => handleFilterChange({ dateRange })}
            />
            
            <AdvancedFilters
              filters={filters.advancedFilters}
              onFiltersChange={handleAdvancedFiltersChange}
              onClearFilters={handleClearAdvancedFilters}
            />

            <SortOptions
              value={filters.sortBy}
              onChange={(sortBy) => handleFilterChange({ sortBy })}
            />
          </div>
        </div>
      </div>

      {/* Main Content Area - Dual View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - List */}
        <div className="w-1/2 border-r overflow-y-auto">
          <div className="p-4">
            <AvailableInventoryList 
              filters={filters} 
              onAddToCart={addItem}
              selectedAssetId={selectedAssetId}
              onAssetSelect={setSelectedAssetId}
            />
          </div>
        </div>
        
        {/* Right Panel - Map */}
        <div className="w-1/2 relative">
          <AvailableInventoryMap 
            filters={filters} 
            onAddToCart={addItem}
            selectedAssetId={selectedAssetId}
            onAssetSelect={setSelectedAssetId}
          />
        </div>
      </div>

      {/* Floating Cart Sidebar */}
      <div className="fixed right-0 top-[140px] bottom-0 w-80 border-l bg-background shadow-lg z-30 overflow-y-auto">
        <CartSidebar 
          cart={cart}
          onRemoveItem={removeItem}
          onUpdateQuantity={updateQuantity}
          onClearCart={clearCart}
        />
      </div>
    </div>
  );
}