import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { UserManagementPanel } from '@/components/superadmin/UserManagementPanel';
import { AuditLogsPanel } from '@/components/superadmin/AuditLogsPanel';
import { useUserManagement } from '@/hooks/useUserManagement';
import { useAuth } from '@/hooks/useAuth';
import { 
  Users, 
  Shield, 
  Activity, 
  Settings,
  BarChart3,
  ShieldAlert,
  UserCheck,
  UserX,
  TrendingUp,
  LogOut
} from 'lucide-react';

export default function SuperAdminDashboard() {
  const { users, auditLogs, hasPermission } = useUserManagement();
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  if (!hasPermission) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <ShieldAlert className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Acceso Restringido</h2>
            <p className="text-muted-foreground">
              No tienes permisos para acceder al panel de Superadministrador.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'active').length,
    suspendedUsers: users.filter(u => u.status === 'suspended').length,
    recentActions: auditLogs.filter(log => {
      const logDate = new Date(log.created_at);
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return logDate > oneDayAgo;
    }).length
  };

  const roleStats = users.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Panel de Superadministrador</h1>
                <p className="text-muted-foreground">
                  Control total del sistema y gestión de usuarios
                </p>
              </div>
            </div>
            
            <Button variant="outline" onClick={signOut} className="gap-2">
              <LogOut className="h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Resumen
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuarios
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Auditoría
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuración
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    Todos los usuarios del sistema
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
                  <UserCheck className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.activeUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}% del total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Usuarios Suspendidos</CardTitle>
                  <UserX className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{stats.suspendedUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    Requieren atención
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Actividad (24h)</CardTitle>
                  <TrendingUp className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.recentActions}</div>
                  <p className="text-xs text-muted-foreground">
                    Acciones recientes
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Role Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Distribución por Roles</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(roleStats).map(([role, count]) => (
                      <div key={role} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {role === 'superadmin' ? 'Superadmin' :
                             role === 'admin' ? 'Admin' :
                             role === 'owner' ? 'Propietario' : 'Anunciante'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">{count}</span>
                          <div className="w-16 bg-secondary rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ 
                                width: `${stats.totalUsers > 0 ? (count / stats.totalUsers) * 100 : 0}%` 
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Actividad Reciente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {auditLogs.slice(0, 5).map((log) => (
                      <div key={log.id} className="flex items-center gap-3 text-sm">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p>{log.action.replace('_', ' ')}</p>
                          <p className="text-muted-foreground">
                            {log.profiles?.name || 'Sistema'} - 
                            {new Date(log.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    {auditLogs.length === 0 && (
                      <p className="text-muted-foreground text-center py-4">
                        No hay actividad reciente
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <UserManagementPanel />
          </TabsContent>

          <TabsContent value="audit">
            <AuditLogsPanel />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuración del Sistema</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Configuración de Seguridad</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Configurar políticas de seguridad y autenticación
                    </p>
                    <Badge variant="secondary">Proximamente</Badge>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Gestión de Permisos</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Configurar permisos personalizados por rol
                    </p>
                    <Badge variant="secondary">Proximamente</Badge>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Configuración de Email</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Configurar plantillas y notificaciones por email
                    </p>
                    <Badge variant="secondary">Proximamente</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}