import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Clock, Eye, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface AprobadorDashboardProps {
  ownerId: string;
}

export function AprobadorDashboard({ ownerId }: AprobadorDashboardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedReserva, setSelectedReserva] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  // Fetch pending reservations
  const { data: pendingReservas, isLoading: loadingPending } = useQuery({
    queryKey: ["aprobador-pending-reservas", ownerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservas")
        .select("*")
        .eq("owner_id", ownerId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch processed reservations (approved/rejected)
  const { data: processedReservas, isLoading: loadingProcessed } = useQuery({
    queryKey: ["aprobador-processed-reservas", ownerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservas")
        .select("*")
        .eq("owner_id", ownerId)
        .in("status", ["accepted", "rejected"])
        .order("updated_at", { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    },
  });

  // Mutation to update reservation status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("reservas")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["aprobador-pending-reservas"] });
      queryClient.invalidateQueries({ queryKey: ["aprobador-processed-reservas"] });
      toast({
        title: variables.status === "accepted" ? "Campaña Aprobada" : "Campaña Rechazada",
        description: variables.status === "accepted" 
          ? "La campaña ha sido aprobada exitosamente"
          : "La campaña ha sido rechazada",
      });
      setSelectedReserva(null);
      setRejectionReason("");
      setIsRejectDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la campaña",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (reserva: any) => {
    updateStatusMutation.mutate({ id: reserva.id, status: "accepted" });
  };

  const handleReject = () => {
    if (selectedReserva) {
      updateStatusMutation.mutate({ id: selectedReserva.id, status: "rejected" });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Pendiente</Badge>;
      case "accepted":
        return <Badge className="bg-green-500 text-white gap-1"><CheckCircle className="h-3 w-3" /> Aprobada</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Rechazada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingCount = pendingReservas?.length || 0;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              Pendientes de Aprobación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{pendingCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {pendingCount === 1 ? "campaña requiere" : "campañas requieren"} tu atención
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Aprobadas (Últimos 30 días)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {processedReservas?.filter(r => r.status === "accepted").length || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              Rechazadas (Últimos 30 días)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {processedReservas?.filter(r => r.status === "rejected").length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pendientes
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <FileText className="h-4 w-4" />
            Historial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Campañas Pendientes de Aprobación</CardTitle>
              <CardDescription>
                Revisa y aprueba o rechaza las campañas entrantes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPending ? (
                <div className="text-center py-8 text-muted-foreground">Cargando...</div>
              ) : !pendingReservas || pendingReservas.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">¡Todo al día!</h3>
                  <p className="text-muted-foreground">No hay campañas pendientes de aprobación</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Activo</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Fechas</TableHead>
                      <TableHead>Modalidad</TableHead>
                      <TableHead>Precio Total</TableHead>
                      <TableHead>Recibido</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingReservas.map((reserva) => (
                      <TableRow key={reserva.id}>
                        <TableCell className="font-medium">{reserva.asset_name}</TableCell>
                        <TableCell>{reserva.cliente_nombre || "Sin especificar"}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {format(new Date(reserva.fecha_inicio), "dd MMM", { locale: es })} - {format(new Date(reserva.fecha_fin), "dd MMM yyyy", { locale: es })}
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{reserva.modalidad}</TableCell>
                        <TableCell className="font-medium">${reserva.precio_total?.toLocaleString()}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(reserva.created_at), "dd/MM/yyyy HH:mm", { locale: es })}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => handleApprove(reserva)}
                              disabled={updateStatusMutation.isPending}
                              className="bg-green-500 hover:bg-green-600"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Aprobar
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => {
                                setSelectedReserva(reserva);
                                setIsRejectDialogOpen(true);
                              }}
                              disabled={updateStatusMutation.isPending}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Rechazar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Aprobaciones</CardTitle>
              <CardDescription>Últimas campañas procesadas</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingProcessed ? (
                <div className="text-center py-8 text-muted-foreground">Cargando...</div>
              ) : !processedReservas || processedReservas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay historial de aprobaciones
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
                      <TableHead>Procesado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedReservas.map((reserva) => (
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
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(reserva.updated_at), "dd/MM/yyyy HH:mm", { locale: es })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Rejection Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar Campaña</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas rechazar esta campaña? 
              {selectedReserva && (
                <span className="block mt-2 font-medium text-foreground">
                  {selectedReserva.asset_name} - {selectedReserva.cliente_nombre || "Cliente sin especificar"}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">
              Motivo del rechazo (opcional)
            </label>
            <Textarea
              placeholder="Indica el motivo del rechazo..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={updateStatusMutation.isPending}
            >
              Confirmar Rechazo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
