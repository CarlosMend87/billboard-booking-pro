import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Plus, Search, Edit, Trash2, Users, Monitor } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEmpresas, Empresa } from "@/hooks/useEmpresa";

interface EmpresaWithStats extends Empresa {
  userCount: number;
  billboardCount: number;
  users: Array<{ user_id: string; name: string | null; email: string | null; role: string }>;
}

export default function EmpresasManager() {
  const { empresas, loading, refetch, createEmpresa, updateEmpresa, deleteEmpresa, assignUserToEmpresa } = useEmpresas();
  const [empresasWithStats, setEmpresasWithStats] = useState<EmpresaWithStats[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAssignUserDialogOpen, setIsAssignUserDialogOpen] = useState(false);
  const [selectedEmpresa, setSelectedEmpresa] = useState<EmpresaWithStats | null>(null);
  const [newEmpresaNombre, setNewEmpresaNombre] = useState("");
  const [editEmpresaNombre, setEditEmpresaNombre] = useState("");
  const [allUsers, setAllUsers] = useState<Array<{ user_id: string; name: string | null; email: string | null; empresa_id: string | null }>>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    loadEmpresasWithStats();
  }, [empresas]);

  const loadEmpresasWithStats = async () => {
    try {
      // Get user counts per empresa
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, email, role, empresa_id');

      // Get billboard counts per empresa
      const { data: billboards } = await supabase
        .from('billboards')
        .select('id, empresa_id');

      const statsMap = new Map<string, EmpresaWithStats>();

      empresas.forEach(empresa => {
        const users = profiles?.filter(p => p.empresa_id === empresa.id) || [];
        const billboardCount = billboards?.filter(b => b.empresa_id === empresa.id).length || 0;

        statsMap.set(empresa.id, {
          ...empresa,
          userCount: users.length,
          billboardCount,
          users: users.map(u => ({ user_id: u.user_id, name: u.name, email: u.email, role: u.role }))
        });
      });

      setEmpresasWithStats(Array.from(statsMap.values()));
      setAllUsers(profiles || []);
    } catch (error) {
      console.error('Error loading empresas stats:', error);
    }
  };

  const handleCreateEmpresa = async () => {
    if (!newEmpresaNombre.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la empresa es requerido",
        variant: "destructive",
      });
      return;
    }

    try {
      await createEmpresa(newEmpresaNombre.trim());
      toast({
        title: "Empresa creada",
        description: `Empresa "${newEmpresaNombre}" creada exitosamente`,
      });
      setNewEmpresaNombre("");
      setIsCreateDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la empresa",
        variant: "destructive",
      });
    }
  };

  const handleUpdateEmpresa = async () => {
    if (!selectedEmpresa || !editEmpresaNombre.trim()) return;

    try {
      await updateEmpresa(selectedEmpresa.id, editEmpresaNombre.trim());
      toast({
        title: "Empresa actualizada",
        description: `Empresa actualizada exitosamente`,
      });
      setIsEditDialogOpen(false);
      setSelectedEmpresa(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la empresa",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEmpresa = async (empresa: EmpresaWithStats) => {
    try {
      await deleteEmpresa(empresa.id);
      toast({
        title: "Empresa eliminada",
        description: `Empresa "${empresa.nombre}" eliminada exitosamente`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la empresa",
        variant: "destructive",
      });
    }
  };

  const handleAssignUser = async () => {
    if (!selectedEmpresa || !selectedUserId) return;

    try {
      await assignUserToEmpresa(selectedUserId, selectedEmpresa.id);
      toast({
        title: "Usuario asignado",
        description: "Usuario asignado a la empresa exitosamente",
      });
      setIsAssignUserDialogOpen(false);
      setSelectedUserId("");
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo asignar el usuario",
        variant: "destructive",
      });
    }
  };

  const handleRemoveUserFromEmpresa = async (userId: string) => {
    try {
      await assignUserToEmpresa(userId, null);
      toast({
        title: "Usuario removido",
        description: "Usuario removido de la empresa exitosamente",
      });
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo remover el usuario",
        variant: "destructive",
      });
    }
  };

  const filteredEmpresas = empresasWithStats.filter(empresa =>
    empresa.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const unassignedUsers = allUsers.filter(u => !u.empresa_id);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="w-5 h-5" />
                <span>Gestión de Empresas</span>
              </CardTitle>
              <CardDescription>
                Administrar empresas y sus usuarios asociados
              </CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Empresa
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Nueva Empresa</DialogTitle>
                  <DialogDescription>
                    Ingrese el nombre de la nueva empresa
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nombre">Nombre de la Empresa</Label>
                    <Input
                      id="nombre"
                      value={newEmpresaNombre}
                      onChange={(e) => setNewEmpresaNombre(e.target.value)}
                      placeholder="Nombre de la empresa"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateEmpresa}>Crear Empresa</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar empresas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Cargando empresas...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Usuarios</TableHead>
                  <TableHead>Pantallas</TableHead>
                  <TableHead>Creada</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmpresas.map((empresa) => (
                  <TableRow key={empresa.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {empresa.nombre}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {empresa.userCount}
                        </Badge>
                        <div className="text-xs text-muted-foreground">
                          {empresa.users.slice(0, 2).map(u => u.email).join(', ')}
                          {empresa.users.length > 2 && ` +${empresa.users.length - 2}`}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="flex items-center gap-1 w-fit">
                        <Monitor className="h-3 w-3" />
                        {empresa.billboardCount}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(empresa.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedEmpresa(empresa);
                            setIsAssignUserDialogOpen(true);
                          }}
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedEmpresa(empresa);
                            setEditEmpresaNombre(empresa.nombre);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar empresa?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Se eliminará la empresa "{empresa.nombre}" 
                                y se desvinculará de {empresa.userCount} usuario(s).
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteEmpresa(empresa)}
                                className="bg-destructive text-destructive-foreground"
                              >
                                Eliminar
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Empresa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editNombre">Nombre de la Empresa</Label>
              <Input
                id="editNombre"
                value={editEmpresaNombre}
                onChange={(e) => setEditEmpresaNombre(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateEmpresa}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign User Dialog */}
      <Dialog open={isAssignUserDialogOpen} onOpenChange={setIsAssignUserDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gestionar Usuarios - {selectedEmpresa?.nombre}</DialogTitle>
            <DialogDescription>
              Asignar o remover usuarios de esta empresa
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Current users */}
            <div>
              <Label className="mb-2 block">Usuarios Actuales</Label>
              {selectedEmpresa?.users && selectedEmpresa.users.length > 0 ? (
                <div className="space-y-2">
                  {selectedEmpresa.users.map(user => (
                    <div key={user.user_id} className="flex items-center justify-between bg-muted p-2 rounded">
                      <div>
                        <span className="font-medium">{user.name || 'Sin nombre'}</span>
                        <span className="text-muted-foreground text-sm ml-2">{user.email}</span>
                        <Badge variant="outline" className="ml-2">{user.role}</Badge>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive"
                        onClick={() => handleRemoveUserFromEmpresa(user.user_id)}
                      >
                        Remover
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No hay usuarios asignados</p>
              )}
            </div>

            {/* Add new user */}
            <div>
              <Label className="mb-2 block">Agregar Usuario</Label>
              <div className="flex gap-2">
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Seleccionar usuario sin empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {unassignedUsers.map(user => (
                      <SelectItem key={user.user_id} value={user.user_id}>
                        {user.name || user.email || 'Usuario sin nombre'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAssignUser} disabled={!selectedUserId}>
                  Asignar
                </Button>
              </div>
              {unassignedUsers.length === 0 && (
                <p className="text-muted-foreground text-sm mt-2">
                  Todos los usuarios ya están asignados a una empresa
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAssignUserDialogOpen(false);
              setSelectedUserId("");
            }}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
