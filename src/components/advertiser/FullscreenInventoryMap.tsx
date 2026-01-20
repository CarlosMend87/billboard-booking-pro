import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { 
  MapPin, Monitor, Building, Loader2, Camera, Users, Compass, 
  Download, Edit3, Flame, ShoppingCart, X, Filter, Search,
  Layers, ChevronUp, ChevronDown
} from "lucide-react";
import { InventoryFilters, AdvancedFiltersState } from "@/types/inventory";
import { InventoryAsset } from "@/lib/mockInventory";
import { CartItemModalidad, CartItemConfig } from "@/types/cart";
import { Loader } from "@googlemaps/js-api-loader";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { supabase } from "@/integrations/supabase/client";
import { formatTruncatedId, cn } from "@/lib/utils";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { formatPrice as pricingFormatPrice, precioCatorcenal, precioSemanal } from "@/lib/pricing";
import { AirbnbSearchBar, SearchFilters } from "./AirbnbSearchBar";
import { AdvancedFilters } from "./AdvancedFilters";
import { POIProximityFilter, POIFilterState } from "./POIProximityFilter";

interface FullscreenInventoryMapProps {
  filters: InventoryFilters;
  onFiltersChange: (filters: Partial<InventoryFilters>) => void;
  onAdvancedFiltersChange: (filters: Partial<AdvancedFiltersState>) => void;
  onClearAdvancedFilters: () => void;
  onAddToCart: (asset: InventoryAsset, modalidad: CartItemModalidad, config: CartItemConfig, quantity?: number) => void;
  onClose: () => void;
}

interface MapBillboard {
  id: string;
  nombre: string;
  direccion: string;
  lat: number;
  lng: number;
  tipo: string;
  status: string;
  owner_id: string;
  precio: any;
  medidas: any;
  contratacion: any;
  has_computer_vision?: boolean;
  last_detection_count?: number;
  last_detection_date?: string;
}

