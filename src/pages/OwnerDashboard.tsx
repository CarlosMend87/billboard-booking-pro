import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Filter, Edit2, Trash2, Camera, MapPin, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { useBillboards, Billboard } from "@/hooks/useBillboards";
import { BillboardForm } from "@/components/owner/BillboardForm";
import { FinancialSummary } from "@/components/owner/FinancialSummary";
import { PerformanceChart } from "@/components/owner/PerformanceChart";
import { AlertsPanel } from "@/components/owner/AlertsPanel";
import { QuickStatusChange } from "@/components/owner/QuickStatusChange";
import { BillboardMap } from "@/components/owner/BillboardMap";
import { ExportReports } from "@/components/owner/ExportReports";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { AgentesVentaManager } from "@/components/owner/AgentesVentaManager";
import { CodigosDescuentoManager } from "@/components/owner/CodigosDescuentoManager";
import { AnunciantesManager } from "@/components/owner/AnunciantesManager";
import { ReporteDescuentos } from "@/components/owner/ReporteDescuentos";
import { useAuth } from "@/hooks/useAuth";
import { BulkBillboardUpload } from "@/components/owner/BulkBillboardUpload";
import Papa from "papaparse";

export default function OwnerDashboard() {
  const { billboards, loading, deleteBillboard, deleteAllBillboards, updateBillboard, fetchBillboards } = useBillboards();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [frameCategoryFilter, setFrameCategoryFilter] = useState<string>("all");
  const [selectedBillboard, setSelectedBillboard] = useState<Billboard | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Obtener tipos únicos de los billboards
  const uniqueTypes = Array.from(new Set(billboards.map(b => b.tipo.toLowerCase()))).sort();
  
  // Obtener frame categories únicas de los billboards
  const getFrameCategory = (billboard: Billboard): string => {
    const metadata = billboard.metadata as any;
    return metadata?.frame_category || (billboard.digital ? 'digital' : 'static');
  };
  
  const capitalizeFirstLetter = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const filteredBillboards = billboards.filter(billboard => {
    const matchesSearch = billboard.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         billboard.direccion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || billboard.status === statusFilter;
    const matchesType = typeFilter === "all" || billboard.tipo.toLowerCase() === typeFilter.toLowerCase();
    const matchesFrameCategory = frameCategoryFilter === "all" || getFrameCategory(billboard) === frameCategoryFilter;
    
    return matchesSearch && matchesStatus && matchesType && matchesFrameCategory;
  });

  // Paginación
  const totalPages = Math.ceil(filteredBillboards.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBillboards = filteredBillboards.slice(startIndex, endIndex);

  // Reset a página 1 cuando cambien los filtros
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  const statusStats = {
    total: billboards.length,
    disponible: billboards.filter(b => b.status === 'disponible').length,
    ocupada: billboards.filter(b => b.status === 'ocupada').length,
    mantenimiento: billboards.filter(b => b.status === 'mantenimiento').length,
  };

  const handleEdit = (billboard: Billboard) => {
    setSelectedBillboard(billboard);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteBillboard(id);
  };

  const handleDeleteAll = async () => {
    await deleteAllBillboards();
  };

  const formatPrice = (precio: any) => {
    if (precio.mensual) return `$${precio.mensual.toLocaleString()}/mes`;
    if (precio.spot) return `$${precio.spot}/spot`;
    if (precio.hora) return `$${precio.hora}/hora`;
    if (precio.dia) return `$${precio.dia}/día`;
    return "Precio no definido";
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Dashboard Propietario
              </h1>
              <p className="text-muted-foreground mt-2">
                Gestiona tus pantallas publicitarias y monitorea su rendimiento financiero
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link to="/owner-reservations" className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Ver Reservas
                </Link>
              </Button>
              
              <BulkBillboardUpload 
                ownerId={user?.id || ""} 
                onSuccess={fetchBillboards}
                onNewBillboard={() => {
                  setSelectedBillboard(null);
                  setIsFormOpen(true);
                }}
              />
              
              <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {selectedBillboard ? 'Editar Pantalla' : 'Nueva Pantalla'}
                    </DialogTitle>
                  </DialogHeader>
                  <BillboardForm 
                    billboard={selectedBillboard} 
                    onClose={() => {
                      setIsFormOpen(false);
                      setSelectedBillboard(null);
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Resumen Financiero */}
          <FinancialSummary billboards={billboards} />

          {/* Alertas */}
          <AlertsPanel billboards={billboards} />
        </div>

        <Tabs defaultValue="resumen" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="resumen">Resumen</TabsTrigger>
            <TabsTrigger value="financiero">Financiero</TabsTrigger>
            <TabsTrigger value="agentes">Agentes</TabsTrigger>
            <TabsTrigger value="descuentos">Descuentos</TabsTrigger>
            <TabsTrigger value="mapa">Mapa</TabsTrigger>
            <TabsTrigger value="reportes">Reportes</TabsTrigger>
          </TabsList>

          <TabsContent value="resumen" className="space-y-6">{/* ... keep existing code (stats cards section) */}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Pantallas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statusStats.total}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Disponibles</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{statusStats.disponible}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ocupadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{statusStats.ocupada}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Mantenimiento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{statusStats.mantenimiento}</div>
                </CardContent>
              </Card>
            </div>

            {/* Filters and Actions */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                  <Button 
                    variant="outline"
                    disabled={billboards.length === 0}
                    className="gap-2"
                    onClick={() => {
                      // Generar CSV con el mismo formato de la plantilla
                      const rows = billboards.map(billboard => {
                        const isDigital = billboard.tipo.toLowerCase().includes('digital');
                        const metadata = billboard.metadata as any || {};
                        const medidas = billboard.medidas as any || {};
                        const digital = billboard.digital as any || {};
                        const precio = billboard.precio as any || {};
                        
                        // Mapear status a DISPO
                        const statusMap: { [key: string]: string } = {
                          'disponible': 'Disponible',
                          'ocupada': 'Ocupada',
                          'mantenimiento': 'Mantenimiento',
                          'reservada': 'Reservada'
                        };
                        
                        return {
                          "Frame_ID": metadata.frame_id || billboard.nombre.split(' - ')[0] || '',
                          "Venue type": capitalizeFirstLetter(billboard.tipo),
                          "Address": billboard.direccion,
                          "Number": metadata.numero || '',
                          "Floor": metadata.piso || '',
                          "District": metadata.distrito || '',
                          "City": metadata.ciudad || '',
                          "State": metadata.estado || '',
                          "Country": metadata.pais || '',
                          "Zipcode": metadata.codigo_postal || '',
                          "": '', // Columna vacía entre Zipcode y Latitude
                          "Latitude": billboard.lat,
                          "Longitude": billboard.lng,
                          "Frame_Category": isDigital ? 'digital' : 'static',
                          "Indoor_Outdoor": metadata.interior_exterior || '',
                          "Frame_Format": metadata.formato_marco || '',
                          "Width (m)": medidas.ancho || '',
                          "Height (m)": medidas.alto || '',
                          "Visual Area (m²)": medidas.area_visual || '',
                          "Monitor (inches)": digital.pulgadas_monitor || '',
                          "max_time_secs": digital.tiempo_max_seg || '',
                          "min_time_secs": digital.tiempo_min_seg || '',
                          "allow_video": digital.permite_video ? 'yes' : '',
                          "Slots quantity": digital.cantidad_slots || '',
                          "dimension_pixel": digital.dimension_pixel || '',
                          "Backlighted?": metadata.retroiluminado ? 'yes' : '',
                          "public price ó rate card": precio.mensual || 0,
                          "DISPO": statusMap[billboard.status] || capitalizeFirstLetter(billboard.status)
                        };
                      });
                      
                      // Usar Papa.unparse para generar el CSV correctamente
                      const csv = Papa.unparse(rows);
                      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                      const link = document.createElement('a');
                      const url = URL.createObjectURL(blob);
                      link.setAttribute('href', url);
                      link.setAttribute('download', `inventario-completo-${new Date().toISOString().split('T')[0]}.csv`);
                      link.style.visibility = 'hidden';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                  >
                    <Download className="h-4 w-4" />
                    Descargar Inventario Completo
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        disabled={billboards.length === 0}
                        className="w-full md:w-auto"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar Todo el Inventario
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar todo el inventario?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Se eliminarán permanentemente todas las {billboards.length} pantallas de tu inventario.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleDeleteAll}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Sí, eliminar todo
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Buscar por nombre o dirección..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          handleFilterChange();
                        }}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <Select value={statusFilter} onValueChange={(value) => {
                    setStatusFilter(value);
                    handleFilterChange();
                  }}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Filtrar por estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      <SelectItem value="disponible">Disponible</SelectItem>
                      <SelectItem value="ocupada">Ocupada</SelectItem>
                      <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={typeFilter} onValueChange={(value) => {
                    setTypeFilter(value);
                    handleFilterChange();
                  }}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Filtrar por tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los tipos</SelectItem>
                      {uniqueTypes.map(type => (
                        <SelectItem key={type} value={type}>
                          {capitalizeFirstLetter(type)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={frameCategoryFilter} onValueChange={(value) => {
                    setFrameCategoryFilter(value);
                    handleFilterChange();
                  }}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las categorías</SelectItem>
                      <SelectItem value="digital">Digital (Spots)</SelectItem>
                      <SelectItem value="static">Tradicional (Estática)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Controles de paginación */}
            {filteredBillboards.length > 0 && (
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Mostrando {startIndex + 1} - {Math.min(endIndex, filteredBillboards.length)} de {filteredBillboards.length} pantallas
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Por página:</span>
                        <Select 
                          value={itemsPerPage.toString()} 
                          onValueChange={(value) => {
                            setItemsPerPage(Number(value));
                            setCurrentPage(1);
                          }}
                        >
                          <SelectTrigger className="w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                            <SelectItem value="200">200</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        
                        <span className="text-sm">
                          Página {currentPage} de {totalPages}
                        </span>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Billboards Grid con edición rápida */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedBillboards.map((billboard) => (
                  <Card key={billboard.id} className="overflow-hidden">
                    <div className="aspect-video bg-muted relative">
                      {billboard.fotos && billboard.fotos.length > 0 ? (
                        <img 
                          src={billboard.fotos[0]} 
                          alt={billboard.nombre}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Camera className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                      
                      <div className="absolute top-2 right-2 flex gap-2">
                        {billboard.has_computer_vision && (
                          <Badge className="bg-blue-600 text-white">
                            <Camera className="h-3 w-3 mr-1" />
                            IA Activa
                          </Badge>
                        )}
                        <StatusBadge 
                          variant={
                            billboard.status === 'disponible' ? 'available' :
                            billboard.status === 'ocupada' ? 'occupied' : 'reserved'
                          }
                        >
                          {billboard.status === 'disponible' ? 'Disponible' :
                           billboard.status === 'ocupada' ? 'Ocupada' : 'Mantenimiento'}
                        </StatusBadge>
                      </div>
                    </div>
                    
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-lg line-clamp-1">{billboard.nombre}</h3>
                        <div className="flex gap-1 ml-2">
                          <Badge 
                            variant={getFrameCategory(billboard) === 'digital' ? 'default' : 'secondary'}
                            className={getFrameCategory(billboard) === 'digital' ? 'bg-blue-600 text-white' : 'bg-amber-100 text-amber-800'}
                          >
                            {getFrameCategory(billboard) === 'digital' ? 'Digital' : 'Estática'}
                          </Badge>
                          <Badge variant="outline">
                            {billboard.tipo}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center text-sm text-muted-foreground mb-3">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span className="line-clamp-1">{billboard.direccion}</span>
                      </div>
                      
                      <div className="text-lg font-bold text-primary mb-4">
                        {formatPrice(billboard.precio)}
                      </div>

                      {/* Edición rápida de estatus */}
                      <div className="mb-4">
                        <label className="text-sm font-medium">Estado:</label>
                        <QuickStatusChange billboard={billboard} updateBillboard={updateBillboard} />
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(billboard)}
                          className="flex-1"
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar pantalla?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Se eliminará permanentemente la pantalla "{billboard.nombre}".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDelete(billboard.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Controles de paginación inferior */}
            {filteredBillboards.length > 0 && totalPages > 1 && (
              <Card className="mt-6">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Anterior
                    </Button>
                    
                    <span className="text-sm px-4">
                      Página {currentPage} de {totalPages}
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {filteredBillboards.length === 0 && !loading && (
              <Card className="p-12 text-center">
                <div className="text-muted-foreground">
                  <Camera className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No se encontraron pantallas</h3>
                  <p>Intenta ajustar los filtros o crea tu primera pantalla.</p>
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="financiero" className="space-y-6">
            <PerformanceChart billboards={billboards} />
          </TabsContent>

          <TabsContent value="agentes" className="space-y-6">
            {user && <AgentesVentaManager ownerId={user.id} />}
          </TabsContent>

          <TabsContent value="descuentos" className="space-y-6">
            {user && (
              <>
                <AnunciantesManager />
                <CodigosDescuentoManager />
                <ReporteDescuentos />
              </>
            )}
          </TabsContent>

          <TabsContent value="mapa" className="space-y-6">
            <BillboardMap billboards={billboards} />
          </TabsContent>

          <TabsContent value="reportes" className="space-y-6">
            <ExportReports billboards={billboards} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}