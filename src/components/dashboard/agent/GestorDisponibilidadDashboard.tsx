import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Monitor, Clock, MapPin, AlertTriangle } from "lucide-react";
import { BillboardAvailabilityCalendar } from "@/components/owner/BillboardAvailabilityCalendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface GestorDisponibilidadDashboardProps {
  ownerId: string;
}

export function GestorDisponibilidadDashboard({ ownerId }: GestorDisponibilidadDashboardProps) {
  // State for calendar is now handled inside BillboardAvailabilityCalendar
  

  // Fetch billboards
  const { data: billboards, isLoading: loadingBillboards } = useQuery({
    queryKey: ["gestor-billboards", ownerId],
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

  // Fetch upcoming reservations
  const { data: upcomingReservations } = useQuery({
    queryKey: ["gestor-upcoming-reservations", ownerId],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from("reservas")
        .select("*")
        .eq("owner_id", ownerId)
        .eq("status", "accepted")
        .gte("fecha_inicio", today)
        .order("fecha_inicio")
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
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
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
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-green-500" />
              Disponibles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{statusStats.disponible}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-red-500" />
              Ocupadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{statusStats.ocupada}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Mantenimiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{statusStats.mantenimiento}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="calendar" className="w-full">
        <TabsList>
          <TabsTrigger value="calendar" className="gap-2">
            <Calendar className="h-4 w-4" />
            Calendario
          </TabsTrigger>
          <TabsTrigger value="screens" className="gap-2">
            <Monitor className="h-4 w-4" />
            Pantallas
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="gap-2">
            <Clock className="h-4 w-4" />
            Próximas Reservas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Calendario de Disponibilidad</CardTitle>
              <CardDescription>
                Visualiza y gestiona la disponibilidad de las pantallas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {billboards && billboards.length > 0 ? (
                <BillboardAvailabilityCalendar billboards={billboards} />
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay pantallas disponibles</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="screens" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventario de Pantallas</CardTitle>
              <CardDescription>
                Estado actual de todas las pantallas
              </CardDescription>
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {billboards.map((billboard) => (
                      <TableRow key={billboard.id}>
                        <TableCell className="font-medium">{billboard.nombre}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {billboard.direccion}
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{billboard.tipo}</TableCell>
                        <TableCell>{getStatusBadge(billboard.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upcoming" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Próximas Reservas</CardTitle>
              <CardDescription>
                Reservas confirmadas que comenzarán próximamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!upcomingReservations || upcomingReservations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay reservas próximas</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Activo</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Fecha Inicio</TableHead>
                      <TableHead>Fecha Fin</TableHead>
                      <TableHead>Modalidad</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingReservations.map((reserva) => (
                      <TableRow key={reserva.id}>
                        <TableCell className="font-medium">{reserva.asset_name}</TableCell>
                        <TableCell>{reserva.cliente_nombre || "Sin especificar"}</TableCell>
                        <TableCell>
                          {format(new Date(reserva.fecha_inicio), "dd MMM yyyy", { locale: es })}
                        </TableCell>
                        <TableCell>
                          {format(new Date(reserva.fecha_fin), "dd MMM yyyy", { locale: es })}
                        </TableCell>
                        <TableCell className="capitalize">{reserva.modalidad}</TableCell>
                      </TableRow>
                    ))}
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