export function FullscreenInventoryMap({ 
  filters, 
  onFiltersChange, 
  onAdvancedFiltersChange,
  onClearAdvancedFilters,
  onAddToCart, 
  onClose 
}: FullscreenInventoryMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [billboards, setBillboards] = useState<MapBillboard[]>([]);
  const [filteredBillboards, setFilteredBillboards] = useState<MapBillboard[]>([]);
  const [selectedBillboard, setSelectedBillboard] = useState<MapBillboard | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  
  const [heatmapLayer, setHeatmapLayer] = useState<google.maps.visualization.HeatmapLayer | null>(null);
  const [drawingManager, setDrawingManager] = useState<google.maps.drawing.DrawingManager | null>(null);
  const [drawnShapes, setDrawnShapes] = useState<google.maps.Polygon[]>([]);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [billboardsInZone, setBillboardsInZone] = useState<MapBillboard[]>([]);
  
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [poiFilter, setPOIFilter] = useState<POIFilterState>({
    poiType: null,
    radius: 1000,
    billboardIds: null
  });

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Fetch billboards
  useEffect(() => {
    const fetchBillboards = async () => {
      try {
        const { data, error } = await supabase
          .from('billboards')
          .select('*');

        if (error) throw error;

        const realBillboards = data?.map(billboard => ({
          id: billboard.id,
          nombre: billboard.nombre,
          direccion: billboard.direccion,
          lat: Number(billboard.lat),
          lng: Number(billboard.lng),
          tipo: billboard.tipo,
          status: billboard.status,
          owner_id: billboard.owner_id,
          precio: billboard.precio,
          medidas: billboard.medidas,
          contratacion: billboard.contratacion || {},
          has_computer_vision: billboard.has_computer_vision || false,
          last_detection_count: billboard.last_detection_count || 0,
          last_detection_date: billboard.last_detection_date
        })) || [];

        setBillboards(realBillboards);
      } catch (error) {
        console.error('Error fetching billboards:', error);
        setBillboards([]);
      }
    };

    fetchBillboards();
  }, []);

  const getMarkerColor = (billboard: MapBillboard) => {
    if (billboard.status !== 'disponible') return '#ef4444';
    if (billboard.tipo === 'digital') return '#3b82f6';
    return '#22c55e';
  };

  const getMarkerIcon = (billboard: MapBillboard) => {
    return billboard.tipo === 'digital' ? '📱' : '📋';
  };

  // Apply filters
  useEffect(() => {
    if (billboards.length === 0) {
      setFilteredBillboards([]);
      return;
    }

    let filtered = [...billboards];

    if (filters.advancedFilters.billboardTypes.length > 0) {
      filtered = filtered.filter(b => 
        filters.advancedFilters.billboardTypes.includes(b.tipo)
      );
    }

    if (filters.advancedFilters.modalidades.length > 0) {
      filtered = filtered.filter(b => {
        const hasModalidad = filters.advancedFilters.modalidades.some(modalidad => {
          return b.contratacion && b.contratacion[modalidad as keyof typeof b.contratacion];
        });
        return hasModalidad;
      });
    }

    if (filters.advancedFilters.priceRange[0] > 0 || filters.advancedFilters.priceRange[1] < 100000) {
      filtered = filtered.filter(b => {
        const price = b.precio?.mensual || 0;
        return price >= filters.advancedFilters.priceRange[0] && 
               price <= filters.advancedFilters.priceRange[1];
      });
    }

    if (filters.advancedFilters.hasComputerVision !== null) {
      filtered = filtered.filter(b => 
        b.has_computer_vision === filters.advancedFilters.hasComputerVision
      );
    }

    setFilteredBillboards(filtered);
  }, [billboards, filters]);

  const stats = {
    total: filteredBillboards.length,
    digital: filteredBillboards.filter(b => b.tipo === 'digital').length,
    fijo: filteredBillboards.filter(b => b.tipo !== 'digital').length,
    withCV: filteredBillboards.filter(b => b.has_computer_vision).length,
  };

  // Initialize map
  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current || filteredBillboards.length === 0) return;

      try {
        const loader = new Loader({
          apiKey: "AIzaSyB1ErtrPfoAKScTZR7Fa2pnxf47BRImu80",
          version: "weekly",
          libraries: ["visualization", "drawing"]
        });

        const { Map } = await loader.importLibrary("maps");
        const { AdvancedMarkerElement } = await loader.importLibrary("marker");
        const visualization = await loader.importLibrary("visualization") as any;
        const drawing = await loader.importLibrary("drawing") as any;

        const center = { lat: 23.6345, lng: -102.5528 };

        const map = new Map(mapRef.current, {
          center,
          zoom: 5,
          mapId: "fullscreen-inventory-map",
          streetViewControl: false,
          mapTypeControl: true,
          mapTypeControlOptions: {
            position: google.maps.ControlPosition.TOP_RIGHT,
          },
          fullscreenControl: false,
          zoomControl: true,
          zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_CENTER,
          },
        });

        mapInstanceRef.current = map;

        const markers: google.maps.marker.AdvancedMarkerElement[] = [];

        filteredBillboards.forEach((billboard) => {
          const markerElement = document.createElement('div');
          markerElement.style.cursor = 'pointer';
          markerElement.style.transition = 'all 0.3s ease';
          markerElement.className = 'billboard-marker';
          
          const markerColor = getMarkerColor(billboard);
          const markerContent = document.createElement('div');
          markerContent.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 6px 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            border: 3px solid ${markerColor};
            min-width: 70px;
            text-align: center;
            transition: all 0.3s ease;
          `;
          
          const markerIcon = document.createElement('div');
          markerIcon.style.fontSize = '18px';
          markerIcon.style.lineHeight = '1';
          markerIcon.textContent = getMarkerIcon(billboard);
          
          const markerPrice = document.createElement('div');
          markerPrice.style.fontSize = '11px';
          markerPrice.style.fontWeight = 'bold';
          markerPrice.style.color = markerColor;
          markerPrice.style.marginTop = '2px';
          const price = billboard.precio?.mensual || 0;
          markerPrice.textContent = `$${(price / 1000).toFixed(0)}K`;
          
          markerContent.appendChild(markerIcon);
          markerContent.appendChild(markerPrice);
          markerElement.appendChild(markerContent);

          const marker = new AdvancedMarkerElement({
            map,
            position: { lat: billboard.lat, lng: billboard.lng },
            content: markerElement,
            title: billboard.nombre
          });

          markerElement.addEventListener('mouseenter', () => {
            markerElement.style.transform = 'scale(1.15) translateY(-5px)';
            markerContent.style.boxShadow = '0 6px 20px rgba(0,0,0,0.25)';
          });

          markerElement.addEventListener('mouseleave', () => {
            markerElement.style.transform = 'scale(1) translateY(0)';
            markerContent.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
          });

          markerElement.addEventListener('click', () => {
            setSelectedBillboard(billboard);
            setIsPanelOpen(true);
            map.panTo({ lat: billboard.lat, lng: billboard.lng });
            map.setZoom(Math.max(map.getZoom() || 12, 12));
          });

          markers.push(marker);
        });

        markersRef.current = markers;

        const clusterRenderer = {
          render: ({ count, position }: { count: number; position: google.maps.LatLng }) => {
            const clusterMarker = document.createElement('div');
            clusterMarker.style.cssText = `
              background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
              border-radius: 50%;
              width: ${Math.min(40 + Math.log(count) * 8, 60)}px;
              height: ${Math.min(40 + Math.log(count) * 8, 60)}px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: ${Math.min(12 + Math.log(count) * 2, 18)}px;
              border: 3px solid white;
              box-shadow: 0 4px 12px rgba(59, 130, 246, 0.5);
              cursor: pointer;
            `;
            clusterMarker.textContent = String(count);
            
            return new google.maps.marker.AdvancedMarkerElement({
              position,
              content: clusterMarker,
            });
          }
        };

        clustererRef.current = new MarkerClusterer({
          map,
          markers,
          algorithmOptions: {
            maxZoom: 14,
          },
          renderer: clusterRenderer
        });

        const heatmapData = filteredBillboards.map(billboard => ({
          location: new google.maps.LatLng(billboard.lat, billboard.lng),
          weight: billboard.has_computer_vision && billboard.last_detection_count 
            ? billboard.last_detection_count / 100 
            : 1
        }));

        const heatmap = new visualization.HeatmapLayer({
          data: heatmapData,
          map: null,
          radius: 50,
          opacity: 0.7
        });
        setHeatmapLayer(heatmap);

        const drawManager = new drawing.DrawingManager({
          drawingMode: null,
          drawingControl: false,
          polygonOptions: {
            fillColor: '#3b82f6',
            fillOpacity: 0.3,
            strokeWeight: 2,
            strokeColor: '#3b82f6',
            editable: true,
            draggable: true
          }
        });
        drawManager.setMap(map);
        setDrawingManager(drawManager);

        google.maps.event.addListener(drawManager, 'polygoncomplete', (polygon: google.maps.Polygon) => {
          setDrawnShapes(prev => [...prev, polygon]);
          
          const billboardsInPolygon = filteredBillboards.filter(billboard => {
            const point = new google.maps.LatLng(billboard.lat, billboard.lng);
            return google.maps.geometry.poly.containsLocation(point, polygon);
          });
          
          setBillboardsInZone(billboardsInPolygon);
          setIsDrawingMode(false);
          drawManager.setDrawingMode(null);
        });

        setIsLoading(false);
      } catch (error) {
        console.error("Error loading map:", error);
        setIsLoading(false);
      }
    };

    initMap();
  }, [filteredBillboards]);

  const formatPrice = (price: number) => pricingFormatPrice(price);

  const recenterMap = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter({ lat: 23.6345, lng: -102.5528 });
      mapInstanceRef.current.setZoom(5);
    }
  };

  const toggleHeatmap = () => {
    if (heatmapLayer) {
      heatmapLayer.setMap(showHeatmap ? null : mapInstanceRef.current);
      setShowHeatmap(!showHeatmap);
    }
  };

  const toggleDrawingMode = () => {
    if (drawingManager) {
      const newMode = !isDrawingMode;
      setIsDrawingMode(newMode);
      drawingManager.setDrawingMode(
        newMode ? google.maps.drawing.OverlayType.POLYGON : null
      );
    }
  };

  const clearDrawnShapes = () => {
    drawnShapes.forEach(shape => shape.setMap(null));
    setDrawnShapes([]);
    setBillboardsInZone([]);
  };

  const handleSearchFilters = useCallback((searchFilters: SearchFilters) => {
    onFiltersChange({
      location: searchFilters.location,
      startDate: searchFilters.startDate || null,
      endDate: searchFilters.endDate || null,
    });
  }, [onFiltersChange]);

  const downloadMapPDF = async () => {
    if (!mapRef.current) return;

    try {
      const canvas = await html2canvas(mapRef.current, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.text("Reporte de Zona Personalizada", pageWidth / 2, 15, { align: "center" });
      
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Fecha: ${new Date().toLocaleDateString('es-MX')}`, pageWidth / 2, 22, { align: "center" });
      
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 10, 28, imgWidth, Math.min(imgHeight, pageHeight - 80));
      
      let yPos = Math.min(imgHeight, pageHeight - 80) + 35;
      
      if (billboardsInZone.length > 0) {
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.text(`Pantallas en la zona: ${billboardsInZone.length}`, 10, yPos);
        yPos += 10;
        
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "normal");
        
        billboardsInZone.slice(0, 10).forEach((billboard, index) => {
          if (yPos > pageHeight - 20) {
            pdf.addPage();
            yPos = 15;
          }
          
          const price = billboard.precio?.mensual || 0;
          pdf.text(
            `${index + 1}. ${billboard.nombre} - ${billboard.tipo} - ${formatPrice(price)}/mes`,
            10,
            yPos
          );
          yPos += 5;
        });
        
        if (billboardsInZone.length > 10) {
          pdf.text(`... y ${billboardsInZone.length - 10} más`, 10, yPos);
        }
      }
      
      pdf.save(`zona-personalizada-${new Date().getTime()}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Full viewport map */}
      <div ref={mapRef} className="absolute inset-0 w-full h-full" />
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-20">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm font-medium">Cargando mapa...</span>
          </div>
        </div>
      )}

      {/* Close button */}
      <Button
        variant="secondary"
        size="icon"
        onClick={onClose}
        className="absolute top-4 right-4 z-30 h-10 w-10 rounded-full shadow-lg bg-background/95 backdrop-blur-sm hover:bg-background"
      >
        <X className="h-5 w-5" />
      </Button>

      {/* Top floating search bar */}
      <div className="absolute top-4 left-4 right-20 z-20">
        <div className="bg-background/95 backdrop-blur-sm rounded-full shadow-lg max-w-4xl mx-auto">
          <AirbnbSearchBar onSearch={handleSearchFilters} />
        </div>
      </div>

      {/* Left floating controls */}
      <div className="absolute top-24 left-4 z-20 flex flex-col gap-2">
        {/* Map controls */}
        <div className="bg-background/95 backdrop-blur-sm rounded-xl shadow-lg p-2 flex flex-col gap-1">
          <Button
            variant={showHeatmap ? "default" : "ghost"}
            size="sm"
            onClick={toggleHeatmap}
            className="justify-start gap-2"
          >
            <Flame className="h-4 w-4" />
            <span className="hidden lg:inline">Heatmap</span>
          </Button>
          
          <Button
            variant={isDrawingMode ? "default" : "ghost"}
            size="sm"
            onClick={toggleDrawingMode}
            className="justify-start gap-2"
          >
            <Edit3 className="h-4 w-4" />
            <span className="hidden lg:inline">Dibujar</span>
          </Button>
          
          {drawnShapes.length > 0 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearDrawnShapes}
                className="justify-start gap-2"
              >
                <X className="h-4 w-4" />
                <span className="hidden lg:inline">Limpiar</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={downloadMapPDF}
                className="justify-start gap-2"
              >
                <Download className="h-4 w-4" />
                <span className="hidden lg:inline">PDF</span>
              </Button>
            </>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={recenterMap}
            className="justify-start gap-2"
          >
            <Compass className="h-4 w-4" />
            <span className="hidden lg:inline">Recentrar</span>
          </Button>
        </div>

        {/* Filters toggle */}
        <div className="bg-background/95 backdrop-blur-sm rounded-xl shadow-lg p-2">
          <Button
            variant={showFilters ? "default" : "ghost"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="w-full justify-start gap-2"
          >
            <Filter className="h-4 w-4" />
            <span className="hidden lg:inline">Filtros</span>
          </Button>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="bg-background/95 backdrop-blur-sm rounded-xl shadow-lg p-3 max-w-xs animate-in slide-in-from-left-2">
            <div className="space-y-3">
              <AdvancedFilters
                filters={filters.advancedFilters}
                onFiltersChange={onAdvancedFiltersChange}
                onClearFilters={onClearAdvancedFilters}
              />
              <POIProximityFilter
                filter={poiFilter}
                onFilterChange={setPOIFilter}
              />
            </div>
          </div>
        )}
      </div>

      {/* Stats panel (collapsible) */}
      <div className="absolute top-24 right-16 z-20">
        <div className="bg-background/95 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden">
          <button
            onClick={() => setShowStats(!showStats)}
            className="w-full px-3 py-2 flex items-center justify-between hover:bg-muted/50 transition-colors"
          >
            <span className="text-sm font-medium flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Stats
            </span>
            {showStats ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          
          {showStats && (
            <div className="p-3 pt-0 space-y-2 animate-in slide-in-from-top-2">
              <div className="flex items-center gap-2 px-2 py-1.5 bg-primary/10 rounded-lg">
                <Building className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-sm font-bold text-primary">{stats.total}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 px-2 py-1.5 bg-blue-500/10 rounded-lg">
                <Monitor className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Digitales</p>
                  <p className="text-sm font-bold text-blue-500">{stats.digital}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 px-2 py-1.5 bg-green-500/10 rounded-lg">
                <Building className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Fijas</p>
                  <p className="text-sm font-bold text-green-500">{stats.fijo}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 px-2 py-1.5 bg-purple-500/10 rounded-lg">
                <Camera className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Con IA</p>
                  <p className="text-sm font-bold text-purple-500">{stats.withCV}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legend (collapsible) */}
      <div className="absolute bottom-4 right-4 z-20">
        <div className="bg-background/95 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden max-w-xs">
          <button
            onClick={() => setShowLegend(!showLegend)}
            className="w-full px-3 py-2 flex items-center justify-between hover:bg-muted/50 transition-colors"
          >
            <span className="text-sm font-medium">Leyenda</span>
            {showLegend ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
          
          {showLegend && (
            <div className="p-3 pt-0 space-y-1.5 text-xs animate-in slide-in-from-bottom-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span>Digital disponible</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>Tradicional disponible</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-destructive" />
                <span>No disponible</span>
              </div>
              {isDrawingMode && (
                <div className="mt-2 pt-2 border-t border-border">
                  <p className="text-yellow-600 dark:text-yellow-400 font-medium">
                    🖊️ Modo dibujo activo
                  </p>
                </div>
              )}
              {billboardsInZone.length > 0 && (
                <div className="mt-2 pt-2 border-t border-border">
                  <p className="font-medium text-primary">
                    📍 {billboardsInZone.length} pantallas en zona
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Billboard detail sheet */}
      <Sheet open={isPanelOpen} onOpenChange={setIsPanelOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          {selectedBillboard && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  {selectedBillboard.tipo === 'digital' ? (
                    <Monitor className="h-5 w-5 text-blue-500" />
                  ) : (
                    <Building className="h-5 w-5 text-green-500" />
                  )}
                  {selectedBillboard.nombre}
                </SheetTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    ID: {formatTruncatedId(selectedBillboard.id)}
                  </Badge>
                  {selectedBillboard.has_computer_vision && (
                    <Badge variant="default" className="bg-purple-600 text-xs">
                      <Camera className="h-3 w-3 mr-1" />
                      IA Activa
                    </Badge>
                  )}
                  <Badge className={selectedBillboard.status === 'disponible' ? "bg-green-600 text-xs" : "bg-destructive text-xs"}>
                    {selectedBillboard.status === 'disponible' ? 'Disponible' : 'Ocupado'}
                  </Badge>
                </div>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <div className="rounded-lg overflow-hidden bg-muted">
                  <img 
                    src="https://static.wixstatic.com/media/3aa6d8_ec45742e0c7642e29fff05d6e9636202~mv2.png/v1/fill/w_980,h_651,al_c,q_90,usm_0.66_1.00_0.01,enc_avif,quality_auto/Espectacular%202.png"
                    alt={selectedBillboard.nombre}
                    className="w-full h-48 object-cover"
                  />
                </div>

                {selectedBillboard.has_computer_vision && selectedBillboard.last_detection_count && selectedBillboard.last_detection_count > 0 && (
                  <div className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-900">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                      <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {selectedBillboard.last_detection_count.toLocaleString()}
                      </p>
                      <p className="text-sm text-purple-600 dark:text-purple-400">
                        personas detectadas ayer
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Tipo</p>
                    <p className="font-medium capitalize">{selectedBillboard.tipo}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Dimensiones</p>
                    {selectedBillboard.tipo === 'digital' && selectedBillboard.medidas?.dimension_pixel ? (
                      <p className="font-medium text-blue-600">{selectedBillboard.medidas.dimension_pixel} px</p>
                    ) : (
                      <p className="font-medium">
                        {selectedBillboard.medidas?.ancho_m || selectedBillboard.medidas?.base_m || 0}m × {selectedBillboard.medidas?.alto_m || 0}m
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-semibold text-muted-foreground border-b pb-1">Precios</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Mensual</p>
                      <p className="font-semibold text-green-600">{formatPrice(selectedBillboard.precio?.mensual || 0)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Catorcenal</p>
                      <p className="font-medium">{formatPrice(precioCatorcenal(selectedBillboard.precio?.mensual || 0))}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Semanal</p>
                      <p className="font-medium">{formatPrice(precioSemanal(selectedBillboard.precio?.mensual || 0))}</p>
                    </div>
                    {selectedBillboard.tipo === 'digital' && (
                      <>
                        {selectedBillboard.precio?.dia && (
                          <div>
                            <p className="text-xs text-muted-foreground">Por Día</p>
                            <p className="font-medium text-blue-600">{formatPrice(selectedBillboard.precio.dia)}</p>
                          </div>
                        )}
                        {selectedBillboard.precio?.hora && (
                          <div>
                            <p className="text-xs text-muted-foreground">Por Hora</p>
                            <p className="font-medium text-blue-600">{formatPrice(selectedBillboard.precio.hora)}</p>
                          </div>
                        )}
                        {selectedBillboard.precio?.spot && (
                          <div>
                            <p className="text-xs text-muted-foreground">Por Spot</p>
                            <p className="font-medium text-blue-600">{formatPrice(selectedBillboard.precio.spot)}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">Coordenadas</p>
                    <p className="font-medium text-xs">{selectedBillboard.lat.toFixed(6)}, {selectedBillboard.lng.toFixed(6)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Propietario</p>
                    <p className="font-medium text-xs">{selectedBillboard.owner_id.slice(0, 8)}...</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Dirección</p>
                    <p className="font-medium text-sm">{selectedBillboard.direccion}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      window.open(
                        `https://www.google.com/maps/search/?api=1&query=${selectedBillboard.lat},${selectedBillboard.lng}`,
                        '_blank',
                        'noopener,noreferrer'
                      );
                    }}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Ver en el mapa
                  </Button>
                  <Button
                    className="flex-1"
                    disabled={selectedBillboard.status !== 'disponible'}
                    variant={selectedBillboard.status !== 'disponible' ? 'secondary' : 'default'}
                    onClick={() => {
                      const asset: InventoryAsset = {
                        id: selectedBillboard.id,
                        nombre: selectedBillboard.nombre,
                        lat: selectedBillboard.lat,
                        lng: selectedBillboard.lng,
                        tipo: selectedBillboard.tipo as any,
                        owner_id: selectedBillboard.owner_id,
                        precio: selectedBillboard.precio,
                        medidas: selectedBillboard.medidas,
                        contratacion: {
                          mensual: true,
                          catorcenal: false,
                          semanal: false,
                          spot: false,
                          hora: false,
                          dia: false,
                          cpm: false
                        },
                        estado: selectedBillboard.status === 'disponible' ? 'disponible' : 'ocupado',
                        propietario: selectedBillboard.owner_id,
                        foto: ''
                      };
                      
                      onAddToCart(asset, 'mensual', { meses: 1 });
                      setIsPanelOpen(false);
                    }}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {selectedBillboard.status !== 'disponible' ? 'No disponible' : 'Agregar'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
