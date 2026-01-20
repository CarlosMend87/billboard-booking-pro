import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AirbnbHeader } from "@/components/advertiser/AirbnbHeader";
import { AirbnbSearchBar } from "@/components/advertiser/AirbnbSearchBar";
import { CategoryFilter } from "@/components/advertiser/CategoryFilter";
import { ScreenSection } from "@/components/advertiser/ScreenSection";
import { ScreenCardProps } from "@/components/advertiser/ScreenCard";
import { supabase } from "@/integrations/supabase/client";

// Mock data for demonstration - will be replaced with real data
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
    id: `${city}-${i}`,
    nombre: nombres[i % nombres.length],
    ubicacion: ubicaciones[i % ubicaciones.length],
    ciudad: city,
    precio: Math.floor(Math.random() * 50000) + 15000,
    rating: Number((Math.random() * 1 + 4).toFixed(1)),
    impactos: Math.floor(Math.random() * 500000) + 100000,
    imagenes: [
      "/placeholder.svg",
      "/placeholder.svg",
      "/placeholder.svg",
    ],
    badge: badges[Math.floor(Math.random() * badges.length)],
  }));
};

export default function AdvertiserHome() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [screens, setScreens] = useState<{
    cdmx: ScreenCardProps[];
    monterrey: ScreenCardProps[];
    recommended: ScreenCardProps[];
  }>({
    cdmx: [],
    monterrey: [],
    recommended: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load initial mock data - in production, this would fetch from Supabase
    const loadScreens = async () => {
      setLoading(true);
      
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      // Use mock data for now
      setScreens({
        cdmx: generateMockScreens("CDMX", 8),
        monterrey: generateMockScreens("Monterrey", 8),
        recommended: generateMockScreens("Recomendado", 8),
      });
      
      setLoading(false);
    };

    loadScreens();
  }, []);

  const handleScreenClick = (screenId: string) => {
    navigate(`/disponibilidad-anuncios?screen=${screenId}`);
  };

  const filteredScreens = (screensList: ScreenCardProps[]) => {
    if (selectedCategory === "all") return screensList;
    // In production, filter by actual screen type
    return screensList;
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
              screens={filteredScreens(screens.cdmx)}
              onScreenClick={handleScreenClick}
            />

            <ScreenSection
              title="Pantallas populares en Monterrey"
              screens={filteredScreens(screens.monterrey)}
              onScreenClick={handleScreenClick}
            />

            <ScreenSection
              title="Pantallas recomendadas para tu campaña"
              screens={filteredScreens(screens.recommended)}
              onScreenClick={handleScreenClick}
            />
          </>
        )}
      </main>

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
