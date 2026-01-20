import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AirbnbHeader } from "@/components/advertiser/AirbnbHeader";
import { AirbnbSearchBar } from "@/components/advertiser/AirbnbSearchBar";
import { CategoryFilter } from "@/components/advertiser/CategoryFilter";
import { ScreenSection } from "@/components/advertiser/ScreenSection";
import { ScreenDetailModal, ScreenDetail } from "@/components/advertiser/ScreenDetailModal";
import { useScreens } from "@/hooks/useScreens";
import { ScreenCardProps } from "@/components/advertiser/ScreenCard";

// Mock data fallback for when no real data is available
const generateMockScreens = (city: string, count: number): ScreenCardProps[] => {
  const badges: ("alta-demanda" | "disponible" | "premium" | undefined)[] = [
    "alta-demanda",
    "disponible",
    "premium",
    undefined,
  ];
  
  const nombres = [
    "Pantalla LED Plaza Principal",
    "Espectacular Av. Reforma",
    "Digital Billboard Centro",
    "Mupi Estación Metro",
    "LED Indoor Centro Comercial",
    "Pantalla Carretera Norte",
    "Digital Display Aeropuerto",
    "Billboard Premium Zona Rosa",
  ];

  const ubicaciones = [
    "Av. Insurgentes Sur",
    "Paseo de la Reforma",
    "Av. Universidad",
    "Centro Histórico",
    "Santa Fe",
    "Polanco",
    "Condesa",
    "Roma Norte",
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: `mock-${city}-${i}`,
    nombre: nombres[i % nombres.length],
    ubicacion: ubicaciones[i % ubicaciones.length],
    ciudad: city,
    precio: Math.floor(Math.random() * 50000) + 15000,
    rating: Number((Math.random() * 1 + 4).toFixed(1)),
    impactos: Math.floor(Math.random() * 500000) + 100000,
    imagenes: ["/placeholder.svg"],
    badge: badges[Math.floor(Math.random() * badges.length)],
  }));
};

export default function AdvertiserHome() {
  const navigate = useNavigate();
  const { screens, loading, getScreenById } = useScreens();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedScreen, setSelectedScreen] = useState<ScreenDetail | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Group screens by city
  const screensByCity = useMemo(() => {
    const cdmxScreens = screens.filter((s) => 
      s.ciudad.toLowerCase().includes("cdmx") || 
      s.ciudad.toLowerCase().includes("ciudad de méxico") ||
      s.ciudad.toLowerCase().includes("mexico")
    );
    
    const monterreyScreens = screens.filter((s) => 
      s.ciudad.toLowerCase().includes("monterrey")
    );

    // Use mock data if no real screens available
    return {
      cdmx: cdmxScreens.length > 0 ? cdmxScreens.slice(0, 10) : generateMockScreens("CDMX", 8),
      monterrey: monterreyScreens.length > 0 ? monterreyScreens.slice(0, 10) : generateMockScreens("Monterrey", 8),
      recommended: screens.length > 0 ? screens.slice(0, 10) : generateMockScreens("Recomendado", 8),
    };
  }, [screens]);

  // Filter by category
  const filteredScreens = (screensList: ScreenCardProps[]) => {
    if (selectedCategory === "all") return screensList;
    // Additional filtering can be implemented based on screen type
    return screensList;
  };

  const handleScreenClick = async (screenId: string) => {
    // Check if it's a mock screen
    if (screenId.startsWith("mock-")) {
      // For mock screens, create a mock detail
      const mockDetail: ScreenDetail = {
        id: screenId,
        nombre: "Pantalla de demostración",
        direccion: "Av. Paseo de la Reforma 222, CDMX",
        ubicacion: "CDMX",
        tipo: "digital",
        lat: 19.4326,
        lng: -99.1332,
        precio: { mensual: 35000 },
        medidas: { ancho: 10, alto: 5 },
        digital: { es_digital: true },
        fotos: ["/placeholder.svg"],
        contratacion: { mensual: true, catorcena: true },
        has_computer_vision: false,
        status: "disponible",
      };
      setSelectedScreen(mockDetail);
      setModalOpen(true);
      return;
    }

    // Fetch real screen details
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
        ) : (
          <>
            <ScreenSection
              title="Pantallas en CDMX"
              screens={filteredScreens(screensByCity.cdmx)}
              onScreenClick={handleScreenClick}
            />

            <ScreenSection
              title="Pantallas populares en Monterrey"
              screens={filteredScreens(screensByCity.monterrey)}
              onScreenClick={handleScreenClick}
            />

            <ScreenSection
              title="Pantallas recomendadas para tu campaña"
              screens={filteredScreens(screensByCity.recommended)}
              onScreenClick={handleScreenClick}
            />
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
