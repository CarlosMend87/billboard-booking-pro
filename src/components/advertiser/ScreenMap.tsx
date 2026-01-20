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
  Minimize2,
  Flame,
  PenTool,
  Trash2,
  X,
  Monitor,
  Zap,
  DollarSign,
  Eye
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

interface ZoneStats {
  total: number;
  digital: number;
  static: number;
  withCV: number;
  minPrice: number | null;
  maxPrice: number | null;
  totalImpacts: number;
  screens: ScreenCardProps[];
}

const MAP_ID = "advertiser-map";
const DEFAULT_CENTER = { lat: 19.4326, lng: -99.1332 }; // CDMX
const DEFAULT_ZOOM = 11;

// Get API key from environment or use fallback
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyB1ErtrPfoAKScTZR7Fa2pnxf47BRImu80";

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
  const heatmapRef = useRef<google.maps.visualization.HeatmapLayer | null>(null);
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);
  const drawnShapesRef = useRef<google.maps.Polygon[]>([]);
  
  const [mapLoaded, setMapLoaded] = useState(false);
  const [heatmapEnabled, setHeatmapEnabled] = useState(false);
  const [drawingEnabled, setDrawingEnabled] = useState(false);
  const [zoneStats, setZoneStats] = useState<ZoneStats | null>(null);
  const [showStatsPanel, setShowStatsPanel] = useState(false);

  // Calculate screens within a polygon
  const calculateZoneStats = useCallback((polygon: google.maps.Polygon): ZoneStats => {
    const path = polygon.getPath();
    const polygonPath = path.getArray();
    
    const screensInZone = screens.filter(screen => {
      if (!screen.lat || !screen.lng) return false;
      const point = new google.maps.LatLng(screen.lat, screen.lng);
      return google.maps.geometry.poly.containsLocation(point, polygon);
    });

    const prices = screensInZone.map(s => s.precio).filter((p): p is number => p !== null && p !== undefined);
    
    return {
      total: screensInZone.length,
      digital: screensInZone.filter(s => s.tipo === 'digital').length,
      static: screensInZone.filter(s => s.tipo !== 'digital').length,
      withCV: screensInZone.filter(s => s.hasComputerVision).length,
      minPrice: prices.length > 0 ? Math.min(...prices) : null,
      maxPrice: prices.length > 0 ? Math.max(...prices) : null,
      totalImpacts: screensInZone.reduce((sum, s) => sum + (s.impactos || 0), 0),
      screens: screensInZone,
    };
  }, [screens]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapLoaded) return;

    const loader = new Loader({
      apiKey: GOOGLE_MAPS_API_KEY,
      version: "weekly",
      libraries: ["marker", "visualization", "drawing", "geometry"],
    });

    loader.load().then(async () => {
      const { Map } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;
      await google.maps.importLibrary("marker");
      await google.maps.importLibrary("visualization");
      await google.maps.importLibrary("drawing");
      await google.maps.importLibrary("geometry");

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

      // Initialize Drawing Manager
      drawingManagerRef.current = new google.maps.drawing.DrawingManager({
        drawingMode: null,
        drawingControl: false,
        polygonOptions: {
          fillColor: "#3b82f6",
          fillOpacity: 0.2,
          strokeColor: "#3b82f6",
          strokeWeight: 2,
          editable: true,
          draggable: true,
        },
        rectangleOptions: {
          fillColor: "#3b82f6",
          fillOpacity: 0.2,
          strokeColor: "#3b82f6",
          strokeWeight: 2,
          editable: true,
          draggable: true,
        },
        circleOptions: {
          fillColor: "#3b82f6",
          fillOpacity: 0.2,
          strokeColor: "#3b82f6",
          strokeWeight: 2,
          editable: true,
          draggable: true,
        },
      });
      drawingManagerRef.current.setMap(mapInstanceRef.current);

      // Listen for polygon complete
      google.maps.event.addListener(drawingManagerRef.current, 'polygoncomplete', (polygon: google.maps.Polygon) => {
        drawnShapesRef.current.push(polygon);
        const stats = calculateZoneStats(polygon);
        setZoneStats(stats);
        setShowStatsPanel(true);
        
        // Update stats when polygon is edited
        google.maps.event.addListener(polygon.getPath(), 'set_at', () => {
          const newStats = calculateZoneStats(polygon);
          setZoneStats(newStats);
        });
        google.maps.event.addListener(polygon.getPath(), 'insert_at', () => {
          const newStats = calculateZoneStats(polygon);
          setZoneStats(newStats);
        });
      });

      google.maps.event.addListener(drawingManagerRef.current, 'rectanglecomplete', (rectangle: google.maps.Rectangle) => {
        // Convert rectangle to polygon for consistent handling
        const bounds = rectangle.getBounds();
        if (!bounds) return;
        
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        
        const polygon = new google.maps.Polygon({
          paths: [
            { lat: ne.lat(), lng: sw.lng() },
            { lat: ne.lat(), lng: ne.lng() },
            { lat: sw.lat(), lng: ne.lng() },
            { lat: sw.lat(), lng: sw.lng() },
          ],
          fillColor: "#3b82f6",
          fillOpacity: 0.2,
          strokeColor: "#3b82f6",
          strokeWeight: 2,
          editable: true,
          draggable: true,
          map: mapInstanceRef.current,
        });
        
        rectangle.setMap(null); // Remove rectangle
        drawnShapesRef.current.push(polygon);
        const stats = calculateZoneStats(polygon);
        setZoneStats(stats);
        setShowStatsPanel(true);
      });

      google.maps.event.addListener(drawingManagerRef.current, 'circlecomplete', (circle: google.maps.Circle) => {
        // Convert circle to polygon approximation
        const center = circle.getCenter();
        const radius = circle.getRadius();
        if (!center) return;

        const points: google.maps.LatLngLiteral[] = [];
        for (let i = 0; i < 32; i++) {
          const angle = (i / 32) * 2 * Math.PI;
          const lat = center.lat() + (radius / 111320) * Math.cos(angle);
          const lng = center.lng() + (radius / (111320 * Math.cos(center.lat() * Math.PI / 180))) * Math.sin(angle);
          points.push({ lat, lng });
        }

        const polygon = new google.maps.Polygon({
          paths: points,
          fillColor: "#3b82f6",
          fillOpacity: 0.2,
          strokeColor: "#3b82f6",
          strokeWeight: 2,
          editable: true,
          draggable: true,
          map: mapInstanceRef.current,
        });

        circle.setMap(null); // Remove circle
        drawnShapesRef.current.push(polygon);
        const stats = calculateZoneStats(polygon);
        setZoneStats(stats);
        setShowStatsPanel(true);
      });

      setMapLoaded(true);
    }).catch((err) => {
      console.error("Error loading Google Maps:", err);
    });
  }, [mapLoaded, calculateZoneStats]);

  // Toggle heatmap
  const toggleHeatmap = useCallback(() => {
    if (!mapInstanceRef.current) return;

    if (heatmapEnabled) {
      // Disable heatmap
      heatmapRef.current?.setMap(null);
      heatmapRef.current = null;
      setHeatmapEnabled(false);
      
      // Show markers again
      clustererRef.current?.setMap(mapInstanceRef.current);
    } else {
      // Enable heatmap
      const validScreens = screens.filter(s => s.lat && s.lng);
      const heatmapData = validScreens.map(screen => ({
        location: new google.maps.LatLng(screen.lat!, screen.lng!),
        weight: screen.hasComputerVision ? 3 : screen.tipo === 'digital' ? 2 : 1,
      }));

      heatmapRef.current = new google.maps.visualization.HeatmapLayer({
        data: heatmapData,
        map: mapInstanceRef.current,
        radius: 40,
        opacity: 0.7,
        gradient: [
          'rgba(0, 0, 0, 0)',
          'rgba(59, 130, 246, 0.4)',
          'rgba(59, 130, 246, 0.6)',
          'rgba(147, 51, 234, 0.7)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(239, 68, 68, 0.9)',
        ],
      });
      setHeatmapEnabled(true);
      
      // Hide markers when heatmap is on
      clustererRef.current?.setMap(null);
    }
  }, [heatmapEnabled, screens]);

  // Toggle drawing mode
  const toggleDrawing = useCallback(() => {
    if (!drawingManagerRef.current) return;

    if (drawingEnabled) {
      drawingManagerRef.current.setDrawingMode(null);
      setDrawingEnabled(false);
    } else {
      drawingManagerRef.current.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
      setDrawingEnabled(true);
    }
  }, [drawingEnabled]);

  // Clear all drawn shapes
  const clearShapes = useCallback(() => {
    drawnShapesRef.current.forEach(shape => shape.setMap(null));
    drawnShapesRef.current = [];
    setZoneStats(null);
    setShowStatsPanel(false);
  }, []);

  // Create custom cluster renderer
  const createClusterRenderer = useCallback(() => {
    return {
      render: ({ count, position }: { count: number; position: google.maps.LatLng }) => {
        const size = count < 10 ? 40 : count < 50 ? 50 : count < 100 ? 60 : 70;
        const fontSize = count < 10 ? 14 : count < 50 ? 16 : 18;

        const div = document.createElement("div");
        div.className = "cluster-marker";
        div.style.cssText = `
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
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
    
    let bgColor = "#10b981"; // Green for available static
    if (isDigital) bgColor = "#3b82f6"; // Blue for digital
    if (hasCV) bgColor = "#8b5cf6"; // Purple for CV

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

    // Update heatmap if enabled
    if (heatmapEnabled && heatmapRef.current) {
      const validScreens = screens.filter(s => s.lat && s.lng);
      const heatmapData = validScreens.map(screen => ({
        location: new google.maps.LatLng(screen.lat!, screen.lng!),
        weight: screen.hasComputerVision ? 3 : screen.tipo === 'digital' ? 2 : 1,
      }));
      heatmapRef.current.setData(heatmapData);
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
        const content = createInfoWindowContent(screen);
        infoWindowRef.current?.setContent(content);
        infoWindowRef.current?.open({
          anchor: marker,
          map: mapInstanceRef.current,
        });

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

    // Create clusterer (only show if heatmap is off)
    clustererRef.current = new MarkerClusterer({
      map: heatmapEnabled ? null : mapInstanceRef.current,
      markers,
      algorithm: new SuperClusterAlgorithm({
        maxZoom: 16,
        radius: 80,
      }),
      renderer: createClusterRenderer(),
      onClusterClick: (event, cluster, map) => {
        const bounds = cluster.bounds;
        if (bounds) {
          const currentZoom = map.getZoom() || DEFAULT_ZOOM;
          const targetZoom = Math.min((currentZoom || 11) + 3, 18);
          
          map.panTo(cluster.position);
          setTimeout(() => {
            map.setZoom(targetZoom);
          }, 150);
        }
      },
    });

    // Fit bounds
    if (validScreens.length > 1) {
      mapInstanceRef.current.fitBounds(bounds, 50);
    } else if (validScreens.length === 1 && validScreens[0].lat && validScreens[0].lng) {
      mapInstanceRef.current.setCenter({ lat: validScreens[0].lat, lng: validScreens[0].lng });
      mapInstanceRef.current.setZoom(14);
    }
  }, [screens, mapLoaded, heatmapEnabled, createMarkerElement, createClusterRenderer, onScreenClick]);

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
                background: #3b82f6;
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

  if (loading) {
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

      {/* Map Loading Overlay */}
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            <span className="text-sm text-muted-foreground">Cargando mapa...</span>
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        {/* Heatmap Toggle */}
        <Button
          variant={heatmapEnabled ? "default" : "secondary"}
          size="sm"
          onClick={toggleHeatmap}
          className="shadow-lg"
          disabled={!mapLoaded}
        >
          <Flame className="h-4 w-4 mr-2" />
          {heatmapEnabled ? "Ocultar Heatmap" : "Ver Heatmap"}
        </Button>

        {/* Drawing Toggle */}
        <Button
          variant={drawingEnabled ? "default" : "secondary"}
          size="sm"
          onClick={toggleDrawing}
          className="shadow-lg"
          disabled={!mapLoaded}
        >
          <PenTool className="h-4 w-4 mr-2" />
          {drawingEnabled ? "Finalizar Dibujo" : "Dibujar Zona"}
        </Button>

        {/* Clear Shapes */}
        {drawnShapesRef.current.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={clearShapes}
            className="shadow-lg"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Limpiar Zonas
          </Button>
        )}
      </div>

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
            <div className="w-3 h-3 rounded-full" style={{ background: "#10b981" }} />
            <span>Disponible</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: "#3b82f6" }} />
            <span>Digital</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: "#8b5cf6" }} />
            <span>Computer Vision</span>
          </div>
        </div>
        {drawingEnabled && (
          <div className="mt-2 pt-2 border-t border-border text-xs text-muted-foreground">
            Haz clic para dibujar puntos. Doble clic para cerrar la zona.
          </div>
        )}
      </div>

      {/* Screens count */}
      <Badge 
        variant="secondary" 
        className="absolute top-4 left-1/2 -translate-x-1/2 z-10 shadow-lg bg-background/95 backdrop-blur-sm"
      >
        <MapPin className="h-3 w-3 mr-1" />
        {screens.filter(s => s.lat && s.lng).length} pantallas en el mapa
      </Badge>

      {/* Zone Statistics Panel */}
      {showStatsPanel && zoneStats && (
        <div className="absolute top-16 right-4 z-20 w-72 bg-background/95 backdrop-blur-sm rounded-lg shadow-xl border border-border overflow-hidden">
          <div className="flex items-center justify-between p-3 border-b border-border bg-primary/5">
            <h3 className="font-semibold text-sm">Estadísticas de Zona</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setShowStatsPanel(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="p-3 space-y-3">
            {/* Total screens */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Monitor className="h-4 w-4 text-primary" />
                <span>Total Pantallas</span>
              </div>
              <span className="font-bold text-lg">{zoneStats.total}</span>
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-2">
                <div className="text-blue-600 dark:text-blue-400 font-medium">Digital</div>
                <div className="font-bold text-lg">{zoneStats.digital}</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded p-2">
                <div className="text-green-600 dark:text-green-400 font-medium">Estático</div>
                <div className="font-bold text-lg">{zoneStats.static}</div>
              </div>
            </div>

            {/* Computer Vision */}
            {zoneStats.withCV > 0 && (
              <div className="flex items-center justify-between text-sm bg-purple-50 dark:bg-purple-900/20 rounded p-2">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-purple-600" />
                  <span>Con Computer Vision</span>
                </div>
                <span className="font-bold">{zoneStats.withCV}</span>
              </div>
            )}

            {/* Price Range */}
            {zoneStats.minPrice !== null && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>Rango de Precios</span>
                </div>
                <span className="font-medium text-xs">
                  ${(zoneStats.minPrice / 1000).toFixed(0)}K - ${(zoneStats.maxPrice! / 1000).toFixed(0)}K
                </span>
              </div>
            )}

            {/* Total Impacts */}
            {zoneStats.totalImpacts > 0 && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span>Impactos Est./Mes</span>
                </div>
                <span className="font-medium">
                  {(zoneStats.totalImpacts / 1000000).toFixed(1)}M
                </span>
              </div>
            )}

            {/* View screens button */}
            {zoneStats.total > 0 && (
              <Button 
                size="sm" 
                className="w-full mt-2"
                onClick={() => {
                  if (zoneStats.screens[0]) {
                    onScreenClick(zoneStats.screens[0].id);
                  }
                }}
              >
                Ver pantallas en zona
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
