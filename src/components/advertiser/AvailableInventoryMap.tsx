import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { MapPin, Monitor, Building, Loader2, Camera, Users, Compass, TrendingUp, Calendar, Download, Edit3, Flame, ShoppingCart } from "lucide-react";
import { InventoryFilters } from "@/types/inventory";
import { InventoryAsset } from "@/lib/mockInventory";
import { CartItemModalidad, CartItemConfig } from "@/types/cart";
import { Loader } from "@googlemaps/js-api-loader";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { supabase } from "@/integrations/supabase/client";
import { formatTruncatedId } from "@/lib/utils";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { formatPrice as pricingFormatPrice } from "@/lib/pricing";

interface AvailableInventoryMapProps {
  filters: InventoryFilters;
  onAddToCart: (asset: InventoryAsset, modalidad: CartItemModalidad, config: CartItemConfig, quantity?: number) => void;
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
  has_computer_vision?: boolean;
  last_detection_count?: number;
  last_detection_date?: string;
}

export function AvailableInventoryMap({ filters, onAddToCart }: AvailableInventoryMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [billboards, setBillboards] = useState<MapBillboard[]>([]);
  const [filteredBillboards, setFilteredBillboards] = useState<MapBillboard[]>([]);
  const [selectedBillboard, setSelectedBillboard] = useState<MapBillboard | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isFilteringProximity, setIsFilteringProximity] = useState(false);
  const [heatmapLayer, setHeatmapLayer] = useState<google.maps.visualization.HeatmapLayer | null>(null);
  const [drawingManager, setDrawingManager] = useState<google.maps.drawing.DrawingManager | null>(null);
  const [drawnShapes, setDrawnShapes] = useState<google.maps.Polygon[]>([]);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [billboardsInZone, setBillboardsInZone] = useState<MapBillboard[]>([]);

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
          has_computer_vision: billboard.has_computer_vision || false,
          last_detection_count: billboard.last_detection_count || 0,
          last_detection_date: billboard.last_detection_date
        })) || [];

        // Debug detallado
        console.log('🔍 TOTAL billboards recibidos:', realBillboards.length);
        const statusCounts = realBillboards.reduce((acc: Record<string, number>, b) => {
          acc[b.status] = (acc[b.status] || 0) + 1;
          return acc;
        }, {});
        console.log('📊 Status de pantallas:', statusCounts);
        
        // Mostrar ejemplos de cada status
        const ejemplosDisponibles = realBillboards.filter(b => b.status === 'disponible').slice(0, 3);
        const ejemplosNoDisponibles = realBillboards.filter(b => b.status !== 'disponible');
        
        console.log(`✅ Disponibles (${statusCounts['disponible'] || 0}):`, 
          ejemplosDisponibles.map(b => `${b.nombre} - "${b.status}"`));
        console.log(`❌ NO Disponibles (${realBillboards.length - (statusCounts['disponible'] || 0)}):`,
          ejemplosNoDisponibles.map(b => `${b.nombre} - "${b.status}"`));

        setBillboards(realBillboards);
      } catch (error) {
        console.error('Error fetching billboards:', error);
        setBillboards([]);
      }
    };

    fetchBillboards();
  }, []);

  const getMarkerColor = (billboard: MapBillboard) => {
    // Azul = disponible
    if (billboard.status === 'disponible') return '#3b82f6';
    // Rojo = no disponible
    return '#ef4444';
  };

  const getMarkerIcon = (billboard: MapBillboard) => {
    return billboard.tipo === 'digital' ? '📱' : '📋';
  };

  useEffect(() => {
    const applyFilters = async () => {
      if (billboards.length === 0) {
        setFilteredBillboards([]);
        return;
      }

      setIsFilteringProximity(filters.advancedFilters.proximityFilters.length > 0);

      let filtered = [...billboards];

      if (filters.advancedFilters.billboardTypes.length > 0) {
        filtered = filtered.filter(b => 
          filters.advancedFilters.billboardTypes.includes(b.tipo)
        );
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

      // Proximity filters temporarily disabled - will be re-implemented after fixing circular dependencies
      // if (filters.advancedFilters.proximityFilters.length > 0) {
      //   filtered = filtered; // Placeholder
      // }

      setFilteredBillboards(filtered);
      setIsFilteringProximity(false);
    };

    applyFilters();
  }, [billboards, filters]);

  const stats = {
    total: filteredBillboards.length,
    digital: filteredBillboards.filter(b => b.tipo === 'digital').length,
    fijo: filteredBillboards.filter(b => b.tipo !== 'digital').length,
    withCV: filteredBillboards.filter(b => b.has_computer_vision).length,
  };

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
          mapId: "available-inventory-map",
          streetViewControl: false,
          mapTypeControl: false,
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

        new MarkerClusterer({
          map,
          markers,
          algorithmOptions: {
            maxZoom: 14,
          },
        });

        // Create heatmap
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

        // Create drawing manager
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

    if (mapInstanceRef.current) {
      initMap();
    } else {
      initMap();
    }
  }, [filteredBillboards]);

  const formatPrice = (price: number) => {
    return pricingFormatPrice(price);
  };

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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Mapa de Inventario - México
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant={showHeatmap ? "default" : "outline"}
                size="sm"
                onClick={toggleHeatmap}
                className="flex items-center gap-2"
              >
                <Flame className="h-4 w-4" />
                Heatmap
              </Button>
              <Button
                variant={isDrawingMode ? "default" : "outline"}
                size="sm"
                onClick={toggleDrawingMode}
                className="flex items-center gap-2"
              >
                <Edit3 className="h-4 w-4" />
                <span className="hidden md:inline">Dibujar Zona</span>
              </Button>
              {drawnShapes.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearDrawnShapes}
                  >
                    Limpiar
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={downloadMapPDF}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden md:inline">PDF</span>
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={recenterMap}
                className="flex items-center gap-2"
              >
                <Compass className="h-4 w-4" />
                Recentrar
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {(isLoading || isFilteringProximity) && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 rounded-md">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="text-sm">
                    {isFilteringProximity ? 'Buscando puntos de interés cercanos...' : 'Cargando mapa...'}
                  </span>
                </div>
              </div>
            )}
            
            <div 
              ref={mapRef} 
              className="w-full h-[500px] md:h-[600px] rounded-md bg-muted"
            />
            
            {/* Mini Stats Cards */}
            <div className="absolute top-2 left-2 md:top-4 md:left-4 flex flex-col gap-2 z-10">
              <Card className="bg-background/95 backdrop-blur-sm border-2 border-primary/20 shadow-lg">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="text-lg font-bold text-primary">{stats.total}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-background/95 backdrop-blur-sm border-2 border-blue-500/20 shadow-lg">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Digitales</p>
                      <p className="text-lg font-bold text-blue-500">{stats.digital}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-background/95 backdrop-blur-sm border-2 border-green-500/20 shadow-lg">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Fijas</p>
                      <p className="text-lg font-bold text-green-500">{stats.fijo}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-background/95 backdrop-blur-sm border-2 border-purple-500/20 shadow-lg">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <Camera className="h-4 w-4 text-purple-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Con IA</p>
                      <p className="text-lg font-bold text-purple-500">{stats.withCV}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Legend */}
            <div className="absolute bottom-2 right-2 md:bottom-4 md:right-4 bg-background/95 backdrop-blur-sm rounded-lg p-2 md:p-3 shadow-lg border text-xs md:text-sm">
              <h4 className="font-medium mb-2">Leyenda</h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#3b82f6' }}></div>
                  <span>Disponible</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ef4444' }}></div>
                  <span>No disponible</span>
                </div>
                {isDrawingMode && (
                  <div className="mt-2 pt-2 border-t">
                    <p className="text-yellow-600 dark:text-yellow-400 font-medium">
                      🖊️ Modo dibujo activo
                    </p>
                    <p className="text-muted-foreground mt-1">
                      Haz clic en el mapa para crear una zona
                    </p>
                  </div>
                )}
                {billboardsInZone.length > 0 && (
                  <div className="mt-2 pt-2 border-t">
                    <p className="font-medium text-primary">
                      📍 {billboardsInZone.length} pantallas en zona
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
                    src={`https://static.wixstatic.com/media/3aa6d8_ec45742e0c7642e29fff05d6e9636202~mv2.png/v1/fill/w_980,h_651,al_c,q_90,usm_0.66_1.00_0.01,enc_avif,quality_auto/Espectacular%202.png`}
                    alt={selectedBillboard.nombre}
                    className="w-full h-48 object-cover"
                  />
                </div>

                {selectedBillboard.has_computer_vision && selectedBillboard.last_detection_count && selectedBillboard.last_detection_count > 0 && (
                  <Card className="bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-3">
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
                    </CardContent>
                  </Card>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Tipo</p>
                    <p className="font-medium">{selectedBillboard.tipo}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Precio Mensual</p>
                    <p className="font-medium">{formatPrice(selectedBillboard.precio?.mensual || 0)}</p>
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
                        `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${selectedBillboard.lat},${selectedBillboard.lng}`,
                        '_blank'
                      );
                    }}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Ver en Street View
                  </Button>
                  <Button
                    className="flex-1"
                    disabled={selectedBillboard.status !== 'disponible'}
                    variant={selectedBillboard.status !== 'disponible' ? 'secondary' : 'default'}
                    onClick={() => {
                      // Convert MapBillboard to InventoryAsset format
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
                      
                      onAddToCart(asset, 'mensual', { 
                        meses: 1
                      });
                      setIsPanelOpen(false);
                    }}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {selectedBillboard.status !== 'disponible' ? 'No disponible' : 'Agregar al Carrito'}
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
