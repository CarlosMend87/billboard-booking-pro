import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Edit, Trash2, MapPin } from "lucide-react";
import { Billboard } from "@/hooks/useBillboards";

interface BillboardSummaryProps {
  billboards: Billboard[];
  onEditBillboard: (billboard: Billboard) => void;
  onDeleteBillboard: (billboardId: string) => void;
  onUpdateStatus: (billboardId: string, status: string) => void;
  loading?: boolean;
}

export function BillboardSummary({
  billboards,
  onEditBillboard,
  onDeleteBillboard,
  onUpdateStatus,
  loading
}: BillboardSummaryProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'disponible':
        return 'default';
      case 'ocupada':
        return 'destructive';
      case 'mantenimiento':
        return 'secondary';
      case 'alta_demanda':
        return 'default';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'disponible':
        return 'Disponible';
      case 'ocupada':
        return 'Ocupada';
      case 'mantenimiento':
        return 'Mantenimiento';
      case 'alta_demanda':
        return 'Alta Demanda';
      default:
        return status;
    }
  };

  const formatPrice = (precio: any) => {
    if (typeof precio === 'object' && precio !== null) {
      return `$${precio.diario || precio.mensual || 0}`;
    }
    return `$${precio || 0}`;
  };

  const handleDelete = async (billboardId: string) => {
    setDeletingId(billboardId);
    await onDeleteBillboard(billboardId);
    setDeletingId(null);
  };

  const handleStatusUpdate = async (billboardId: string, newStatus: string) => {
    await onUpdateStatus(billboardId, newStatus);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Pantallas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{billboards.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {billboards.filter(b => b.status === 'disponible').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ocupadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {billboards.filter(b => b.status === 'ocupada').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Alta Demanda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {billboards.filter(b => b.status === 'alta_demanda').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Billboards Table */}
      <Card>
        <CardHeader>
          <CardTitle>Gestión Rápida de Pantallas</CardTitle>
        </CardHeader>
        <CardContent>
          {billboards.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tienes pantallas registradas aún. ¡Agrega tu primera pantalla!
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billboards.map((billboard) => (
                  <TableRow key={billboard.id}>
                    <TableCell className="font-medium">{billboard.nombre}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{billboard.direccion}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{billboard.tipo}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusVariant(billboard.status)}>
                          {getStatusLabel(billboard.status)}
                        </Badge>
                        <Select
                          value={billboard.status}
                          onValueChange={(value) => handleStatusUpdate(billboard.id, value)}
                        >
                          <SelectTrigger className="w-auto h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="disponible">Disponible</SelectItem>
                            <SelectItem value="ocupada">Ocupada</SelectItem>
                            <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                            <SelectItem value="alta_demanda">Alta Demanda</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                    <TableCell>{formatPrice(billboard.precio)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditBillboard(billboard)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar pantalla?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. La pantalla "{billboard.nombre}" 
                                será eliminada permanentemente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(billboard.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                disabled={deletingId === billboard.id}
                              >
                                {deletingId === billboard.id ? "Eliminando..." : "Eliminar"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}