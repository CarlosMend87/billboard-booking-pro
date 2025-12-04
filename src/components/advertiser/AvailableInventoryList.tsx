import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  MapPin, 
  Calendar, 
  DollarSign, 
  Monitor, 
  Building, 
  Search,
  Eye,
  ShoppingCart,
  Camera,
  Users,
  Activity,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2
} from "lucide-react";
import { InventoryFilters } from "@/types/inventory";
import { mockInventoryAssets, InventoryAsset } from "@/lib/mockInventory";
import { formatPrice, esElegibleRotativo } from "@/lib/pricing";
import { formatShortId } from "@/lib/utils";
import { CartItemModalidad, CartItemConfig } from "@/types/cart";
import { supabase } from "@/integrations/supabase/client";
import admobilizeImage from "@/assets/admobilize-detection.png";
import { BillboardViewsMetric } from "@/components/advertiser/BillboardViewsMetric";
import { useBillboardLock } from "@/hooks/useBillboardLock";

// Helper function for formatting distance
const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(2)}km`;
};

const ITEMS_PER_PAGE = 10;

interface AvailableInventoryListProps {
  filters: InventoryFilters;
  onAddToCart: (asset: InventoryAsset, modalidad: CartItemModalidad, config: CartItemConfig, quantity?: number) => void;
}

// Get available dates based on reservations
const getAvailabilityInfo = (assetId: string, reservations: any[]): { availableDates: number[]; nextFreeDate: string | null } => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  // Get reservations for this asset
  const assetReservations = reservations.filter(r => 
    r.asset_name === assetId || r.billboard_id === assetId
  );
  
  // Calculate available dates for current month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const availableDates: number[] = [];
  let nextFreeDate: string | null = null;
  
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isOccupied = assetReservations.some(r => {
      const start = new Date(r.fecha_inicio);
      const end = new Date(r.fecha_fin);
      const checkDate = new Date(dateStr);
      return checkDate >= start && checkDate <= end && r.status === 'accepted';
    });
    
    if (!isOccupied && new Date(dateStr) >= currentDate) {
      availableDates.push(day);
    }
  }
  
  // Find next free date if asset is currently occupied
  const latestReservation = assetReservations
    .filter(r => r.status === 'accepted')
    .sort((a, b) => new Date(b.fecha_fin).getTime() - new Date(a.fecha_fin).getTime())[0];
  
  if (latestReservation) {
    const endDate = new Date(latestReservation.fecha_fin);
    endDate.setDate(endDate.getDate() + 1);
    nextFreeDate = endDate.toISOString().split('T')[0];
  }
  
  return { availableDates, nextFreeDate };
};

// Convert Supabase billboard to InventoryAsset format
const convertBillboardToAsset = (billboard: any): InventoryAsset & { 
  has_computer_vision?: boolean; 
  last_detection_count?: number;
  last_detection_date?: string;
  digital?: { ancho_px?: number; alto_px?: number };
} => {
  return {
    id: billboard.id,
    nombre: billboard.nombre,
    tipo: billboard.tipo,
    lat: parseFloat(billboard.lat) || 0,
    lng: parseFloat(billboard.lng) || 0,
    medidas: {
      ancho_m: billboard.medidas?.ancho_m || 0,
      alto_m: billboard.medidas?.alto_m || 0,
      base_m: billboard.medidas?.base_m || 0,
      caras: billboard.medidas?.caras || 1
    },
    precio: {
      mensual: billboard.precio?.mensual || 0,
      dia: billboard.precio?.dia || 0,
      hora: billboard.precio?.hora || 0,
      spot: billboard.precio?.spot || 0,
      cpm: billboard.precio?.cpm || 0
    },
    contratacion: {
      mensual: billboard.contratacion?.mensual || false,
      catorcenal: billboard.contratacion?.catorcenal || false,
      semanal: billboard.contratacion?.semanal || false,
      spot: billboard.contratacion?.spot || false,
      hora: billboard.contratacion?.hora || false,
      dia: billboard.contratacion?.dia || false,
      cpm: billboard.contratacion?.cpm || false
    },
    estado: billboard.status === 'disponible' ? 'disponible' : 'ocupado',
    propietario: `Propietario ${billboard.owner_id.slice(0, 8)}`, // Simplified owner display
    foto: billboard.fotos?.[0] || `https://picsum.photos/seed/${billboard.id}/800/450`,
    has_computer_vision: billboard.has_computer_vision || false,
    last_detection_count: billboard.last_detection_count || 0,
    last_detection_date: billboard.last_detection_date,
    digital: billboard.digital || null
  };
};

