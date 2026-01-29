import { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { AirbnbHeader } from "@/components/advertiser/AirbnbHeader";
import { AirbnbSearchBar, SearchFilters } from "@/components/advertiser/AirbnbSearchBar";
import { CategoryFilter } from "@/components/advertiser/CategoryFilter";
import { ScreenSection } from "@/components/advertiser/ScreenSection";
import { ScreenDetailModal, ScreenDetail } from "@/components/advertiser/ScreenDetailModal";
import { ScreenMap } from "@/components/advertiser/ScreenMap";
import { POIProximityFilter, POIFilterState } from "@/components/advertiser/POIProximityFilter";
import { AdvancedFilters, AdvancedFiltersState } from "@/components/advertiser/AdvancedFilters";
import { ScreenCompareDrawer } from "@/components/advertiser/ScreenCompareDrawer";
import { ScreenProposalPDF } from "@/components/advertiser/ScreenProposalPDF";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { useAvailableScreens } from "@/hooks/useAvailableScreens";
import { useFavorites } from "@/hooks/useFavorites";
import { useCartValidation } from "@/context/CartValidationContext";
import { useAuth } from "@/hooks/useAuth";
import { Monitor, AlertCircle, Map, LayoutGrid, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function AdvertiserHome() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const locationRouter = useLocation();
  const { user } = useAuth();

  const FILTERS_STORAGE_KEY = "dooh_explore_filters_v1";
  const LAST_EXPLORE_URL_KEY = "dooh_last_explore_url";
  
  // Search filters state - read from URL on mount
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    location: searchParams.get("location") || "",
    startDate: searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : undefined,
    endDate: searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : undefined,
    screenTypes: searchParams.get("type")?.split(',').filter(Boolean) || [],
  });

  // Persist last explore URL (para regresar desde wizard sin perder contexto)
  useEffect(() => {
    localStorage.setItem(LAST_EXPLORE_URL_KEY, `${locationRouter.pathname}${locationRouter.search}`);
  }, [locationRouter.pathname, locationRouter.search]);

  // Fallback de filtros: si la URL no trae params, restaurar desde localStorage y sincronizar URL
  useEffect(() => {
    const hasAnyParam = ["location", "startDate", "endDate", "type"].some((k) => searchParams.get(k));
    if (hasAnyParam) return;

    try {
      const raw = localStorage.getItem(FILTERS_STORAGE_KEY);
      if (!raw) return;
      const stored = JSON.parse(raw) as {
        location?: string;
        startDate?: string;
        endDate?: string;
        screenTypes?: string[];
      };

      const restored: SearchFilters = {
        location: stored.location || "",
        startDate: stored.startDate ? new Date(stored.startDate) : undefined,
        endDate: stored.endDate ? new Date(stored.endDate) : undefined,
        screenTypes: stored.screenTypes || [],
      };

      // Evita sobrescribir si ya hay estado “real”
      const isAlreadyEmpty =
        !searchFilters.location &&
        !searchFilters.startDate &&
        !searchFilters.endDate &&
        searchFilters.screenTypes.length === 0;

      if (isAlreadyEmpty) {
        setSearchFilters(restored);
        const params = new URLSearchParams();
        if (restored.location) params.set("location", restored.location);
        if (restored.startDate) params.set("startDate", restored.startDate.toISOString());
        if (restored.endDate) params.set("endDate", restored.endDate.toISOString());
        if (restored.screenTypes.length > 0) params.set("type", restored.screenTypes.join(","));
        navigate(`/explorar?${params.toString()}`, { replace: true });
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  // Use the new hook that filters by date availability
  const { screens, loading, error, getScreenById } = useAvailableScreens({
    startDate: searchFilters.startDate,
    endDate: searchFilters.endDate,
  });

  // Favorites hook
  const { favorites, isFavorite, toggleFavorite, favoritesCount } = useFavorites();

  // Cart with backend validation - using shared context
  const {
    items: cartItems,
    isTransferring: cartTransferring,
    addToCart,
    revalidateCart,
    isInCart,
  } = useCartValidation();

  // Compare state
  const [compareScreens, setCompareScreens] = useState<string[]>([]);
  
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedScreen, setSelectedScreen] = useState<ScreenDetail | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");

  // POI proximity filter state
  const [poiFilter, setPoiFilter] = useState<POIFilterState>({
    poiType: null,
    radius: 1000,
    billboardIds: null,
  });

  // Advanced filters state (including modalidades)
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFiltersState>({
    billboardTypes: [],
    modalidades: [],
    proximityFilters: [],
    priceRange: [0, 100000],
    hasComputerVision: null,
  });

  const handleAdvancedFiltersChange = useCallback((newFilters: Partial<AdvancedFiltersState>) => {
    setAdvancedFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const handleClearAdvancedFilters = useCallback(() => {
    setAdvancedFilters({
      billboardTypes: [],
      modalidades: [],
      proximityFilters: [],
      priceRange: [0, 100000],
      hasComputerVision: null,
    });
  }, []);

  // Check if dates are selected for cart functionality
  const hasValidDates = !!(searchFilters.startDate && searchFilters.endDate);

  // Revalidate cart when dates change
  useEffect(() => {
    if (searchFilters.startDate && searchFilters.endDate && cartItems.length > 0) {
      revalidateCart({
        startDate: searchFilters.startDate,
        endDate: searchFilters.endDate,
      });
    }
  }, [searchFilters.startDate?.toISOString(), searchFilters.endDate?.toISOString()]);

  // Apply all filters
  const filteredScreens = useMemo(() => {
    let result = [...screens];

    // Filter by location
    if (searchFilters.location) {
      const locationLower = searchFilters.location.toLowerCase();
      result = result.filter((s) => 
        s.ciudad.toLowerCase().includes(locationLower) ||
        s.ubicacion.toLowerCase().includes(locationLower)
      );
    }

    // Filter by screen types from search bar (multi-select)
    if (searchFilters.screenTypes.length > 0) {
      result = result.filter((s) => 
        searchFilters.screenTypes.some(type => 
          s.tipo?.toLowerCase().includes(type.toLowerCase())
        )
      );
    }

    // Filter by category
    if (selectedCategory !== "all") {
      result = result.filter((screen) => {
        switch (selectedCategory) {
          case "digital":
            return screen.tipo === "digital";
          case "espectacular":
            return screen.tipo === "espectacular" || screen.tipo === "billboard";
          case "mupi":
            return screen.tipo === "mupi";
          case "indoor":
            return screen.tipo === "indoor";
          case "outdoor":
            return screen.tipo === "outdoor" || screen.tipo === "exterior";
          default:
            return true;
        }
      });
    }

    // Apply POI proximity filter
    if (poiFilter.billboardIds !== null) {
      result = result.filter((screen) => poiFilter.billboardIds!.includes(screen.id));
    }

    // Filter by modalidades from advanced filters
    if (advancedFilters.modalidades.length > 0) {
      result = result.filter((screen) => {
        if (!screen.contratacion) return false;
        return advancedFilters.modalidades.some(modalidad => 
          screen.contratacion![modalidad as keyof typeof screen.contratacion] === true
        );
      });
    }

    return result;
  }, [screens, searchFilters, selectedCategory, poiFilter.billboardIds, advancedFilters.modalidades]);

  // Group filtered screens by city
  const screensByCity = useMemo(() => {
    const cdmxScreens = filteredScreens.filter((s) => s.ciudad === "CDMX");
    const monterreyScreens = filteredScreens.filter((s) => s.ciudad === "Monterrey");
    const meridaScreens = filteredScreens.filter((s) => s.ciudad === "Mérida");
    const guadalajaraScreens = filteredScreens.filter((s) => s.ciudad === "Guadalajara");
    
    // Premium/recommended screens
    const premiumScreens = filteredScreens.filter((s) => 
      s.badge === "premium" || s.hasComputerVision
    );
    
    const recommendedScreens = premiumScreens.length > 0 
      ? premiumScreens 
      : [...filteredScreens].sort((a, b) => (b.impactos || 0) - (a.impactos || 0));

    return {
      cdmx: cdmxScreens,
      monterrey: monterreyScreens,
      merida: meridaScreens,
      guadalajara: guadalajaraScreens,
      recommended: recommendedScreens.slice(0, 12),
      all: filteredScreens,
    };
  }, [filteredScreens]);

  const handleSearch = (filters: SearchFilters) => {
    setSearchFilters(filters);

    // Persist filtros (para refresh/back sin URL)
    localStorage.setItem(
      FILTERS_STORAGE_KEY,
      JSON.stringify({
        location: filters.location,
        startDate: filters.startDate?.toISOString(),
        endDate: filters.endDate?.toISOString(),
        screenTypes: filters.screenTypes,
      })
    );
    
    // Update URL params
    const params = new URLSearchParams();
    if (filters.location) params.set("location", filters.location);
    if (filters.startDate) params.set("startDate", filters.startDate.toISOString());
    if (filters.endDate) params.set("endDate", filters.endDate.toISOString());
    if (filters.screenTypes.length > 0) params.set("type", filters.screenTypes.join(','));
    
    navigate(`/explorar?${params.toString()}`, { replace: true });
  };

  const handleScreenClick = async (screenId: string) => {
    const screenDetail = await getScreenById(screenId);
    if (screenDetail) {
      setSelectedScreen(screenDetail);
      setModalOpen(true);
    }
  };

  const handleReserve = (screen: ScreenDetail) => {
    setModalOpen(false);
    // Screen is already on /explorar, just close modal - user can add to cart from here
    handleAddToCart(screen.id);
  };

  // Handle favorite toggle
  const handleFavorite = useCallback((screenId: string) => {
    if (!user) {
      toast.error("Inicia sesión para guardar favoritos");
      return;
    }
    toggleFavorite(screenId);
  }, [user, toggleFavorite]);

  // Handle compare toggle
  const handleCompare = useCallback((screenId: string) => {
    setCompareScreens(prev => {
      if (prev.includes(screenId)) {
        return prev.filter(id => id !== screenId);
      }
      if (prev.length >= 4) {
        toast.error("Máximo 4 pantallas para comparar");
        return prev;
      }
      return [...prev, screenId];
    });
  }, []);

  // Handle add to cart with backend validation
  const handleAddToCart = useCallback(async (screenId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      toast.error("Inicia sesión para agregar al carrito");
      return { success: false, error: "No autenticado" };
    }

    if (!searchFilters.startDate || !searchFilters.endDate) {
      toast.error("Selecciona fechas antes de agregar al carrito");
      return { success: false, error: "Fechas requeridas" };
    }

    // Find the screen data
    const screen = screens.find(s => s.id === screenId);
    if (!screen) {
      return { success: false, error: "Pantalla no encontrada" };
    }

    return addToCart(
      {
        billboardId: screenId,
        nombre: screen.nombre,
        ubicacion: `${screen.ubicacion}, ${screen.ciudad}`,
        tipo: screen.tipo || "espectacular",
        precio: screen.precio || 0,
        ownerId: screen.owner_id,
        medidas: screen.medidas ? { ancho: screen.medidas.ancho, alto: screen.medidas.alto } : undefined,
        foto: screen.foto,
      },
      {
        startDate: searchFilters.startDate,
        endDate: searchFilters.endDate,
      }
    );
  }, [user, searchFilters.startDate, searchFilters.endDate, screens, addToCart]);

  // Note: handleContinueReservation is now handled by GlobalFloatingCart

  // Get screens for compare drawer
  const screensToCompare = useMemo(() => {
    return filteredScreens.filter(s => compareScreens.includes(s.id));
  }, [filteredScreens, compareScreens]);

  // Get cart item IDs for highlighting
  const cartItemIds = useMemo(() => {
    return cartItems.map(item => item.billboardId);
  }, [cartItems]);

  // Common props for ScreenSection
  const sectionProps = {
    onFavorite: handleFavorite,
    onCompare: handleCompare,
    onAddToCart: handleAddToCart,
    favoriteIds: favorites,
    compareIds: compareScreens,
    cartIds: cartItemIds,
    canAddToCart: hasValidDates && !!user,
    addToCartDisabledReason: !user ? "Inicia sesión" : !hasValidDates ? "Selecciona fechas" : undefined,
  };

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <AirbnbHeader />
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="h-16 w-16 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error al cargar pantallas</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  const hasFilters = searchFilters.location || searchFilters.screenTypes.length > 0 || selectedCategory !== "all" || poiFilter.poiType !== null;
  const hasDateFilter = searchFilters.startDate && searchFilters.endDate;

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Global Loading Overlay for cart transfer */}
      <LoadingOverlay 
        isLoading={cartTransferring} 
        message="Preparando tu reserva"
        submessage="Validando disponibilidad de pantallas..."
      />
      {/* Header */}
      <AirbnbHeader />

      {/* Search Bar Section */}
      <div className="bg-background pt-6 pb-8 border-b border-border">
        <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <AirbnbSearchBar onSearch={handleSearch} initialFilters={searchFilters} />
            
            {/* Favorites & Export buttons */}
            <div className="hidden md:flex items-center gap-2">
              {favoritesCount > 0 && (
                <Button variant="outline" size="sm" className="gap-2">
                  <Heart className="h-4 w-4 fill-destructive text-destructive" />
                  {favoritesCount} favorito{favoritesCount !== 1 ? 's' : ''}
                </Button>
              )}
              {filteredScreens.length > 0 && (
                <ScreenProposalPDF 
                  screens={filteredScreens.slice(0, 20)} 
                  campaignName="Propuesta DOOH" 
                />
              )}
            </div>
          </div>
          
          {/* Date filter indicator */}
          {hasDateFilter && (
            <div className="mt-4">
              <Badge variant="secondary" className="gap-1">
                Mostrando {filteredScreens.length} pantallas disponibles del {searchFilters.startDate?.toLocaleDateString('es-MX')} al {searchFilters.endDate?.toLocaleDateString('es-MX')}
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Category Filter + POI Filter + View Toggle */}
      <div className="flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <CategoryFilter
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
          <div className="hidden md:flex items-center gap-2 pl-4">
            <AdvancedFilters
              filters={advancedFilters}
              onFiltersChange={handleAdvancedFiltersChange}
              onClearFilters={handleClearAdvancedFilters}
            />
            <POIProximityFilter
              filter={poiFilter}
              onFilterChange={setPoiFilter}
            />
          </div>
        </div>
        <div className="pr-4 sm:pr-6 lg:pr-8 flex gap-2">
          {/* Mobile Filters */}
          <div className="md:hidden flex items-center gap-1">
            <AdvancedFilters
              filters={advancedFilters}
              onFiltersChange={handleAdvancedFiltersChange}
              onClearFilters={handleClearAdvancedFilters}
            />
            <POIProximityFilter
              filter={poiFilter}
              onFilterChange={setPoiFilter}
            />
          </div>
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="h-4 w-4 mr-2" />
            Grid
          </Button>
          <Button
            variant={viewMode === "map" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("map")}
          >
            <Map className="h-4 w-4 mr-2" />
            Mapa
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <main className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 pb-32">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-muted rounded-xl mb-3" />
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2 mb-2" />
                <div className="h-3 bg-muted rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : viewMode === "map" ? (
          /* Map View */
          <ScreenMap
            screens={filteredScreens}
            onScreenClick={handleScreenClick}
            loading={loading}
            className="h-[600px]"
          />
        ) : filteredScreens.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Monitor className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {hasFilters ? "Sin resultados" : "Sin pantallas disponibles"}
            </h2>
            <p className="text-muted-foreground text-center max-w-md">
              {hasFilters 
                ? "No hay pantallas que coincidan con tus filtros. Intenta ajustar tu búsqueda."
                : "No hay pantallas disponibles en este momento."}
            </p>
          </div>
        ) : hasFilters ? (
          // When filters are active, show all results in a single section
          <ScreenSection
            title={`${filteredScreens.length} pantalla${filteredScreens.length !== 1 ? 's' : ''} encontrada${filteredScreens.length !== 1 ? 's' : ''}`}
            screens={filteredScreens}
            onScreenClick={handleScreenClick}
            {...sectionProps}
          />
        ) : (
          // Default view: grouped by city
          <>
            {screensByCity.recommended.length > 0 && (
              <ScreenSection
                title="Pantallas recomendadas para tu campaña"
                screens={screensByCity.recommended}
                onScreenClick={handleScreenClick}
                {...sectionProps}
              />
            )}

            {screensByCity.cdmx.length > 0 && (
              <ScreenSection
                title="Pantallas en CDMX"
                screens={screensByCity.cdmx}
                onScreenClick={handleScreenClick}
                {...sectionProps}
              />
            )}

            {screensByCity.monterrey.length > 0 && (
              <ScreenSection
                title="Pantallas en Monterrey"
                screens={screensByCity.monterrey}
                onScreenClick={handleScreenClick}
                {...sectionProps}
              />
            )}

            {screensByCity.merida.length > 0 && (
              <ScreenSection
                title="Pantallas en Mérida"
                screens={screensByCity.merida}
                onScreenClick={handleScreenClick}
                {...sectionProps}
              />
            )}

            {screensByCity.guadalajara.length > 0 && (
              <ScreenSection
                title="Pantallas en Guadalajara"
                screens={screensByCity.guadalajara}
                onScreenClick={handleScreenClick}
                {...sectionProps}
              />
            )}

            {/* Fallback if no city groups */}
            {screensByCity.cdmx.length === 0 && 
             screensByCity.monterrey.length === 0 && 
             screensByCity.merida.length === 0 &&
             screensByCity.guadalajara.length === 0 && (
              <ScreenSection
                title="Todas las pantallas disponibles"
                screens={filteredScreens}
                onScreenClick={handleScreenClick}
                {...sectionProps}
              />
            )}
          </>
        )}
      </main>

      {/* Note: FloatingCart is now rendered globally in App.tsx via GlobalFloatingCart */}

      {/* Screen Detail Modal */}
      <ScreenDetailModal
        screen={selectedScreen}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onReserve={handleReserve}
        isInCart={selectedScreen ? isInCart(selectedScreen.id) : false}
        onAddToCart={async (screen) => {
          const result = await handleAddToCart(screen.id);
          return result.success;
        }}
        canAddToCart={hasValidDates && !!user}
        addToCartDisabledReason={!user ? "Inicia sesión" : !hasValidDates ? "Selecciona fechas" : undefined}
        activeDates={{
          start: searchFilters.startDate || null,
          end: searchFilters.endDate || null,
        }}
      />

      {/* Compare Drawer */}
      <ScreenCompareDrawer
        screens={screensToCompare}
        onRemove={handleCompare}
        onClear={() => setCompareScreens([])}
        onReserve={(screenId) => {
          handleScreenClick(screenId);
        }}
      />

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 mt-12">
        <div className="max-w-[1760px] mx-auto px-6 md:px-10 lg:px-20 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-semibold mb-4">Soporte</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="hover:underline cursor-pointer">Centro de ayuda</li>
                <li className="hover:underline cursor-pointer">Contactar soporte</li>
                <li className="hover:underline cursor-pointer">Preguntas frecuentes</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Plataforma</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="hover:underline cursor-pointer">Cómo funciona</li>
                <li className="hover:underline cursor-pointer">Tarifas</li>
                <li className="hover:underline cursor-pointer">Cobertura</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="hover:underline cursor-pointer">Acerca de nosotros</li>
                <li className="hover:underline cursor-pointer">Carreras</li>
                <li className="hover:underline cursor-pointer">Prensa</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="hover:underline cursor-pointer">Términos de servicio</li>
                <li className="hover:underline cursor-pointer">Privacidad</li>
                <li className="hover:underline cursor-pointer">Cookies</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-sm text-muted-foreground text-center">
            © 2026 Adavailable. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
