import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RotateCcw, ZoomIn, ZoomOut, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreetViewPanelProps {
  lat: number;
  lng: number;
  className?: string;
  heading?: number;
}

const GOOGLE_MAPS_API_KEY = "AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8";

export function StreetViewPanel({ lat, lng, className, heading = 0 }: StreetViewPanelProps) {
  const streetViewRef = useRef<HTMLDivElement>(null);
  const panoramaRef = useRef<google.maps.StreetViewPanorama | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentZoom, setCurrentZoom] = useState(1);

  useEffect(() => {
    if (!streetViewRef.current || !lat || !lng) return;

    let mounted = true;

    const initStreetView = async () => {
      setIsLoading(true);
      setError(null);
      setIsAvailable(true);

      try {
        const loader = new Loader({
          apiKey: GOOGLE_MAPS_API_KEY,
          version: "weekly",
          libraries: ["streetView"],
        });

        await loader.load();
        
        if (!mounted || !streetViewRef.current) return;

        const streetViewService = new google.maps.StreetViewService();
        const position = new google.maps.LatLng(lat, lng);

        // Check if Street View is available at this location
        streetViewService.getPanorama(
          { location: position, radius: 100 },
          (data, status) => {
            if (!mounted || !streetViewRef.current) return;

            if (status === google.maps.StreetViewStatus.OK && data?.location?.latLng) {
              // Street View is available
              panoramaRef.current = new google.maps.StreetViewPanorama(streetViewRef.current, {
                position: data.location.latLng,
                pov: {
                  heading: heading,
                  pitch: 0,
                },
                zoom: 1,
                addressControl: false,
                showRoadLabels: false,
                zoomControl: false,
                panControl: false,
                fullscreenControl: false,
                motionTracking: false,
                motionTrackingControl: false,
                linksControl: true,
              });

              // Listen for zoom changes
              panoramaRef.current.addListener("zoom_changed", () => {
                if (panoramaRef.current) {
                  setCurrentZoom(panoramaRef.current.getZoom() || 1);
                }
              });

              setIsAvailable(true);
            } else {
              // Street View not available
              setIsAvailable(false);
            }
            setIsLoading(false);
          }
        );
      } catch (err) {
        console.error("Error loading Street View:", err);
        setError("Error al cargar Street View");
        setIsLoading(false);
      }
    };

    initStreetView();

    return () => {
      mounted = false;
      if (panoramaRef.current) {
        panoramaRef.current = null;
      }
    };
  }, [lat, lng, heading]);

  const handleRotate = () => {
    if (panoramaRef.current) {
      const pov = panoramaRef.current.getPov();
      panoramaRef.current.setPov({
        heading: pov.heading + 90,
        pitch: pov.pitch,
      });
    }
  };

  const handleZoomIn = () => {
    if (panoramaRef.current) {
      const currentZoom = panoramaRef.current.getZoom() || 1;
      panoramaRef.current.setZoom(Math.min(currentZoom + 1, 4));
    }
  };

  const handleZoomOut = () => {
    if (panoramaRef.current) {
      const currentZoom = panoramaRef.current.getZoom() || 1;
      panoramaRef.current.setZoom(Math.max(currentZoom - 1, 0));
    }
  };

  const handleResetView = () => {
    if (panoramaRef.current) {
      panoramaRef.current.setPov({ heading: heading, pitch: 0 });
      panoramaRef.current.setZoom(1);
    }
  };

  if (isLoading) {
    return (
      <Card className={cn("relative overflow-hidden", className)}>
        <Skeleton className="w-full h-full min-h-[300px]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            <span className="text-sm text-muted-foreground">Cargando Street View...</span>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("relative overflow-hidden flex items-center justify-center bg-muted", className)}>
        <div className="flex flex-col items-center gap-2 p-8 text-center">
          <EyeOff className="h-12 w-12 text-muted-foreground" />
          <span className="text-muted-foreground">{error}</span>
        </div>
      </Card>
    );
  }

  if (!isAvailable) {
    return (
      <Card className={cn("relative overflow-hidden flex items-center justify-center bg-muted", className)}>
        <div className="flex flex-col items-center gap-2 p-8 text-center">
          <EyeOff className="h-12 w-12 text-muted-foreground" />
          <span className="text-muted-foreground font-medium">Street View no disponible</span>
          <span className="text-sm text-muted-foreground">
            No hay imágenes de Street View para esta ubicación.
          </span>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      {/* Street View Container */}
      <div ref={streetViewRef} className="w-full h-full min-h-[300px]" />

      {/* Controls Overlay */}
      <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
        <Button
          variant="secondary"
          size="icon"
          onClick={handleRotate}
          className="h-9 w-9 bg-background/90 backdrop-blur-sm shadow-md hover:bg-background"
          title="Rotar vista"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={handleZoomIn}
          className="h-9 w-9 bg-background/90 backdrop-blur-sm shadow-md hover:bg-background"
          title="Acercar"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={handleZoomOut}
          className="h-9 w-9 bg-background/90 backdrop-blur-sm shadow-md hover:bg-background"
          title="Alejar"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={handleResetView}
          className="h-9 w-9 bg-background/90 backdrop-blur-sm shadow-md hover:bg-background"
          title="Restablecer vista"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </div>

      {/* Street View Badge */}
      <div className="absolute bottom-3 left-3 z-10">
        <div className="bg-background/90 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs font-medium shadow-md">
          📍 Street View
        </div>
      </div>
    </Card>
  );
}
