import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { RoleBadge } from "@/components/dashboard/RoleBadge";
import { NoAccessMessage } from "@/components/dashboard/NoAccessMessage";
import { AprobadorDashboard } from "@/components/dashboard/agent/AprobadorDashboard";
import { GestorDisponibilidadDashboard } from "@/components/dashboard/agent/GestorDisponibilidadDashboard";
import { SupervisorDashboard } from "@/components/dashboard/agent/SupervisorDashboard";
import { useAgentPermissions, AGENT_ROLE_DESCRIPTIONS } from "@/hooks/useAgentPermissions";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  CheckCircle, 
  Calendar, 
  Eye, 
  DollarSign, 
  TrendingUp, 
  Package,
  Users,
  BarChart3,
  Monitor,
  Settings
} from "lucide-react";
import { NuevaVentaDialog } from "@/components/agente/NuevaVentaDialog";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { FinancialSummary } from "@/components/owner/FinancialSummary";
import { AlertsPanel } from "@/components/owner/AlertsPanel";
import { AgentRoleManager } from "@/components/owner/AgentRoleManager";
import { BillboardAvailabilityCalendar } from "@/components/owner/BillboardAvailabilityCalendar";
import { CodigosDescuentoManager } from "@/components/owner/CodigosDescuentoManager";
import { ExportReports } from "@/components/owner/ExportReports";

interface Reserva {
  id: string;
  asset_name: string;
  fecha_inicio: string;
  fecha_fin: string;
  precio_total: number;
  status: string;
  modalidad: string;
  cliente_nombre: string | null;
  descuento_aplicado: number;
}

