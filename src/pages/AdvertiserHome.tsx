import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AirbnbHeader } from "@/components/advertiser/AirbnbHeader";
import { AirbnbSearchBar, SearchFilters } from "@/components/advertiser/AirbnbSearchBar";
import { CategoryFilter } from "@/components/advertiser/CategoryFilter";
import { ScreenSection } from "@/components/advertiser/ScreenSection";
import { ScreenDetailModal, ScreenDetail } from "@/components/advertiser/ScreenDetailModal";
import { useScreens } from "@/hooks/useScreens";
import { Monitor, AlertCircle } from "lucide-react";

export default function AdvertiserHome() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { screens, loading, error, getScreenById } = useScreens();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedScreen, setSelectedScreen] = useState<ScreenDetail | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Search filters state
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    location: searchParams.get("location") || "",
    startDate: searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : undefined,
    endDate: searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : undefined,
    screenType: searchParams.get("type") || "",
  });

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

    // Filter by screen type from search bar
    if (searchFilters.screenType) {
      result = result.filter((s) => 
        s.tipo?.toLowerCase().includes(searchFilters.screenType.toLowerCase())
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

    return result;
  }, [screens, searchFilters, selectedCategory]);

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
    
    // Update URL params
    const params = new URLSearchParams();
    if (filters.location) params.set("location", filters.location);
    if (filters.startDate) params.set("startDate", filters.startDate.toISOString());
    if (filters.endDate) params.set("endDate", filters.endDate.toISOString());
    if (filters.screenType) params.set("type", filters.screenType);
    
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
    navigate(`/disponibilidad-anuncios?screen=${screen.id}`);
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

  const hasFilters = searchFilters.location || searchFilters.screenType || selectedCategory !== "all";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <AirbnbHeader />

      {/* Search Bar Section */}
      <div className="bg-background pt-6 pb-8 border-b border-border">
        <div className="max-w-[1760px] mx-auto px-6 md:px-10 lg:px-20">
          <AirbnbSearchBar onSearch={handleSearch} initialFilters={searchFilters} />
        </div>
      </div>

      {/* Category Filter */}
      <CategoryFilter
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />

      {/* Main Content */}
      <main className="max-w-[1760px] mx-auto px-6 md:px-10 lg:px-20 py-8 space-y-12">
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
        ) : filteredScreens.length === 0 ? (
          // Empty state
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
          />
        ) : (
          // Default view: grouped by city
          <>
            {screensByCity.recommended.length > 0 && (
              <ScreenSection
                title="Pantallas recomendadas para tu campaña"
                screens={screensByCity.recommended}
                onScreenClick={handleScreenClick}
              />
            )}

            {screensByCity.cdmx.length > 0 && (
              <ScreenSection
                title="Pantallas en CDMX"
                screens={screensByCity.cdmx}
                onScreenClick={handleScreenClick}
              />
            )}

            {screensByCity.monterrey.length > 0 && (
              <ScreenSection
                title="Pantallas en Monterrey"
                screens={screensByCity.monterrey}
                onScreenClick={handleScreenClick}
              />
            )}

            {screensByCity.merida.length > 0 && (
              <ScreenSection
                title="Pantallas en Mérida"
                screens={screensByCity.merida}
                onScreenClick={handleScreenClick}
              />
            )}

            {screensByCity.guadalajara.length > 0 && (
              <ScreenSection
                title="Pantallas en Guadalajara"
                screens={screensByCity.guadalajara}
                onScreenClick={handleScreenClick}
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
              />
            )}
          </>
        )}
      </main>

      {/* Screen Detail Modal */}
      <ScreenDetailModal
        screen={selectedScreen}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onReserve={handleReserve}
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
