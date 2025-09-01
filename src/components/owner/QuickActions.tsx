import { useState } from "react";
import { Billboard } from "@/hooks/useBillboards";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Search, 
  MapPin, 
  Edit2, 
  MoreHorizontal,
  Eye,
  AlertCircle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface QuickActionsProps {
  billboards: Billboard[];
  onEditBillboard: (billboard: Billboard) => void;
  onViewOnMap: (billboard: Billboard) => void;
  onUpdateStatus: (billboardId: string, status: string) => void;
}

export function QuickActions({ 
  billboards, 
  onEditBillboard, 
  onViewOnMap, 
  onUpdateStatus 
}: QuickActionsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [demandFilter, setDemandFilter] = useState<string>("all");

  const formatPrice = (precio: any): string => {
    if (precio?.mensual) return `$${precio.mensual.toLocaleString()}/mes`;
    if (precio?.spot) return `$${precio.spot}/spot`;
    if (precio?.hora) return `$${precio.hora}/hora`;
    if (precio?.dia) return `$${precio.dia}/día`;
    return "No definido";
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'disponible':
        return 'available';
      case 'ocupada':
        return 'occupied';
      case 'mantenimiento':
        return 'reserved';
      default:
        return 'available';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'disponible':
        return 'Disponible';
      case 'ocupada':
        return 'Ocupada';
      case 'mantenimiento':
        return 'Mantenimiento';
      default:
        return status;
    }
  };

  // Simular nivel de demanda basado en estado
  const getDemandLevel = (billboard: Billboard): string => {
    if (billboard.status === 'ocupada') return 'alta';
    return Math.random() > 0.7 ? 'alta' : Math.random() > 0.4 ? 'media' : 'baja';
  };

  const getDemandBadge = (level: string) => {
    switch (level) {
      case 'alta':
        return <Badge className="bg-red-100 text-red-800 border-red-300">Alta Demanda</Badge>;
      case 'media':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Demanda Media</Badge>;
      case 'baja':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-300">Baja Demanda</Badge>;
      default:
        return null;
    }
  };

  // Extraer ciudades únicas de las direcciones
  const cities = Array.from(new Set(
    billboards.map(b => b.direccion.split(',').pop()?.trim()).filter(Boolean)
  ));

  const filteredBillboards = billboards.filter(billboard => {
    const matchesSearch = billboard.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         billboard.direccion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || billboard.status === statusFilter;
    const matchesType = typeFilter === "all" || billboard.tipo === typeFilter;
    
    const billboardCity = billboard.direccion.split(',').pop()?.trim();
    const matchesCity = cityFilter === "all" || billboardCity === cityFilter;
    
    const demandLevel = getDemandLevel(billboard);
    const matchesDemand = demandFilter === "all" || demandLevel === demandFilter;
    
    return matchesSearch && matchesStatus && matchesType && matchesCity && matchesDemand;
  });

  const handleStatusChange = async (billboardId: string, newStatus: string) => {
    await onUpdateStatus(billboardId, newStatus);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Gestión Rápida de Pantallas
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por nombre o ubicación..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full lg:w-48">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="disponible">Disponible</SelectItem>
              <SelectItem value="ocupada">Ocupada</SelectItem>
              <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full lg:w-48">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="digital">Digital</SelectItem>
              <SelectItem value="espectacular">Espectacular</SelectItem>
              <SelectItem value="muro">Muro</SelectItem>
              <SelectItem value="valla">Valla</SelectItem>
              <SelectItem value="parabus">Parabús</SelectItem>
            </SelectContent>
          </Select>

          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="w-full lg:w-48">
              <SelectValue placeholder="Ciudad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las ciudades</SelectItem>
              {cities.map(city => (
                <SelectItem key={city} value={city || ''}>{city}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={demandFilter} onValueChange={setDemandFilter}>
            <SelectTrigger className="w-full lg:w-48">
              <SelectValue placeholder="Demanda" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toda demanda</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
              <SelectItem value="media">Media</SelectItem>
              <SelectItem value="baja">Baja</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabla de pantallas */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Demanda</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBillboards.map((billboard) => {
                const demandLevel = getDemandLevel(billboard);
                
                return (
                  <TableRow key={billboard.id}>
                    <TableCell className="font-medium">
                      {billboard.nombre}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate max-w-[200px]">{billboard.direccion}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{billboard.tipo}</Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={billboard.status}
                        onValueChange={(value) => handleStatusChange(billboard.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <StatusBadge variant={getStatusVariant(billboard.status)}>
                            {getStatusLabel(billboard.status)}
                          </StatusBadge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="disponible">Disponible</SelectItem>
                          <SelectItem value="ocupada">Ocupada</SelectItem>
                          <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {getDemandBadge(demandLevel)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatPrice(billboard.precio)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEditBillboard(billboard)}>
                            <Edit2 className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onViewOnMap(billboard)}>
                            <MapPin className="h-4 w-4 mr-2" />
                            Ver en Mapa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {filteredBillboards.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>No se encontraron pantallas con los filtros aplicados</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}