export default function AgenteDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [openDialog, setOpenDialog] = useState(false);
  
  const { 
    agentRole, 
    agentInfo, 
    ownerId, 
    loading: permissionsLoading,
    roleLabel,
    hasPermission,
    canAccess
  } = useAgentPermissions();

  // Obtener datos del agente
  const { data: agenteData, isLoading: loadingAgente } = useQuery({
    queryKey: ["agente-info", user?.id],
    queryFn: async () => {
      const { data: authUser } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("agentes_venta")
        .select("*")
        .eq("email", authUser.user?.email)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch billboards for admin role
  const { data: billboards } = useQuery({
    queryKey: ["agent-billboards", ownerId],
    queryFn: async () => {
      if (!ownerId) return [];
      const { data, error } = await supabase
        .from("billboards")
        .select("*")
        .eq("owner_id", ownerId)
        .order("nombre");
      
      if (error) throw error;
      return data;
    },
    enabled: !!ownerId && (agentRole === 'administrador' || agentRole === 'supervisor'),
  });

  // Obtener reservas del agente (for sales stats)
  const { data: reservas } = useQuery({
    queryKey: ["agente-reservas", agenteData?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservas")
        .select("*")
        .eq("agente_id", agenteData!.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Reserva[];
    },
    enabled: !!agenteData && agentRole === 'administrador',
  });

  // Loading state
  if (permissionsLoading || loadingAgente) {
    return (
      <>
        <Header />
        <div className="container mx-auto p-6 space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-6 w-48" />
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </>
    );
  }

  // No role assigned
  if (!agentRole || !ownerId) {
    return (
      <>
        <Header />
        <div className="container mx-auto p-6">
          <NoAccessMessage 
            section="Dashboard de Agente" 
            roleLabel="Sin rol asignado"
            showBackButton={false}
          />
        </div>
      </>
    );
  }

  // Render role-specific dashboard
  const renderDashboardContent = () => {
    switch (agentRole) {
      case 'administrador':
        return <AdministradorDashboard 
          ownerId={ownerId} 
          agenteData={agenteData}
          billboards={billboards || []}
          reservas={reservas || []}
          onNuevaVenta={() => setOpenDialog(true)}
        />;
      
      case 'aprobador':
        return <AprobadorDashboard ownerId={ownerId} />;
      
      case 'gestor_disponibilidad':
        return <GestorDisponibilidadDashboard ownerId={ownerId} />;
      
      case 'supervisor':
        return <SupervisorDashboard ownerId={ownerId} />;
      
      default:
        return (
          <NoAccessMessage 
            section="Dashboard" 
            roleLabel={roleLabel || undefined}
          />
        );
    }
  };

  return (
    <>
      <Header onNuevaVenta={() => {
        if (!agenteData && !loadingAgente) {
          toast({ 
            title: "Error", 
            description: "No se pudo cargar la información del agente",
            variant: "destructive" 
          });
          return;
        }
        setOpenDialog(true);
      }} />
      
      <div className="container mx-auto p-6 space-y-6">
        {/* Header with role info */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">Dashboard de Agente</h1>
              <RoleBadge role={agentRole} showDescription />
            </div>
            {agenteData && (
              <p className="text-muted-foreground">
                {agenteData.nombre_completo} • Código: {agenteData.codigo_agente}
              </p>
            )}
            {agentRole && AGENT_ROLE_DESCRIPTIONS[agentRole] && (
              <p className="text-sm text-muted-foreground/80">
                {AGENT_ROLE_DESCRIPTIONS[agentRole]}
              </p>
            )}
          </div>
        </div>

        {/* Role-specific content */}
        {renderDashboardContent()}
      </div>

      {/* Nueva Venta Dialog - only for admin */}
      {agentRole === 'administrador' && (
        <NuevaVentaDialog
          open={openDialog}
          onOpenChange={setOpenDialog}
          agenteId={agenteData?.id || ""}
          ownerId={ownerId}
          comisionPorcentaje={agenteData?.comision_porcentaje || 0}
          comisionMontoFijo={agenteData?.comision_monto_fijo || 0}
        />
      )}
    </>
  );
}

// Full Admin Dashboard Component
interface AdministradorDashboardProps {
  ownerId: string;
  agenteData: any;
  billboards: any[];
  reservas: Reserva[];
  onNuevaVenta: () => void;
}

function AdministradorDashboard({ ownerId, agenteData, billboards, reservas, onNuevaVenta }: AdministradorDashboardProps) {
  // Calculate stats
  const stats = {
    totalVentas: reservas?.reduce((acc, r) => acc + r.precio_total, 0) || 0,
    reservasActivas: reservas?.filter((r) => r.status === "accepted").length || 0,
    totalPantallas: billboards?.length || 0,
    comisionEstimada: 
      ((reservas?.reduce((acc, r) => acc + r.precio_total, 0) || 0) *
        (agenteData?.comision_porcentaje || 0)) /
        100 +
      (agenteData?.comision_monto_fijo || 0) *
        (reservas?.filter((r) => r.status === "accepted").length || 0),
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pending: "secondary",
      accepted: "default",
      rejected: "destructive",
      active: "default",
    };
    return (
      <Badge variant={variants[status] || "secondary"}>
        {status === "pending"
          ? "Pendiente"
          : status === "accepted"
          ? "Aceptada"
          : status === "rejected"
          ? "Rechazada"
          : status === "active"
          ? "Activa"
          : status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Financial Summary */}
      {billboards && <FinancialSummary billboards={billboards} />}
      
      {/* Alerts */}
      {billboards && <AlertsPanel billboards={billboards} />}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ventas</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalVentas.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reservas Activas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reservasActivas}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pantallas</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPantallas}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comisión Estimada</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.comisionEstimada.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs with all sections */}
      <Tabs defaultValue="reservas" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="reservas" className="gap-2">
            <Package className="h-4 w-4" />
            Reservas
          </TabsTrigger>
          <TabsTrigger value="calendario" className="gap-2">
            <Calendar className="h-4 w-4" />
            Calendario
          </TabsTrigger>
          <TabsTrigger value="agentes" className="gap-2">
            <Users className="h-4 w-4" />
            Agentes
          </TabsTrigger>
          <TabsTrigger value="descuentos" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Descuentos
          </TabsTrigger>
          <TabsTrigger value="reportes" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Reportes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reservas" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Mis Reservas</CardTitle>
                <CardDescription>Reservas registradas por ti</CardDescription>
              </div>
              <Button onClick={onNuevaVenta}>
                Nueva Venta
              </Button>
            </CardHeader>
            <CardContent>
              {!reservas || reservas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No tienes reservas registradas
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Activo</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Modalidad</TableHead>
                      <TableHead>Fecha Inicio</TableHead>
                      <TableHead>Fecha Fin</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reservas.map((reserva) => (
                      <TableRow key={reserva.id}>
                        <TableCell className="font-medium">
                          {reserva.asset_name}
                        </TableCell>
                        <TableCell>
                          {reserva.cliente_nombre || "Sin especificar"}
                        </TableCell>
                        <TableCell className="capitalize">
                          {reserva.modalidad}
                        </TableCell>
                        <TableCell>{reserva.fecha_inicio}</TableCell>
                        <TableCell>{reserva.fecha_fin}</TableCell>
                        <TableCell>
                          ${reserva.precio_total.toLocaleString()}
                        </TableCell>
                        <TableCell>{getStatusBadge(reserva.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendario" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Calendario de Disponibilidad</CardTitle>
              <CardDescription>Gestiona la disponibilidad de las pantallas</CardDescription>
            </CardHeader>
            <CardContent>
              {billboards && billboards.length > 0 ? (
                <BillboardAvailabilityCalendar billboards={billboards} />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No hay pantallas registradas
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agentes" className="space-y-4">
          <AgentRoleManager />
        </TabsContent>

        <TabsContent value="descuentos" className="space-y-4">
          <CodigosDescuentoManager />
        </TabsContent>

        <TabsContent value="reportes" className="space-y-4">
          <ExportReports billboards={billboards || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
