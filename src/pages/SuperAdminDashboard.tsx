import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { 
  Shield, 
  Users, 
  Settings, 
  Activity, 
  Key, 
  Download, 
  Upload,
  LogOut,
  UserPlus,
  FileText
} from "lucide-react";
import UserManagement from "@/components/superadmin/UserManagement";
import RoleManagement from "@/components/superadmin/RoleManagement"; 
import AuditLogs from "@/components/superadmin/AuditLogs";
import SecuritySettings from "@/components/superadmin/SecuritySettings";
import DataManagement from "@/components/superadmin/DataManagement";

export default function SuperAdminDashboard() {
  const { user, signOut } = useAuth();
  const { isSuperAdmin, loading } = useSuperAdmin();
  const [activeTab, setActiveTab] = useState("users");

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-xl">Cargando panel de administración...</div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return <Navigate to="/superadmin-auth" replace />;
  }

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const stats = [
    {
      title: "Usuarios Totales",
      value: "156",
      description: "Usuarios registrados en el sistema",
      icon: Users,
      change: "+12 este mes"
    },
    {
      title: "Roles Activos", 
      value: "4",
      description: "Roles de usuario configurados",
      icon: Shield,
      change: "Sin cambios"
    },
    {
      title: "Sesiones Activas",
      value: "23",
      description: "Usuarios conectados actualmente", 
      icon: Activity,
      change: "+5 en la última hora"
    },
    {
      title: "Eventos de Seguridad",
      value: "0",
      description: "Incidentes de seguridad hoy",
      icon: Key,
      change: "Todo normal"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">SuperAdmin Panel</h1>
                <p className="text-sm text-muted-foreground">
                  Sistema de Administración - AdAvailable
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-primary/10">
                <Shield className="w-3 h-3 mr-1" />
                SuperAdmin
              </Badge>
              <div className="text-right">
                <div className="text-sm font-medium">{user?.email}</div>
                <div className="text-xs text-muted-foreground">
                  Última actividad: {new Date().toLocaleString()}
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSignOut}
                className="text-destructive hover:text-destructive"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
                <div className="text-xs text-primary mt-2">
                  {stat.change}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Usuarios</span>
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Roles</span>
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>Auditoría</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2">
              <Key className="w-4 h-4" />
              <span>Seguridad</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Datos</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="roles">
            <RoleManagement />
          </TabsContent>

          <TabsContent value="audit">
            <AuditLogs />
          </TabsContent>

          <TabsContent value="security">
            <SecuritySettings />
          </TabsContent>

          <TabsContent value="data">
            <DataManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}