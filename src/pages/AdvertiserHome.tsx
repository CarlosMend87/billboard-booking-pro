import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AirbnbHeader } from "@/components/advertiser/AirbnbHeader";
import { AirbnbSearchBar } from "@/components/advertiser/AirbnbSearchBar";
import { CategoryFilter } from "@/components/advertiser/CategoryFilter";
import { ScreenSection } from "@/components/advertiser/ScreenSection";
import { ScreenDetailModal, ScreenDetail } from "@/components/advertiser/ScreenDetailModal";
import { useScreens } from "@/hooks/useScreens";
import { Monitor, AlertCircle } from "lucide-react";

export default function AdvertiserHome() {
  const navigate = useNavigate();
  const { screens, loading, error, getScreenById } = useScreens();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedScreen, setSelectedScreen] = useState<ScreenDetail | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Agrupar pantallas por ciudad usando datos reales
  const screensByCity = useMemo(() => {
    const cdmxScreens = screens.filter((s) => s.ciudad === "CDMX");
    const monterreyScreens = screens.filter((s) => s.ciudad === "Monterrey");
    const meridaScreens = screens.filter((s) => s.ciudad === "Mérida");
    const guadalajaraScreens = screens.filter((s) => s.ciudad === "Guadalajara");
    
    // Pantallas con mayor impacto o premium para recomendadas
    const premiumScreens = screens.filter((s) => 
      s.badge === "premium" || s.hasComputerVision
    );
    
    // Si no hay premium, mostrar todas ordenadas
    const recommendedScreens = premiumScreens.length > 0 
      ? premiumScreens 
      : [...screens].sort((a, b) => (b.impactos || 0) - (a.impactos || 0));

    return {
      cdmx: cdmxScreens,
      monterrey: monterreyScreens,
      merida: meridaScreens,
      guadalajara: guadalajaraScreens,
      recommended: recommendedScreens.slice(0, 12),
      all: screens,
    };
  }, [screens]);

  // Filtrar por categoría de tipo
  const filteredScreens = (screensList: typeof screens) => {
    if (selectedCategory === "all") return screensList;
    
    return screensList.filter((screen) => {
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

  // Estado de error
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <AirbnbHeader />

      {/* Search Bar Section */}
      <div className="bg-background pt-6 pb-8 border-b border-border">
        <div className="max-w-[1760px] mx-auto px-6 md:px-10 lg:px-20">
          <AirbnbSearchBar />
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
        ) : screens.length === 0 ? (
          // Estado vacío - sin datos en la base de datos
          <div className="flex flex-col items-center justify-center py-20">
            <Monitor className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Sin pantallas disponibles</h2>
            <p className="text-muted-foreground text-center max-w-md">
              No hay pantallas disponibles en este momento. Las pantallas aparecerán aquí cuando estén registradas en el sistema.
            </p>
          </div>
        ) : (
          <>
            {/* Pantallas recomendadas (siempre mostrar si hay datos) */}
            {filteredScreens(screensByCity.recommended).length > 0 && (
              <ScreenSection
                title="Pantallas recomendadas para tu campaña"
                screens={filteredScreens(screensByCity.recommended)}
                onScreenClick={handleScreenClick}
              />
            )}

            {/* Pantallas en CDMX */}
            {filteredScreens(screensByCity.cdmx).length > 0 && (
              <ScreenSection
                title="Pantallas en CDMX"
                screens={filteredScreens(screensByCity.cdmx)}
                onScreenClick={handleScreenClick}
              />
            )}

            {/* Pantallas en Monterrey */}
            {filteredScreens(screensByCity.monterrey).length > 0 && (
              <ScreenSection
                title="Pantallas en Monterrey"
                screens={filteredScreens(screensByCity.monterrey)}
                onScreenClick={handleScreenClick}
              />
            )}

            {/* Pantallas en Mérida */}
            {filteredScreens(screensByCity.merida).length > 0 && (
              <ScreenSection
                title="Pantallas en Mérida"
                screens={filteredScreens(screensByCity.merida)}
                onScreenClick={handleScreenClick}
              />
            )}

            {/* Pantallas en Guadalajara */}
            {filteredScreens(screensByCity.guadalajara).length > 0 && (
              <ScreenSection
                title="Pantallas en Guadalajara"
                screens={filteredScreens(screensByCity.guadalajara)}
                onScreenClick={handleScreenClick}
              />
            )}

            {/* Si solo hay pantallas sin ciudad identificada, mostrar todas */}
            {screensByCity.cdmx.length === 0 && 
             screensByCity.monterrey.length === 0 && 
             screensByCity.merida.length === 0 &&
             screensByCity.guadalajara.length === 0 && (
              <ScreenSection
                title="Todas las pantallas disponibles"
                screens={filteredScreens(screens)}
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
            © 2026 AdScreen. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
