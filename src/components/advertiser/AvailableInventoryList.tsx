import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MapPin, 
  Calendar, 
  DollarSign, 
  Monitor, 
  Building, 
  Search,
  Eye,
  ShoppingCart
} from "lucide-react";
import { InventoryFilters } from "@/pages/DisponibilidadAnuncios";
import { mockInventoryAssets, InventoryAsset } from "@/lib/mockInventory";
import { formatPrice, esElegibleRotativo } from "@/lib/pricing";
import { formatShortId } from "@/lib/utils";
import { CartItemModalidad, CartItemConfig } from "@/types/cart";
import { supabase } from "@/integrations/supabase/client";

interface AvailableInventoryListProps {
  filters: InventoryFilters;
  onAddToCart: (asset: InventoryAsset, modalidad: CartItemModalidad, config: CartItemConfig, quantity?: number) => void;
}

// Mock available dates for demonstration
const getRandomAvailableDates = () => {
  const dates = [];
  const currentDate = new Date();
  for (let i = 1; i <= 28; i++) {
    if (Math.random() > 0.3) { // 70% chance of being available
      dates.push(i);
    }
  }
  return dates;
};

// Convert Supabase billboard to InventoryAsset format
const convertBillboardToAsset = (billboard: any): InventoryAsset => {
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
      rotativo: billboard.contratacion?.rotativo || false,
      spot: billboard.contratacion?.spot || false,
      hora: billboard.contratacion?.hora || false,
      dia: billboard.contratacion?.dia || false,
      cpm: billboard.contratacion?.cpm || false
    },
    estado: billboard.status === 'disponible' ? 'disponible' : 'ocupado',
    propietario: `Propietario ${billboard.owner_id.slice(0, 8)}`, // Simplified owner display
    foto: billboard.fotos?.[0] || `https://picsum.photos/seed/${billboard.id}/800/450`
  };
};

export function AvailableInventoryList({ filters, onAddToCart }: AvailableInventoryListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModalidad, setSelectedModalidad] = useState<{[key: string]: CartItemModalidad}>({});
  const [ownerBillboards, setOwnerBillboards] = useState<InventoryAsset[]>([]);

  // Fetch available billboards from owners
  useEffect(() => {
    const fetchOwnerBillboards = async () => {
      try {
        const { data: billboards, error } = await supabase
          .from('billboards')
          .select('*')
          .eq('status', 'disponible'); // Only available billboards

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

  // Filter available assets based on filters
  const availableAssets = useMemo(() => {
    // Combine mock inventory with owner billboards
    const allAssets = [...mockInventoryAssets, ...ownerBillboards];
    
    return allAssets.filter(asset => {
      // Only show available assets
      if (asset.estado !== "disponible") return false;

      // Filter by location search
      if (searchTerm && !asset.nombre.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Owner filter removed - now shows all inventory from all owners

      return true;
    });
  }, [searchTerm, filters, ownerBillboards]);

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
    if (asset.contratacion.rotativo && esElegibleRotativo({ estadoPeriodo: 'vacante', diasParaInicio: 3 })) {
      options.push('rotativo');
    }
    if (asset.contratacion.spot) options.push('spot');
    if (asset.contratacion.hora) options.push('hora');
    if (asset.contratacion.dia) options.push('dia');
    if (asset.contratacion.cpm) options.push('cpm');
    
    return options;
  };

  const getModalidadLabel = (modalidad: CartItemModalidad) => {
    const labels = {
      'mensual': 'Mensual',
      'catorcenal': 'Catorcenal', 
      'rotativo': 'Rotativo (-50%)',
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
      case 'rotativo':
        return formatPrice(((asset.precio.mensual || 0) / 2) * 0.5);
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

  const handleAddToCart = (asset: InventoryAsset) => {
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Inventario Disponible
            </CardTitle>
            <Badge variant="secondary">
              {availableAssets.length} anuncios disponibles
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por ubicación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {availableAssets.map((asset) => {
          const availableDates = getRandomAvailableDates();
          const typeLabel = getTipoLabel(asset.tipo);
          const modalidadOptions = getModalidadOptions(asset);
          const currentModalidad = selectedModalidad[asset.id] || modalidadOptions[0];
          
          return (
            <Card key={asset.id} className="hover:shadow-medium transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {asset.tipo === 'digital' ? <Monitor className="h-3 w-3 mr-1" /> : <Building className="h-3 w-3 mr-1" />}
                        {typeLabel}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        ID: {formatShortId(asset.id)}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-lg">{asset.nombre}</h3>
                    {asset.propietario && (
                      <p className="text-sm text-muted-foreground">{asset.propietario}</p>
                    )}
                  </div>
                  <Badge className="bg-status-confirmed text-white">
                    Disponible
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">Dimensiones:</span>
                    </div>
                    <p className="text-muted-foreground ml-4">
                      {asset.medidas.ancho_m || asset.medidas.base_m}m × {asset.medidas.alto_m}m
                      {asset.medidas.caras > 1 && ` (${asset.medidas.caras} caras)`}
                    </p>
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

                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium text-sm">Precio:</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-lg font-semibold text-primary">
                      {getCurrentPrice(asset, currentModalidad)}
                      {currentModalidad === 'rotativo' && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          ¡Oportunidad -50%!
                        </Badge>
                      )}
                    </p>
                  </div>
                </div>

                {asset.tipo !== 'digital' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium text-sm">Días disponibles este mes:</span>
                    </div>
                    <div className="ml-4 flex flex-wrap gap-1">
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
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="h-4 w-4 mr-1" />
                    Ver Detalles
                  </Button>
                  <Button size="sm" className="flex-1" onClick={() => handleAddToCart(asset)}>
                    <ShoppingCart className="h-4 w-4 mr-1" />
                    Agregar
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {availableAssets.length === 0 && (
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
    </div>
  );
}