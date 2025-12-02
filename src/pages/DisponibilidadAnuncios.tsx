import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { AvailableInventoryList } from "@/components/advertiser/AvailableInventoryList";
import { AvailableInventoryMap } from "@/components/advertiser/AvailableInventoryMap";
import { CartSidebar } from "@/components/cart/CartSidebar";
import { LocationKeywordFilter } from "@/components/advertiser/LocationKeywordFilter";
import { DateAvailabilityFilter } from "@/components/advertiser/DateAvailabilityFilter";
import { AdvancedFilters } from "@/components/advertiser/AdvancedFilters";
import { SortOptions } from "@/components/advertiser/SortOptions";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, List } from "lucide-react";
import { useCartContext } from "@/context/CartContext";
import { useCampaign } from "@/context/CampaignContext";
import { InventoryFilters, AdvancedFiltersState } from "@/types/inventory";
import { CampaignOptionsModal } from "@/components/advertiser/CampaignOptionsModal";
import { CampaignCreationModal } from "@/components/advertiser/CampaignCreationModal";
import { CampaignSelectionModal } from "@/components/advertiser/CampaignSelectionModal";
import { CampaignInfo } from "@/context/CampaignContext";
import { toast } from "sonner";

export type { InventoryFilters, AdvancedFiltersState };

export default function DisponibilidadAnuncios() {
  const [viewMode, setViewMode] = useState<'map' | 'list'>('list');
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showCreationModal, setShowCreationModal] = useState(false);
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [hasShownModal, setHasShownModal] = useState(false);
  
  const [filters, setFilters] = useState<InventoryFilters>({
    location: '',
    startDate: null,
    endDate: null,
    advancedFilters: {
      billboardTypes: [],
      modalidades: [],
      proximityFilters: [],
      priceRange: [0, 100000],
      hasComputerVision: null
    },
    sortBy: "nombre-asc" as any
  });
  
  const { cart, addItem, removeItem, updateQuantity, clearCart } = useCartContext();
  const { campaignInfo, setCampaignInfo } = useCampaign();

  // Mostrar modal solo la primera vez que entra a disponibilidad
  useEffect(() => {
    if (!hasShownModal && !campaignInfo) {
      setShowOptionsModal(true);
      setHasShownModal(true);
    }
  }, [hasShownModal, campaignInfo]);

  const handleFilterChange = (newFilters: Partial<InventoryFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleAdvancedFiltersChange = (advancedFilters: Partial<AdvancedFiltersState>) => {
    setFilters(prev => ({ 
      ...prev, 
      advancedFilters: { ...prev.advancedFilters, ...advancedFilters }
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

  const handleCreateCampaign = (campaign: CampaignInfo) => {
    setCampaignInfo(campaign);
    setShowCreationModal(false);
    
    // Aplicar filtro de método si es necesario
    if (campaign.metodo !== 'full') {
      handleAdvancedFiltersChange({ modalidades: [campaign.metodo] });
    }
    
    toast.success(`Campaña "${campaign.nombre}" creada como borrador. Busca tu inventario disponible.`);
  };

  const handleSelectCampaign = (campaign: any) => {
    // Convertir campaña de DB a CampaignInfo
    const campaignInfo: CampaignInfo = {
      id: campaign.id,
      nombre: campaign.nombre,
      propuesta: campaign.propuesta || "",
      presupuesto: campaign.presupuesto_total,
      metodo: campaign.metodo_busqueda || "mensual",
    };
    
    setCampaignInfo(campaignInfo);
    
    // Aplicar filtro de método si es necesario
    if (campaignInfo.metodo !== 'full') {
      handleAdvancedFiltersChange({ modalidades: [campaignInfo.metodo] });
    }
    
    toast.success(`Continuando con "${campaign.nombre}"`);
  };

  const activeFiltersCount = 
    (filters.location ? 1 : 0) +
    (filters.startDate || filters.endDate ? 1 : 0) +
    (filters.advancedFilters.billboardTypes.length > 0 ? 1 : 0) +
    (filters.advancedFilters.modalidades.length > 0 ? 1 : 0) +
    (filters.advancedFilters.proximityFilters.length > 0 ? 1 : 0) +
    (filters.advancedFilters.hasComputerVision !== null ? 1 : 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <CampaignOptionsModal
        open={showOptionsModal}
        onClose={() => setShowOptionsModal(false)}
        onCreateFirst={() => {
          setShowOptionsModal(false);
          setShowCreationModal(true);
        }}
        onTrackExisting={() => {
          setShowOptionsModal(false);
          setShowSelectionModal(true);
        }}
        onCreateAdditional={() => {
          setShowOptionsModal(false);
          setShowCreationModal(true);
        }}
      />

      <CampaignCreationModal
        open={showCreationModal}
        onClose={() => setShowCreationModal(false)}
        onSubmit={handleCreateCampaign}
      />

      <CampaignSelectionModal
        open={showSelectionModal}
        onClose={() => setShowSelectionModal(false)}
        onSelectCampaign={handleSelectCampaign}
      />
      
      <div className="container mx-auto px-4 py-6 space-y-6">
        {campaignInfo && (
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-primary">Campaña activa:</span> {campaignInfo.nombre}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-normal text-muted-foreground">
                      Presupuesto: ${campaignInfo.presupuesto.toLocaleString('es-MX')} MXN
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => clearCampaign()}
                    >
                      Cerrar
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setShowOptionsModal(true)}
                    >
                      Cambiar Campaña
                    </Button>
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
          </Card>
        )}
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2">
                Disponibilidad de Anuncios
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary">{activeFiltersCount} filtro{activeFiltersCount !== 1 ? 's' : ''} aplicado{activeFiltersCount !== 1 ? 's' : ''}</Badge>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="flex items-center gap-2"
                >
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline">Lista</span>
                </Button>
                <Button
                  variant={viewMode === 'map' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('map')}
                  className="flex items-center gap-2"
                >
                  <MapPin className="h-4 w-4" />
                  <span className="hidden sm:inline">Mapa</span>
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-2 md:gap-4 mb-6">
          <div className="lg:col-span-3">
            <LocationKeywordFilter
              selectedKeywords={filters.location ? [filters.location] : []}
              onKeywordChange={(keywords) => handleFilterChange({ location: keywords[0] || '' })}
            />
          </div>
          <div className="lg:col-span-3">
            <DateAvailabilityFilter
              dateRange={{
                startDate: filters.startDate,
                endDate: filters.endDate
              }}
              onDateRangeChange={({ startDate, endDate }) => 
                handleFilterChange({ startDate, endDate })
              }
            />
          </div>
          <div className="lg:col-span-3">
            <AdvancedFilters
              filters={filters.advancedFilters}
              onFiltersChange={handleAdvancedFiltersChange}
              onClearFilters={handleClearAdvancedFilters}
            />
          </div>
          <div className="lg:col-span-3">
            <SortOptions
              value={filters.sortBy as any}
              onChange={(sortBy) => handleFilterChange({ sortBy: sortBy as any })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            {viewMode === 'map' ? (
              <AvailableInventoryMap filters={filters} onAddToCart={addItem} />
            ) : (
              <AvailableInventoryList filters={filters} onAddToCart={addItem} />
            )}
          </div>
          
          <div className="xl:col-span-1">
            <CartSidebar 
              cart={cart}
              onRemoveItem={removeItem}
              onUpdateQuantity={updateQuantity}
              onClearCart={clearCart}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
