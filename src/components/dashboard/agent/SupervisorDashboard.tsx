import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  BarChart3, 
  Monitor, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  Eye,
  FileText
} from "lucide-react";
import { FinancialSummary } from "@/components/owner/FinancialSummary";
import { PerformanceChart } from "@/components/owner/PerformanceChart";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface SupervisorDashboardProps {
  ownerId: string;
}

export function SupervisorDashboard({ ownerId }: SupervisorDashboardProps) {
  // Fetch billboards
  const { data: billboards, isLoading: loadingBillboards } = useQuery({
    queryKey: ["supervisor-billboards", ownerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("billboards")
        .select("*")
        .eq("owner_id", ownerId)
        .order("nombre");
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch recent reservations
  const { data: recentReservations } = useQuery({
    queryKey: ["supervisor-reservations", ownerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservas")
        .select("*")
        .eq("owner_id", ownerId)
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch campaigns
  const { data: campaigns } = useQuery({
    queryKey: ["supervisor-campaigns", ownerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campañas")
        .select(`
          *,
          reserva:reservas!inner(owner_id)
        `)
        .eq("reservas.owner_id", ownerId)
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    },
  });

  const statusStats = {
    total: billboards?.length || 0,
    disponible: billboards?.filter(b => b.status === 'disponible').length || 0,
    ocupada: billboards?.filter(b => b.status === 'ocupada').length || 0,
    mantenimiento: billboards?.filter(b => b.status === 'mantenimiento').length || 0,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "disponible":
        return <Badge className="bg-green-500 text-white">Disponible</Badge>;
      case "ocupada":
        return <Badge variant="destructive">Ocupada</Badge>;
      case "mantenimiento":
        return <Badge variant="secondary">Mantenimiento</Badge>;
      case "pending":
        return <Badge variant="secondary">Pendiente</Badge>;
      case "accepted":
        return <Badge className="bg-green-500 text-white">Aceptada</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rechazada</Badge>;
      case "active":
        return <Badge className="bg-blue-500 text-white">Activa</Badge>;
      case "draft":
        return <Badge variant="outline">Borrador</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Read-Only Notice */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="flex items-center gap-3 py-4">
          <Eye className="h-5 w-5 text-blue-600" />
          <div>
            <p className="font-medium text-blue-900">Modo Solo Lectura</p>
            <p className="text-sm text-blue-700">
              Como Supervisor, puedes ver toda la información pero no realizar modificaciones.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Total Pantallas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{statusStats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {statusStats.disponible} disponibles
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Reservas Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{recentReservations?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              últimos 30 días
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Campañas Activas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {campaigns?.filter(c => c.status === 'active').length || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Ingresos Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              ${(recentReservations?.reduce((acc, r) => acc + (r.precio_total || 0), 0) || 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary (Read-Only) */}
      {billboards && <FinancialSummary billboards={billboards} />}

      {/* Performance Chart */}
      {billboards && <PerformanceChart billboards={billboards} />}

      {/* Tabs */}
      <Tabs defaultValue="inventory" className="w-full">
        <TabsList>
          <TabsTrigger value="inventory" className="gap-2">
            <Monitor className="h-4 w-4" />
            Inventario
          </TabsTrigger>
          <TabsTrigger value="reservations" className="gap-2">
            <Calendar className="h-4 w-4" />
            Reservas
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Campañas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventario de Pantallas</CardTitle>
              <CardDescription>Vista completa del inventario (solo lectura)</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingBillboards ? (
                <div className="text-center py-8 text-muted-foreground">Cargando...</div>
              ) : !billboards || billboards.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay pantallas registradas
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Dirección</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Precio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {billboards.slice(0, 10).map((billboard) => {
                      const precio = billboard.precio as any;
                      return (
                        <TableRow key={billboard.id}>
                          <TableCell className="font-medium">{billboard.nombre}</TableCell>
                          <TableCell className="text-muted-foreground">{billboard.direccion}</TableCell>
                          <TableCell className="capitalize">{billboard.tipo}</TableCell>
                          <TableCell>{getStatusBadge(billboard.status)}</TableCell>
                          <TableCell>
                            {precio?.mensual ? `$${precio.mensual.toLocaleString()}/mes` : "N/A"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
              {billboards && billboards.length > 10 && (
                <p className="text-sm text-muted-foreground text-center mt-4">
                  Mostrando 10 de {billboards.length} pantallas
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reservations" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Reservas Recientes</CardTitle>
              <CardDescription>Historial de reservas (solo lectura)</CardDescription>
            </CardHeader>
            <CardContent>
              {!recentReservations || recentReservations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay reservas recientes
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Activo</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Fechas</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentReservations.map((reserva) => (
                      <TableRow key={reserva.id}>
                        <TableCell className="font-medium">{reserva.asset_name}</TableCell>
                        <TableCell>{reserva.cliente_nombre || "Sin especificar"}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {format(new Date(reserva.fecha_inicio), "dd MMM", { locale: es })} - {format(new Date(reserva.fecha_fin), "dd MMM yyyy", { locale: es })}
                          </div>
                        </TableCell>
                        <TableCell>${reserva.precio_total?.toLocaleString()}</TableCell>
                        <TableCell>{getStatusBadge(reserva.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Campañas</CardTitle>
              <CardDescription>Estado de campañas (solo lectura)</CardDescription>
            </CardHeader>
            <CardContent>
              {!campaigns || campaigns.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay campañas registradas
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Presupuesto</TableHead>
                      <TableHead>Fechas</TableHead>
                      <TableHead>Progreso</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map((campana) => {
                      const progreso = campana.dias_totales 
                        ? Math.min(100, ((campana.dias_transcurridos || 0) / campana.dias_totales) * 100)
                        : 0;
                      return (
                        <TableRow key={campana.id}>
                          <TableCell className="font-medium">{campana.nombre}</TableCell>
                          <TableCell>${campana.presupuesto_total?.toLocaleString()}</TableCell>
                          <TableCell>
                            {campana.fecha_inicio && campana.fecha_fin && (
                              <div className="text-sm">
                                {format(new Date(campana.fecha_inicio), "dd MMM", { locale: es })} - {format(new Date(campana.fecha_fin), "dd MMM", { locale: es })}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-secondary h-2 rounded-full overflow-hidden w-20">
                                <div
                                  className="bg-primary h-full"
                                  style={{ width: `${progreso}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {progreso.toFixed(0)}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(campana.status || 'draft')}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
