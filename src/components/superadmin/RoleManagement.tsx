import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Plus, Edit, Trash2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RolePermission {
  id: string;
  role: string;
  permission: string;
}

interface Permission {
  name: string;
  description: string;
}

const availablePermissions: Permission[] = [
  { name: 'manage_users', description: 'Gestionar usuarios del sistema' },
  { name: 'manage_roles', description: 'Gestionar roles y permisos' },
  { name: 'manage_system', description: 'Configuración del sistema' },
  { name: 'view_logs', description: 'Ver logs de auditoría' },
  { name: 'reset_passwords', description: 'Restablecer contraseñas' },
  { name: 'suspend_users', description: 'Suspender usuarios' },
  { name: 'export_data', description: 'Exportar datos del sistema' },
  { name: 'import_data', description: 'Importar datos al sistema' },
  { name: 'manage_billboards', description: 'Gestionar vallas publicitarias' },
  { name: 'create_campaigns', description: 'Crear campañas publicitarias' }
];

const roles = [
  { name: 'superadmin', description: 'Acceso completo al sistema', color: 'bg-primary/20 text-primary' },
  { name: 'admin', description: 'Administrador con permisos limitados', color: 'bg-secondary/20 text-secondary-foreground' },
  { name: 'owner', description: 'Propietario de espacios publicitarios', color: 'bg-accent/20 text-accent-foreground' },
  { name: 'advertiser', description: 'Anunciante que compra espacios', color: 'bg-muted/20 text-muted-foreground' }
];

export default function RoleManagement() {
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [rolePermissionMap, setRolePermissionMap] = useState<{[key: string]: string[]}>({});
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPermissions, setEditingPermissions] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadRolePermissions();
  }, []);

  const loadRolePermissions = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('superadmin_permissions')
        .select('*')
        .order('role', { ascending: true });

      if (error) {
        console.error('Error loading role permissions:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los permisos de roles",
          variant: "destructive",
        });
      } else {
        setRolePermissions(data || []);
        
        // Create role -> permissions mapping
        const permMap: {[key: string]: string[]} = {};
        (data || []).forEach((rp) => {
          if (!permMap[rp.role]) {
            permMap[rp.role] = [];
          }
          permMap[rp.role].push(rp.permission);
        });
        setRolePermissionMap(permMap);
      }
    } catch (error) {
      console.error('Error loading role permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (role: string) => {
    setSelectedRole(role);
    setEditingPermissions(rolePermissionMap[role] || []);
    setIsEditDialogOpen(true);
  };

  const saveRolePermissions = async () => {
    if (!selectedRole) return;

    try {
      // Delete existing permissions for this role
      await supabase
        .from('superadmin_permissions')
        .delete()
        .eq('role', selectedRole);

      // Insert new permissions
      if (editingPermissions.length > 0) {
        const permissionsToInsert = editingPermissions.map(permission => ({
          role: selectedRole,
          permission
        }));

        const { error } = await supabase
          .from('superadmin_permissions')
          .insert(permissionsToInsert);

        if (error) {
          throw error;
        }
      }

      // Log action
      await supabase.rpc('log_user_action', {
        action_type: 'role_permissions_updated',
        resource_type: 'role',
        details: { 
          role: selectedRole, 
          permissions: editingPermissions 
        }
      });

      toast({
        title: "Permisos actualizados",
        description: `Permisos del rol ${selectedRole} actualizados exitosamente`,
      });

      setIsEditDialogOpen(false);
      setSelectedRole(null);
      setEditingPermissions([]);
      loadRolePermissions();

    } catch (error: any) {
      console.error('Error saving role permissions:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los permisos del rol",
        variant: "destructive",
      });
    }
  };

  const togglePermission = (permission: string) => {
    if (editingPermissions.includes(permission)) {
      setEditingPermissions(editingPermissions.filter(p => p !== permission));
    } else {
      setEditingPermissions([...editingPermissions, permission]);
    }
  };

  const getRoleBadge = (role: string) => {
    const roleData = roles.find(r => r.name === role);
    return (
      <Badge className={roleData?.color || "bg-muted/20 text-muted-foreground"}>
        {role}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Gestión de Roles y Permisos</span>
          </CardTitle>
          <CardDescription>
            Configure los permisos para cada rol del sistema
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Roles Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Roles del Sistema</CardTitle>
          <CardDescription>
            Roles disponibles y sus permisos asignados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Cargando roles...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rol</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Permisos asignados</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.name}>
                    <TableCell>
                      {getRoleBadge(role.name)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{role.description}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(rolePermissionMap[role.name] || []).map((permission) => (
                          <Badge key={permission} variant="outline" className="text-xs">
                            {permission}
                          </Badge>
                        ))}
                        {(!rolePermissionMap[role.name] || rolePermissionMap[role.name].length === 0) && (
                          <span className="text-sm text-muted-foreground">Sin permisos asignados</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openEditDialog(role.name)}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Editar permisos
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Permissions Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Matriz de Permisos</CardTitle>
          <CardDescription>
            Vista general de todos los permisos por rol
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-3 border-b font-medium">Permiso</th>
                  {roles.map((role) => (
                    <th key={role.name} className="text-center p-3 border-b font-medium">
                      <div className="flex flex-col items-center space-y-1">
                        {getRoleBadge(role.name)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {availablePermissions.map((permission) => (
                  <tr key={permission.name} className="border-b">
                    <td className="p-3">
                      <div>
                        <div className="font-medium text-sm">{permission.name}</div>
                        <div className="text-xs text-muted-foreground">{permission.description}</div>
                      </div>
                    </td>
                    {roles.map((role) => (
                      <td key={role.name} className="p-3 text-center">
                        {rolePermissionMap[role.name]?.includes(permission.name) ? (
                          <Badge className="bg-status-available/20 text-status-available">✓</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Role Permissions Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Editar permisos para: {selectedRole && getRoleBadge(selectedRole)}
            </DialogTitle>
            <DialogDescription>
              Seleccione los permisos que tendrá este rol
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {availablePermissions.map((permission) => (
              <div key={permission.name} className="flex items-start space-x-3 p-3 border rounded-lg">
                <Checkbox
                  id={permission.name}
                  checked={editingPermissions.includes(permission.name)}
                  onCheckedChange={() => togglePermission(permission.name)}
                />
                <div className="flex-1">
                  <Label htmlFor={permission.name} className="text-sm font-medium cursor-pointer">
                    {permission.name}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    {permission.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveRolePermissions}>
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}