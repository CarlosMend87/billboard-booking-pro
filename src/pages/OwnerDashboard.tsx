import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Plus, Search, Filter, Edit2, Trash2, Camera, MapPin } from "lucide-react";
import { useBillboards, Billboard } from "@/hooks/useBillboards";
import { BillboardForm } from "@/components/owner/BillboardForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function OwnerDashboard() {
  const { billboards, loading, deleteBillboard } = useBillboards();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedBillboard, setSelectedBillboard] = useState<Billboard | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const filteredBillboards = billboards.filter(billboard => {
    const matchesSearch = billboard.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         billboard.direccion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || billboard.status === statusFilter;
    const matchesType = typeFilter === "all" || billboard.tipo === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

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
                Gestiona tus pantallas publicitarias y monitorea su disponibilidad
              </p>
            </div>
            
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2" onClick={() => setSelectedBillboard(null)}>
                  <Plus className="h-4 w-4" />
                  Nueva Pantalla
                </Button>
              </DialogTrigger>
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
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar por nombre o dirección..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
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
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="espectacular">Espectacular</SelectItem>
                  <SelectItem value="muro">Muro</SelectItem>
                  <SelectItem value="valla">Valla</SelectItem>
                  <SelectItem value="parabus">Parabús</SelectItem>
                  <SelectItem value="digital">Digital</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Billboards Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBillboards.map((billboard) => (
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
                  
                  <div className="absolute top-2 right-2">
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
                    <Badge variant="outline" className="ml-2">
                      {billboard.tipo}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center text-sm text-muted-foreground mb-3">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="line-clamp-1">{billboard.direccion}</span>
                  </div>
                  
                  <div className="text-lg font-bold text-primary mb-4">
                    {formatPrice(billboard.precio)}
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

        {filteredBillboards.length === 0 && !loading && (
          <Card className="p-12 text-center">
            <div className="text-muted-foreground">
              <Camera className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No se encontraron pantallas</h3>
              <p>Intenta ajustar los filtros o crea tu primera pantalla.</p>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}