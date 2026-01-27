import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { 
  UserPlus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Ban, 
  CheckCircle,
  Mail,
  Key,
  Calendar
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  last_login_at: string | null;
  created_at: string;
  phone: string | null;
  avatar_url: string | null;
  empresa: string | null;
  empresa_id: string | null;
  empresa_nombre?: string | null;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "advertiser",
    phone: "",
    empresa: ""
  });
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, [searchTerm, roleFilter, statusFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // First get all empresas for mapping
      const { data: empresasData } = await supabase
        .from('empresas')
        .select('id, nombre');
      
      const empresasMap = new Map(empresasData?.map(e => [e.id, e.nombre]) || []);
      
      let query = supabase.from('profiles').select('*');
      
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }
      
      if (roleFilter !== 'all') {
        query = query.eq('role', roleFilter as any);
      }
      
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as any);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error loading users:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los usuarios",
          variant: "destructive",
        });
      } else {
        // Add empresa_nombre to each user
        const usersWithEmpresa = (data || []).map(user => ({
          ...user,
          empresa_nombre: user.empresa_id ? empresasMap.get(user.empresa_id) : null
        }));
        setUsers(usersWithEmpresa);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    try {
      // Validate required fields
      if (!newUser.name.trim()) {
        toast({
          title: "Error de validación",
          description: "El nombre es requerido",
          variant: "destructive",
        });
        return;
      }

      if (!newUser.email.trim()) {
        toast({
          title: "Error de validación",
          description: "El correo electrónico es requerido",
          variant: "destructive",
        });
        return;
      }

      if (!newUser.password || newUser.password.length < 8) {
        toast({
          title: "Error de validación",
          description: "La contraseña debe tener al menos 8 caracteres",
          variant: "destructive",
        });
        return;
      }

      if (!newUser.empresa.trim()) {
        toast({
          title: "Error de validación",
          description: "El nombre de la empresa es requerido",
          variant: "destructive",
        });
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No authenticated session');
      }

      const response = await fetch('https://hkckgwptmycyebrcffxk.supabase.co/functions/v1/admin-create-user', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newUser.name.trim(),
          email: newUser.email.trim().toLowerCase(),
          password: newUser.password,
          role: newUser.role,
          phone: newUser.phone.trim(),
          empresa: newUser.empresa.trim()
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error creating user');
      }

      toast({
        title: "Usuario creado",
        description: `Usuario ${newUser.name} creado exitosamente`,
      });

      setIsCreateDialogOpen(false);
      setNewUser({ name: "", email: "", password: "", role: "advertiser", phone: "", empresa: "" });
      loadUsers();

    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Error al crear usuario",
        description: error.message || "No se pudo crear el usuario",
        variant: "destructive",
      });
    }
  };

  const updateUserStatus = async (user: User, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          status: newStatus as any,
          suspended_until: newStatus === 'suspended' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null
        })
        .eq('user_id', user.user_id);

      if (error) {
        throw error;
      }

      // Log action
      await supabase.rpc('log_user_action', {
        action_type: newStatus === 'suspended' ? 'user_suspended' : 'user_activated',
        resource_type: 'user',
        resource_id: user.user_id,
        details: { email: user.email, status: newStatus }
      });

      toast({
        title: "Estado actualizado",
        description: `Usuario ${newStatus === 'suspended' ? 'suspendido' : 'activado'} exitosamente`,
      });

      loadUsers();

    } catch (error: any) {
      console.error('Error updating user status:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del usuario",
        variant: "destructive",
      });
    }
  };

  const deleteUser = async (user: User) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No authenticated session');
      }

      const response = await fetch('https://hkckgwptmycyebrcffxk.supabase.co/functions/v1/admin-delete-user', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.user_id
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error deleting user');
      }

      toast({
        title: "Usuario eliminado",
        description: `Usuario ${user.name} eliminado exitosamente`,
      });

      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
      loadUsers();

    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el usuario",
        variant: "destructive",
      });
    }
  };

  const updateUserRole = async (user: User, newRole: string) => {
    try {
      // Get current roles
      const { data: currentRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.user_id);

      // Delete old role
      if (currentRoles && currentRoles.length > 0) {
        const { error: deleteError } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', user.user_id);

        if (deleteError) throw deleteError;
      }

      // Insert new role
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert([{
          user_id: user.user_id,
          role: newRole as any
        }]);

      if (insertError) throw insertError;

      // Update profile table for backward compatibility
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: newRole as any })
        .eq('user_id', user.user_id);

      if (profileError) throw profileError;

      // Log action
      await supabase.rpc('log_user_action', {
        action_type: 'user_role_updated',
        resource_type: 'user',
        resource_id: user.user_id,
        details: { 
          email: user.email, 
          old_role: user.role, 
          new_role: newRole 
        }
      });

      toast({
        title: "Rol actualizado",
        description: `Rol del usuario actualizado a ${newRole}`,
      });

      setIsEditDialogOpen(false);
      setEditingUser(null);
      loadUsers();

    } catch (error: any) {
      console.error('Error updating user role');
      toast({
        title: "Error",
        description: "No se pudo actualizar el rol del usuario",
        variant: "destructive",
      });
    }
  };

  const resetPassword = async (user: User) => {
    try {
      // Create password reset request
      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      const { error } = await supabase
        .from('superadmin_password_resets')
        .insert({
          user_id: user.user_id,
          token,
          expires_at: expiresAt.toISOString()
        });

      if (error) {
        throw error;
      }

      // Log action
      await supabase.rpc('log_user_action', {
        action_type: 'password_reset_requested',
        resource_type: 'user',
        resource_id: user.user_id,
        details: { email: user.email }
      });

      toast({
        title: "Restablecimiento solicitado",
        description: "Se ha enviado un enlace de restablecimiento al usuario",
      });

    } catch (error: any) {
      console.error('Error requesting password reset:', error);
      toast({
        title: "Error",
        description: "No se pudo solicitar el restablecimiento de contraseña",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-status-available/20 text-status-available">Activo</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspendido</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactivo</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    const roleColors = {
      superadmin: "bg-primary/20 text-primary",
      admin: "bg-secondary/20 text-secondary-foreground", 
      owner: "bg-accent/20 text-accent-foreground",
      advertiser: "bg-muted/20 text-muted-foreground"
    };

    return (
      <Badge className={roleColors[role as keyof typeof roleColors] || "bg-muted/20 text-muted-foreground"}>
        {role}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5" />
                <span>Gestión de Usuarios</span>
              </CardTitle>
              <CardDescription>
                Crear, editar y gestionar usuarios del sistema
              </CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Crear Usuario
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                  <DialogDescription>
                    Complete la información del nuevo usuario
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nombre completo</Label>
                    <Input
                      id="name"
                      value={newUser.name}
                      onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                      placeholder="Juan Pérez"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Correo electrónico</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      placeholder="juan@ejemplo.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Contraseña temporal</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      placeholder="Mínimo 8 caracteres"
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Rol del usuario</Label>
                    <Select value={newUser.role} onValueChange={(value) => setNewUser({...newUser, role: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="advertiser">Anunciante</SelectItem>
                        <SelectItem value="owner">Propietario</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="phone">Teléfono (opcional)</Label>
                    <Input
                      id="phone"
                      value={newUser.phone}
                      onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                      placeholder="+52 55 1234 5678"
                    />
                  </div>
                  <div>
                    <Label htmlFor="empresa">Empresa</Label>
                    <Input
                      id="empresa"
                      value={newUser.empresa}
                      onChange={(e) => setNewUser({...newUser, empresa: e.target.value})}
                      placeholder="Nombre de la empresa"
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={createUser}>
                    Crear Usuario
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Edit User Role Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Rol de Usuario</DialogTitle>
            <DialogDescription>
              Cambiar el rol de {editingUser?.name || editingUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-role">Nuevo rol</Label>
              <Select 
                value={editingUser?.role} 
                onValueChange={(value) => setEditingUser(prev => prev ? {...prev, role: value} : null)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="advertiser">Anunciante</SelectItem>
                  <SelectItem value="owner">Propietario</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="superadmin">Superadministrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => editingUser && updateUserRole(editingUser, editingUser.role)}>
              Actualizar Rol
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Usuario</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar al usuario {userToDelete?.name || userToDelete?.email}?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <Alert>
            <AlertDescription>
              Al eliminar este usuario se eliminará permanentemente su cuenta y todos los datos relacionados.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => userToDelete && deleteUser(userToDelete)}
            >
              Eliminar Usuario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar por nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[150px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtrar por rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                <SelectItem value="superadmin">Superadmin</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="owner">Propietario</SelectItem>
                <SelectItem value="advertiser">Anunciante</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="suspended">Suspendido</SelectItem>
                <SelectItem value="inactive">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-8">Cargando usuarios...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Último acceso</TableHead>
                  <TableHead>Fecha de registro</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.name || 'Sin nombre'}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                        {user.phone && (
                          <div className="text-xs text-muted-foreground">{user.phone}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.empresa_nombre ? (
                        <Badge variant="outline" className="bg-accent/10">
                          {user.empresa_nombre}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">Sin empresa</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {getRoleBadge(user.role)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(user.status)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {user.last_login_at ? (
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(user.last_login_at).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Nunca</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setEditingUser(user);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Editar
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => resetPassword(user)}>
                          <Key className="w-3 h-3 mr-1" />
                          Reset
                        </Button>
                        {user.status === 'active' ? (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => updateUserStatus(user, 'suspended')}
                            className="text-destructive hover:text-destructive"
                          >
                            <Ban className="w-3 h-3 mr-1" />
                            Suspender
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => updateUserStatus(user, 'active')}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Activar
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setUserToDelete(user);
                            setIsDeleteDialogOpen(true);
                          }}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          
          {!loading && users.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron usuarios con los filtros aplicados
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}