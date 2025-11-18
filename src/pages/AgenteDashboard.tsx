import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, TrendingUp, Package } from "lucide-react";
import { NuevaVentaDialog } from "@/components/agente/NuevaVentaDialog";
import { Header } from "@/components/layout/Header";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

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

interface Campana {
  id: string;
  nombre: string;
  presupuesto_total: number;
  fecha_inicio: string;
  fecha_fin: string;
  status: string;
  dias_totales: number;
  dias_transcurridos: number;
}

export default function AgenteDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [openDialog, setOpenDialog] = useState(false);

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

  // Obtener reservas del agente
  const { data: reservas, isLoading: loadingReservas } = useQuery({
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
    enabled: !!agenteData,
  });

  // Obtener campañas asociadas
  const { data: campanas, isLoading: loadingCampanas } = useQuery({
    queryKey: ["agente-campanas", agenteData?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campañas")
        .select(`
          *,
          reserva:reservas!inner(agente_id)
        `)
        .eq("reservas.agente_id", agenteData!.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Campana[];
    },
    enabled: !!agenteData,
  });

  // Calcular estadísticas
  const stats = {
    totalVentas: reservas?.reduce((acc, r) => acc + r.precio_total, 0) || 0,
    reservasActivas: reservas?.filter((r) => r.status === "accepted").length || 0,
    campanasActivas: campanas?.filter((c) => c.status === "active").length || 0,
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard de Agente</h1>
            {agenteData && (
              <p className="text-muted-foreground">
                {agenteData.nombre_completo} - {agenteData.codigo_agente}
              </p>
            )}
          </div>
        </div>

        <NuevaVentaDialog
          open={openDialog}
          onOpenChange={setOpenDialog}
          agenteId={agenteData?.id || ""}
          ownerId={agenteData?.owner_id || ""}
          comisionPorcentaje={agenteData?.comision_porcentaje || 0}
          comisionMontoFijo={agenteData?.comision_monto_fijo || 0}
        />

      {/* Estadísticas */}
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
            <CardTitle className="text-sm font-medium">
              Reservas Activas
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reservasActivas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Campañas Activas
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.campanasActivas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Comisión Estimada
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.comisionEstimada.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs con información detallada */}
      <Tabs defaultValue="reservas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="reservas">Mis Reservas</TabsTrigger>
          <TabsTrigger value="campanas">Campañas</TabsTrigger>
        </TabsList>

        <TabsContent value="reservas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reservas Registradas</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingReservas ? (
                <div>Cargando reservas...</div>
              ) : !reservas || reservas.length === 0 ? (
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
                      <TableHead>Descuento</TableHead>
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
                        <TableCell>
                          {reserva.descuento_aplicado > 0
                            ? `-$${reserva.descuento_aplicado.toLocaleString()}`
                            : "-"}
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

        <TabsContent value="campanas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Campañas en Curso</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingCampanas ? (
                <div>Cargando campañas...</div>
              ) : !campanas || campanas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay campañas asociadas
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Presupuesto</TableHead>
                      <TableHead>Fecha Inicio</TableHead>
                      <TableHead>Fecha Fin</TableHead>
                      <TableHead>Progreso</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campanas.map((campana) => {
                      const progreso = Math.min(
                        100,
                        ((campana.dias_transcurridos || 0) /
                          campana.dias_totales) *
                          100
                      );
                      return (
                        <TableRow key={campana.id}>
                          <TableCell className="font-medium">
                            {campana.nombre}
                          </TableCell>
                          <TableCell>
                            ${campana.presupuesto_total.toLocaleString()}
                          </TableCell>
                          <TableCell>{campana.fecha_inicio}</TableCell>
                          <TableCell>{campana.fecha_fin}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-secondary h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-primary h-full"
                                  style={{ width: `${progreso}%` }}
                                />
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {progreso.toFixed(0)}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(campana.status)}</TableCell>
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
    </>
  );
}