export function AvailableInventoryList({ filters, onAddToCart }: AvailableInventoryListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModalidad, setSelectedModalidad] = useState<{[key: string]: CartItemModalidad}>({});
  const [ownerBillboards, setOwnerBillboards] = useState<InventoryAsset[]>([]);
  const [selectedAssetForDetails, setSelectedAssetForDetails] = useState<(InventoryAsset & { has_computer_vision?: boolean; last_detection_count?: number }) | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { createLock, isLocked, loading: lockLoading } = useBillboardLock();

  // Fetch all billboards from owners (including occupied ones)
  useEffect(() => {
    const fetchOwnerBillboards = async () => {
      try {
        const { data: billboards, error } = await supabase
          .from('billboards')
          .select('*'); // Fetch all billboards

        if (error) {
          console.error('Error fetching billboards:', error);
          return;
        }

        const convertedBillboards = billboards?.map(convertBillboardToAsset) || [];
        setOwnerBillboards(convertedBillboards);
      } catch (error) {
        console.error('Error fetching owner billboards:', error);
      }
    };

    fetchOwnerBillboards();
  }, []);

  // Fetch reservations for availability info
  const [reservations, setReservations] = useState<any[]>([]);
  useEffect(() => {
    const fetchReservations = async () => {
      const { data } = await supabase
        .from('reservas')
        .select('*')
        .in('status', ['accepted', 'pending']);
      setReservations(data || []);
    };
    fetchReservations();
  }, []);

  // State for async filtered assets
  const [asyncFilteredAssets, setAsyncFilteredAssets] = useState<InventoryAsset[]>([]);
  const [isFiltering, setIsFiltering] = useState(false);

  // Filter and sort available assets based on filters
  useEffect(() => {
    const filterAssets = async () => {
      setIsFiltering(true);
      
      // Combine mock inventory with owner billboards
      const allAssets = [...mockInventoryAssets, ...ownerBillboards];
      
      // Apply synchronous filters first
      let filtered = allAssets.filter(asset => {
        // Show both available and occupied assets (ocupado shown as not reservable)

        // Filter by location search
        if (searchTerm && !asset.nombre.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }

        // Filter by billboard type
        if (filters.advancedFilters.billboardTypes.length > 0) {
          if (!filters.advancedFilters.billboardTypes.includes(asset.tipo)) {
            return false;
          }
        }

        // Filter by modalidades
        if (filters.advancedFilters.modalidades.length > 0) {
          const hasModalidad = filters.advancedFilters.modalidades.some(modalidad => {
            return asset.contratacion[modalidad as keyof typeof asset.contratacion];
          });
          if (!hasModalidad) return false;
        }

        // Filter by price range (using mensual price as reference)
        const precio = asset.precio.mensual || 0;
        if (precio < filters.advancedFilters.priceRange[0] || precio > filters.advancedFilters.priceRange[1]) {
          return false;
        }

        // Filter by computer vision
        if (filters.advancedFilters.hasComputerVision !== null) {
          const hasCV = (asset as any).has_computer_vision || false;
          if (hasCV !== filters.advancedFilters.hasComputerVision) {
            return false;
          }
        }

        return true;
      });

      // Proximity filters temporarily disabled - will be re-implemented after fixing circular dependencies
      // if (filters.advancedFilters.proximityFilters.length > 0) {
      //   filtered = filtered; // Placeholder
      // }

      // Apply sorting
      filtered.sort((a, b) => {
        switch (filters.sortBy) {
          case "nombre-asc":
            return a.nombre.localeCompare(b.nombre);
          case "nombre-desc":
            return b.nombre.localeCompare(a.nombre);
          case "precio-asc":
            return (a.precio.mensual || 0) - (b.precio.mensual || 0);
          case "precio-desc":
            return (b.precio.mensual || 0) - (a.precio.mensual || 0);
          case "detecciones-desc":
            return ((b as any).last_detection_count || 0) - ((a as any).last_detection_count || 0);
          case "detecciones-asc":
            return ((a as any).last_detection_count || 0) - ((b as any).last_detection_count || 0);
          default:
            return 0;
        }
      });

      setAsyncFilteredAssets(filtered);
      setIsFiltering(false);
    };

    filterAssets();
  }, [searchTerm, filters, ownerBillboards]);

  const { filteredAssets, totalPages } = useMemo(() => {
    const total = Math.ceil(asyncFilteredAssets.length / ITEMS_PER_PAGE);
    
    return {
      filteredAssets: asyncFilteredAssets,
      totalPages: total
    };
  }, [asyncFilteredAssets]);

  // Get current page assets
  const paginatedAssets = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredAssets.slice(startIndex, endIndex);
  }, [filteredAssets, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchTerm]);

  const getTipoLabel = (tipo: string) => {
    const labels = {
      'espectacular': 'Espectacular Fijo',
      'muro': 'Muro',
      'valla': 'Valla',
      'parabus': 'Parabús',
      'digital': 'Espectacular Digital'
    };
    return labels[tipo as keyof typeof labels] || tipo;
  };

  const getModalidadOptions = (asset: InventoryAsset): CartItemModalidad[] => {
    const options: CartItemModalidad[] = [];
    
    if (asset.contratacion.mensual) options.push('mensual');
    if (asset.contratacion.catorcenal) options.push('catorcenal');
    if (asset.contratacion.semanal) options.push('semanal');
    if (asset.contratacion.dia) options.push('dia');
    if (asset.contratacion.hora) options.push('hora');
    if (asset.contratacion.spot) options.push('spot');
    if (asset.contratacion.cpm) options.push('cpm');
    
    return options.length > 0 ? options : ['mensual']; // Default to mensual if no options
  };

  const getModalidadLabel = (modalidad: CartItemModalidad) => {
    const labels = {
      'mensual': 'Mensual',
      'catorcenal': 'Catorcenal', 
      'semanal': 'Semanal',
      'spot': 'Por Spot',
      'hora': 'Por Hora',
      'dia': 'Por Día',
      'cpm': 'CPM'
    };
    return labels[modalidad] || modalidad;
  };

  const getCurrentPrice = (asset: InventoryAsset, modalidad?: CartItemModalidad) => {
    if (!modalidad) return formatPrice(asset.precio.mensual || 0);
    
    switch (modalidad) {
      case 'mensual':
        return formatPrice(asset.precio.mensual || 0);
      case 'catorcenal':
        return formatPrice((asset.precio.mensual || 0) / 2);
      case 'semanal':
        return formatPrice((asset.precio.mensual || 0) / 4);
      case 'spot':
        return formatPrice(asset.precio.spot || 0);
      case 'hora':
        return formatPrice(asset.precio.hora || 0);
      case 'dia':
        return formatPrice(asset.precio.dia || 0);
      case 'cpm':
        return formatPrice(asset.precio.cpm || 0);
      default:
        return formatPrice(asset.precio.mensual || 0);
    }
  };

  const handleAddToCart = async (asset: InventoryAsset) => {
    // Check if billboard is locked first
    const locked = await isLocked(asset.id);
    if (locked) {
      return; // isLocked already shows a toast
    }

    // Create a temporary lock (10 minutes)
    const lockId = await createLock(asset.id);
    if (!lockId) {
      return; // createLock already shows a toast if it fails
    }

    const modalidad = selectedModalidad[asset.id] || getModalidadOptions(asset)[0];
    const config: CartItemConfig = {
      meses: modalidad === 'mensual' ? 1 : undefined,
      catorcenas: modalidad === 'catorcenal' ? 1 : undefined,
      spotsDia: modalidad === 'spot' ? 10 : undefined,
      horas: modalidad === 'hora' ? 8 : undefined,
      dias: modalidad === 'dia' ? 1 : undefined,
      impresiones: modalidad === 'cpm' ? 10000 : undefined,
    };
    
    onAddToCart(asset, modalidad, config, 1);
  };

  const handleDownloadPDF = () => {
    console.log('PDF download feature temporarily disabled');
    // generatePDFReport will be re-implemented after fixing circular dependencies
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Inventario Disponible
              {isFiltering && <Loader2 className="h-4 w-4 animate-spin" />}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPDF}
                disabled={filteredAssets.length === 0 || isFiltering}
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar PDF
              </Button>
              <div className="flex gap-2">
                <Badge variant="secondary" className="bg-status-confirmed/20 text-status-confirmed">
                  {filteredAssets.filter(a => a.estado === 'disponible').length} disponibles
                </Badge>
                <Badge variant="secondary" className="bg-destructive/20 text-destructive">
                  {filteredAssets.filter(a => a.estado !== 'disponible').length} ocupados
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o ubicación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {isFiltering && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p>Buscando puntos de interés cercanos...</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paginatedAssets.map((asset) => {
          const { availableDates, nextFreeDate } = getAvailabilityInfo(asset.id, reservations);
          const typeLabel = getTipoLabel(asset.tipo);
          const modalidadOptions = getModalidadOptions(asset);
          const currentModalidad = selectedModalidad[asset.id] || modalidadOptions[0];
          
          return (
            <Card key={asset.id} className="hover:shadow-medium transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {asset.tipo === 'digital' ? <Monitor className="h-3 w-3 mr-1" /> : <Building className="h-3 w-3 mr-1" />}
                        {typeLabel}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        ID: {formatShortId(asset.id)}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-lg">{asset.nombre}</h3>
                    <p className="text-sm text-muted-foreground">{asset.propietario}</p>
                    
                    {(asset as any).has_computer_vision && (asset as any).last_detection_count > 0 && (
                      <div className="flex items-center gap-2 mt-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded-md">
                        <Camera className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <span className="font-semibold text-blue-600 dark:text-blue-400">
                            {(asset as any).last_detection_count.toLocaleString()}
                          </span>
                          <span className="text-sm text-blue-600 dark:text-blue-400">
                            personas detectadas ayer
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {(asset as any).distance !== undefined && (asset as any).nearestPOI && (
                      <div className="flex items-center gap-2 mt-2 p-2 bg-green-50 dark:bg-green-950/30 rounded-md">
                        <MapPin className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <div className="text-sm text-green-600 dark:text-green-400">
                          <span className="font-semibold">{formatDistance((asset as any).distance)}</span>
                          {' de '}
                          <span>{(asset as any).poiName || (asset as any).nearestPOI}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <Badge className={asset.estado === 'disponible' ? "bg-status-confirmed text-white" : "bg-destructive text-destructive-foreground"}>
                    {asset.estado === 'disponible' ? 'Disponible' : 'Ocupado'}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex gap-4 mb-4">
                  <div className="w-24 h-16 rounded-lg overflow-hidden bg-muted">
                    <img 
                      src={asset.foto} 
                      alt={asset.nombre}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">Dimensiones:</span>
                        </div>
                        <div className="text-muted-foreground ml-4">
                          {asset.tipo === 'digital' && (asset as any).digital?.dimension_pixel ? (
                            <p className="text-primary font-medium">
                              <Monitor className="h-3 w-3 inline mr-1" />
                              {(asset as any).digital.dimension_pixel} px
                            </p>
                          ) : (
                            <p>
                              {asset.medidas.ancho_m || asset.medidas.base_m}m × {asset.medidas.alto_m}m
                              {asset.medidas.caras > 1 && ` (${asset.medidas.caras} caras)`}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">Modalidad:</span>
                        </div>
                        <Select
                          value={currentModalidad}
                          onValueChange={(value: CartItemModalidad) => 
                            setSelectedModalidad(prev => ({ ...prev, [asset.id]: value }))
                          }
                        >
                          <SelectTrigger className="text-xs h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {modalidadOptions.map(modalidad => (
                              <SelectItem key={modalidad} value={modalidad}>
                                {getModalidadLabel(modalidad)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium text-sm">Precio:</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-lg font-semibold text-primary">
                      {getCurrentPrice(asset, currentModalidad)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium text-sm">Disponibilidad:</span>
                  </div>
                  <div className="ml-4">
                    {asset.estado !== 'disponible' && nextFreeDate ? (
                      <div className="p-2 bg-amber-50 dark:bg-amber-950/30 rounded-md">
                        <p className="text-sm text-amber-700 dark:text-amber-400">
                          <span className="font-medium">Se libera:</span>{' '}
                          {new Date(nextFreeDate).toLocaleDateString('es-MX', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {availableDates.slice(0, 10).map(date => (
                          <Badge key={date} variant="outline" className="text-xs">
                            {date}
                          </Badge>
                        ))}
                        {availableDates.length > 10 && (
                          <Badge variant="secondary" className="text-xs">
                            +{availableDates.length - 10} más
                          </Badge>
                        )}
                        {availableDates.length === 0 && (
                          <span className="text-sm text-muted-foreground">Sin disponibilidad este mes</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Métricas de interés - Solo visible para compradores */}
                <div className="pt-2 border-t">
                  <BillboardViewsMetric billboardId={asset.id} />
                </div>

                <div className="flex gap-2 pt-2">
                  {(asset as any).has_computer_vision ? (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => setSelectedAssetForDetails(asset as any)}
                    >
                      <Activity className="h-4 w-4 mr-1" />
                      Ver Impactos
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => setSelectedAssetForDetails(asset as any)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver Detalles
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    className="flex-1" 
                    onClick={() => handleAddToCart(asset)}
                    disabled={lockLoading || asset.estado !== 'disponible'}
                    variant={asset.estado !== 'disponible' ? 'secondary' : 'default'}
                  >
                    <ShoppingCart className="h-4 w-4 mr-1" />
                    {asset.estado !== 'disponible' ? 'No disponible' : lockLoading ? 'Verificando...' : 'Agregar'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredAssets.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No se encontraron anuncios</h3>
            <p className="text-muted-foreground">
              Intenta ajustar los filtros para encontrar más opciones disponibles.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages} ({filteredAssets.length} resultados)
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!selectedAssetForDetails} onOpenChange={(open) => !open && setSelectedAssetForDetails(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-blue-600" />
              Detección de Audiencia - {selectedAssetForDetails?.nombre}
            </DialogTitle>
          </DialogHeader>
          
          {selectedAssetForDetails?.has_computer_vision ? (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-semibold text-blue-600 dark:text-blue-400">
                    {(selectedAssetForDetails.last_detection_count || 17836).toLocaleString()} personas detectadas ayer
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Sistema de Computer Vision con tecnología AdMobilize
                </p>
              </div>
              
              <div className="rounded-lg overflow-hidden border">
                <img 
                  src={admobilizeImage} 
                  alt="AdMobilize Detection"
                  className="w-full h-auto"
                />
              </div>
              
              <p className="text-sm text-muted-foreground text-center">
                Detección y conteo automático de personas en tiempo real
              </p>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Esta pantalla no cuenta con tecnología de Computer Vision
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}