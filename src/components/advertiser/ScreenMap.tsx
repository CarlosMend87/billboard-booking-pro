import { useEffect, useRef, useState, useCallback } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { MarkerClusterer, SuperClusterAlgorithm } from "@googlemaps/markerclusterer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MapPin, 
  Maximize2,
  Minimize2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScreenCardProps } from "./ScreenCard";
import defaultBillboardImage from "@/assets/default-billboard.avif";

interface ScreenMapProps {
  screens: ScreenCardProps[];
  onScreenClick: (screenId: string) => void;
  loading?: boolean;
  className?: string;
  expanded?: boolean;
  onExpandToggle?: () => void;
}

interface MapMarker {
  marker: google.maps.marker.AdvancedMarkerElement;
  screen: ScreenCardProps;
}

const MAP_ID = "advertiser-map";
const DEFAULT_CENTER = { lat: 19.4326, lng: -99.1332 }; // CDMX
const DEFAULT_ZOOM = 11;
const GOOGLE_MAPS_API_KEY = "AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8";

export function ScreenMap({ 
  screens, 
  onScreenClick, 
  loading = false,
  className,
  expanded = false,
  onExpandToggle,
}: ScreenMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<MapMarker[]>([]);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapLoaded) return;

    const loader = new Loader({
      apiKey: GOOGLE_MAPS_API_KEY,
      version: "weekly",
      libraries: ["marker"],
    });

    loader.load().then(async () => {
      const { Map } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;
      await google.maps.importLibrary("marker");

      if (!mapRef.current) return;

      mapInstanceRef.current = new Map(mapRef.current, {
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        mapId: MAP_ID,
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ],
      });

      infoWindowRef.current = new google.maps.InfoWindow({
        disableAutoPan: false,
      });

      setMapLoaded(true);
    }).catch((err) => {
      console.error("Error loading Google Maps:", err);
    });
  }, [mapLoaded]);

  // Create custom cluster renderer
  const createClusterRenderer = useCallback(() => {
    return {
      render: ({ count, position }: { count: number; position: google.maps.LatLng }) => {
        // Dynamic sizing based on count
        const size = count < 10 ? 40 : count < 50 ? 50 : count < 100 ? 60 : 70;
        const fontSize = count < 10 ? 14 : count < 50 ? 16 : 18;

        const div = document.createElement("div");
        div.className = "cluster-marker";
        div.style.cssText = `
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.8) 100%);
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: ${fontSize}px;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        `;
        div.textContent = count.toString();

        // Hover effect
        div.addEventListener("mouseenter", () => {
          div.style.transform = "scale(1.1)";
          div.style.boxShadow = "0 6px 20px rgba(0, 0, 0, 0.35)";
        });
        div.addEventListener("mouseleave", () => {
          div.style.transform = "scale(1)";
          div.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.25)";
        });

        return new google.maps.marker.AdvancedMarkerElement({
          position,
          content: div,
        });
      },
    };
  }, []);

  // Create marker element
  const createMarkerElement = useCallback((screen: ScreenCardProps): HTMLElement => {
    const isDigital = screen.tipo === "digital";
    const hasCV = screen.hasComputerVision;

    const div = document.createElement("div");
    div.className = "relative cursor-pointer transform transition-transform hover:scale-110";
    
    // Determine color based on type
    let bgColor = "hsl(var(--primary))";
    if (isDigital) bgColor = "#3b82f6"; // blue-500
    else if (hasCV) bgColor = "#10b981"; // emerald-500

    div.innerHTML = `
      <div class="relative">
        <div style="
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
          border: 2px solid white;
          background: ${bgColor};
        ">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
          </svg>
        </div>
        ${screen.precio ? `
          <div style="
            position: absolute;
            bottom: -4px;
            left: 50%;
            transform: translateX(-50%) translateY(100%);
          ">
            <div style="
              background: white;
              border-radius: 9999px;
              padding: 2px 8px;
              font-size: 11px;
              font-weight: 600;
              box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
              white-space: nowrap;
            ">
              $${(screen.precio / 1000).toFixed(0)}K
            </div>
          </div>
        ` : ''}
      </div>
    `;

    return div;
  }, []);

  // Update markers when screens change
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(({ marker }) => {
      marker.map = null;
    });
    markersRef.current = [];

    // Clear existing clusterer
    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
      clustererRef.current = null;
    }

    // Filter screens with valid coordinates
    const validScreens = screens.filter(
      (s) => s.lat && s.lng && !isNaN(s.lat) && !isNaN(s.lng)
    );

    if (validScreens.length === 0) return;

    // Create new markers
    const bounds = new google.maps.LatLngBounds();
    const markers: google.maps.marker.AdvancedMarkerElement[] = [];

    validScreens.forEach((screen) => {
      const position = { lat: screen.lat!, lng: screen.lng! };
      bounds.extend(position);

      const markerElement = createMarkerElement(screen);
      
      const marker = new google.maps.marker.AdvancedMarkerElement({
        position,
        content: markerElement,
        title: screen.nombre,
      });

      marker.addListener("click", () => {
        // Create info window content
        const content = createInfoWindowContent(screen);
        infoWindowRef.current?.setContent(content);
        infoWindowRef.current?.open({
          anchor: marker,
          map: mapInstanceRef.current,
        });

        // Add click listener to info window
        google.maps.event.addListenerOnce(infoWindowRef.current!, "domready", () => {
          const btn = document.getElementById(`info-btn-${screen.id}`);
          if (btn) {
            btn.onclick = () => {
              onScreenClick(screen.id);
              infoWindowRef.current?.close();
            };
          }
        });
      });

      markers.push(marker);
      markersRef.current.push({ marker, screen });
    });

    // Create clusterer with SuperCluster algorithm for better performance
    clustererRef.current = new MarkerClusterer({
      map: mapInstanceRef.current,
      markers,
      algorithm: new SuperClusterAlgorithm({
        maxZoom: 16,
        radius: 80,
      }),
      renderer: createClusterRenderer(),
      onClusterClick: (event, cluster, map) => {
        // Animated zoom into cluster
        const bounds = cluster.bounds;
        if (bounds) {
          // Smooth zoom animation
          const currentZoom = map.getZoom() || DEFAULT_ZOOM;
          const targetZoom = Math.min((currentZoom || 11) + 3, 18);
          
          map.panTo(cluster.position);
          
          // Animate zoom with setTimeout for smooth effect
          setTimeout(() => {
            map.setZoom(targetZoom);
          }, 150);
        }
      },
    });

    // Fit bounds if we have screens
    if (validScreens.length > 1) {
      mapInstanceRef.current.fitBounds(bounds, 50);
    } else if (validScreens.length === 1 && validScreens[0].lat && validScreens[0].lng) {
      mapInstanceRef.current.setCenter({ lat: validScreens[0].lat, lng: validScreens[0].lng });
      mapInstanceRef.current.setZoom(14);
    }
  }, [screens, mapLoaded, createMarkerElement, createClusterRenderer, onScreenClick]);

  // Create info window content
  const createInfoWindowContent = (screen: ScreenCardProps): string => {
    const imageUrl = screen.imagenes?.[0] || defaultBillboardImage;
    const precio = screen.precio 
      ? `$${screen.precio.toLocaleString("es-MX")} MXN/mes`
      : "Consultar precio";

    return `
      <div style="min-width: 250px; max-width: 300px; font-family: system-ui, sans-serif;">
        <img 
          src="${imageUrl}" 
          alt="${screen.nombre}"
          style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;"
          onerror="this.src='${defaultBillboardImage}'"
        />
        <div style="padding: 4px 0;">
          <h3 style="font-size: 14px; font-weight: 600; margin: 0 0 4px 0; color: #1a1a1a;">
            ${screen.nombre}
          </h3>
          <p style="font-size: 12px; color: #666; margin: 0 0 8px 0;">
            ${screen.ubicacion}, ${screen.ciudad}
          </p>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 14px; font-weight: 600; color: #1a1a1a;">
              ${precio}
            </span>
            <button 
              id="info-btn-${screen.id}"
              style="
                background: hsl(var(--primary));
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 500;
                cursor: pointer;
              "
            >
              Ver detalle
            </button>
          </div>
        </div>
      </div>
    `;
  };

  if (loading || !mapLoaded) {
    return (
      <Card className={cn("relative overflow-hidden", className)}>
        <Skeleton className="w-full h-full min-h-[400px]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            <span className="text-sm text-muted-foreground">Cargando mapa...</span>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      {/* Map Container */}
      <div ref={mapRef} className="w-full h-full min-h-[400px]" />

      {/* Expand/Collapse Button */}
      {onExpandToggle && (
        <Button
          variant="secondary"
          size="icon"
          onClick={onExpandToggle}
          className="absolute top-4 right-4 z-10 shadow-lg"
        >
          {expanded ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </Button>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-background/95 backdrop-blur-sm rounded-lg p-3 shadow-lg">
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: "hsl(var(--primary))" }} />
            <span>Estático</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: "#3b82f6" }} />
            <span>Digital</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: "#10b981" }} />
            <span>Computer Vision</span>
          </div>
        </div>
      </div>

      {/* Screens count */}
      <Badge 
        variant="secondary" 
        className="absolute top-4 left-4 z-10 shadow-lg bg-background/95 backdrop-blur-sm"
      >
        <MapPin className="h-3 w-3 mr-1" />
        {screens.filter(s => s.lat && s.lng).length} pantallas en el mapa
      </Badge>
    </Card>
  );
}
