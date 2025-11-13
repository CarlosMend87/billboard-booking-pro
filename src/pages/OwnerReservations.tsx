import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Header } from "@/components/layout/Header";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAgentes } from "@/hooks/useAgentes";

interface Reserva {
  id: string;
  advertiser_id: string;
  asset_name: string;
  asset_type: string;
  modalidad: string;
  fecha_inicio: string;
  fecha_fin: string;
  precio_total: number;
  status: string;
  config: any;
  created_at: string;
  advertiser: {
    name: string;
    email: string;
  };
}

export default function OwnerReservations() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedReserva, setSelectedReserva] = useState<Reserva | null>(null);
  const [showVentaDialog, setShowVentaDialog] = useState(false);
  const [ventaData, setVentaData] = useState({
    agente_id: '',
    tarifa_publicada: 0,
    tarifa_final: 0,
    cliente_nombre: '',
    cliente_email: '',
    cliente_razon_social: '',
    es_agencia: false,
    tipo_contrato: 'fijo' as 'fijo' | 'renovable',
  });
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { agentes } = useAgentes();

  const fetchReservas = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('reservas')
        .select(`
          *,
          advertiser:profiles!advertiser_id (
            name,
            email
          )
        `)
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReservas(data || []);
    } catch (error) {
      console.error('Error fetching reservas:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las reservas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReservaAction = async (reservaId: string, action: 'accepted' | 'rejected') => {
    if (action === 'accepted') {
      // Show dialog for sales assignment
      const reserva = reservas.find(r => r.id === reservaId);
      if (reserva) {
        setSelectedReserva(reserva);
        setVentaData({
          ...ventaData,
          tarifa_publicada: reserva.precio_total,
          tarifa_final: reserva.precio_total,
          cliente_email: reserva.advertiser.email,
        });
        setShowVentaDialog(true);
      }
      return;
    }

    // Direct rejection without sales data
    await processReserva(reservaId, action, {});
  };

  const processReserva = async (reservaId: string, action: 'accepted' | 'rejected', salesData: any) => {
    setProcessingId(reservaId);
    
    try {
      // Update reserva status with sales data
      const { error: updateError } = await supabase
        .from('reservas')
        .update({ 
          status: action,
          ...salesData,
          updated_at: new Date().toISOString()
        })
        .eq('id', reservaId);

      if (updateError) throw updateError;

      // Campaign is automatically created by database trigger
      // Send notification emails
      try {
        const { error: emailError } = await supabase.functions.invoke('send-campaign-pdf', {
          body: {
            reservaId: reservaId,
            action: action
          }
        });

        if (emailError) {
          console.error('Error sending notification email:', emailError);
          // Don't fail the entire operation if email fails
        }
      } catch (emailError) {
        console.error('Error invoking email function:', emailError);
      }

      toast({
        title: action === 'accepted' ? "Reserva Aceptada" : "Reserva Rechazada",
        description: action === 'accepted' 
          ? "La campaña ha sido creada y el anunciante ha sido notificado" 
          : "El anunciante ha sido notificado de tu decisión",
      });

      // Refresh the list
      fetchReservas();
      setShowVentaDialog(false);
      setSelectedReserva(null);
    } catch (error: any) {
      console.error('Error processing reserva:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo procesar la reserva",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmVenta = async () => {
    if (!selectedReserva) return;
    await processReserva(selectedReserva.id, 'accepted', ventaData);
  };

  useEffect(() => {
    fetchReservas();
    
    // Set up real-time subscription for new reservations
    const channel = supabase
      .channel('owner-reservas')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reservas',
          filter: `owner_id=eq.${user?.id}`
        },
        () => {
          fetchReservas();
          toast({
            title: "Nueva Reserva",
            description: "Has recibido una nueva solicitud de reserva",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const pendingReservas = reservas.filter(r => r.status === 'pending');
  const processedReservas = reservas.filter(r => r.status !== 'pending');

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">Cargando reservas...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Gestión de Reservas
              </h1>
              <p className="text-muted-foreground mt-2">
                Revisa y responde a las solicitudes de reserva de tus espacios publicitarios
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate('/owner-dashboard')}>
              Volver al Dashboard
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingReservas.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aceptadas</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {reservas.filter(r => r.status === 'accepted').length}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rechazadas</CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {reservas.filter(r => r.status === 'rejected').length}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Pending Reservations */}
        {pendingReservas.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Solicitudes Pendientes</h2>
            <div className="grid gap-4">
              {pendingReservas.map((reserva) => (
                <Card key={reserva.id} className="border-yellow-200">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {reserva.asset_name}
                          <Badge className={getStatusColor(reserva.status)}>
                            {getStatusIcon(reserva.status)}
                            <span className="ml-1">Pendiente</span>
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          Solicitado por: {reserva.advertiser?.name || 'N/A'} ({reserva.advertiser?.email})
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">
                          ${reserva.precio_total.toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">MXN</p>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-muted-foreground">Tipo</p>
                        <p className="font-semibold">{reserva.asset_type}</p>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground">Modalidad</p>
                        <p className="font-semibold">{reserva.modalidad}</p>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground">Fecha Inicio</p>
                        <p className="font-semibold">
                          {new Date(reserva.fecha_inicio).toLocaleDateString('es-MX')}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground">Fecha Fin</p>
                        <p className="font-semibold">
                          {new Date(reserva.fecha_fin).toLocaleDateString('es-MX')}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        onClick={() => handleReservaAction(reserva.id, 'accepted')}
                        disabled={processingId === reserva.id}
                        className="flex-1"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Aceptar y Asignar
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleReservaAction(reserva.id, 'rejected')}
                        disabled={processingId === reserva.id}
                        className="flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Rechazar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Dialog for Sales Assignment */}
        <Dialog open={showVentaDialog} onOpenChange={setShowVentaDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Asignar Información de Venta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="agente_id">Agente de Venta</Label>
                <Select
                  value={ventaData.agente_id}
                  onValueChange={(value) => setVentaData({ ...ventaData, agente_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar agente (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin agente</SelectItem>
                    {agentes.filter(a => a.activo).map((agente) => (
                      <SelectItem key={agente.id} value={agente.id}>
                        {agente.nombre_completo} ({agente.codigo_agente})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tarifa_publicada">Tarifa Publicada</Label>
                  <Input
                    id="tarifa_publicada"
                    type="number"
                    value={ventaData.tarifa_publicada}
                    onChange={(e) => setVentaData({ ...ventaData, tarifa_publicada: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="tarifa_final">Tarifa Final (Venta)</Label>
                  <Input
                    id="tarifa_final"
                    type="number"
                    value={ventaData.tarifa_final}
                    onChange={(e) => setVentaData({ ...ventaData, tarifa_final: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cliente_nombre">Nombre del Cliente</Label>
                  <Input
                    id="cliente_nombre"
                    value={ventaData.cliente_nombre}
                    onChange={(e) => setVentaData({ ...ventaData, cliente_nombre: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="cliente_email">Email del Cliente</Label>
                  <Input
                    id="cliente_email"
                    type="email"
                    value={ventaData.cliente_email}
                    onChange={(e) => setVentaData({ ...ventaData, cliente_email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="cliente_razon_social">Razón Social</Label>
                <Input
                  id="cliente_razon_social"
                  value={ventaData.cliente_razon_social}
                  onChange={(e) => setVentaData({ ...ventaData, cliente_razon_social: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tipo_contrato">Tipo de Contrato</Label>
                  <Select
                    value={ventaData.tipo_contrato}
                    onValueChange={(value: 'fijo' | 'renovable') => setVentaData({ ...ventaData, tipo_contrato: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fijo">Fijo</SelectItem>
                      <SelectItem value="renovable">Renovable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2 pt-8">
                  <input
                    type="checkbox"
                    id="es_agencia"
                    checked={ventaData.es_agencia}
                    onChange={(e) => setVentaData({ ...ventaData, es_agencia: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="es_agencia">¿Es una agencia?</Label>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowVentaDialog(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmVenta}
                  disabled={processingId !== null}
                  className="flex-1"
                >
                  {processingId ? 'Procesando...' : 'Confirmar y Aceptar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Processed Reservations */}
        {processedReservas.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Historial de Reservas</h2>
            <div className="grid gap-4">
              {processedReservas.map((reserva) => (
                <Card key={reserva.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {reserva.asset_name}
                          <Badge className={getStatusColor(reserva.status)}>
                            {getStatusIcon(reserva.status)}
                            <span className="ml-1 capitalize">{reserva.status}</span>
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          {reserva.advertiser?.name || 'N/A'} • {reserva.asset_type} • {reserva.modalidad}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold">
                          ${reserva.precio_total.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      {new Date(reserva.fecha_inicio).toLocaleDateString('es-MX')} - {new Date(reserva.fecha_fin).toLocaleDateString('es-MX')}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {reservas.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay reservas</h3>
              <p className="text-muted-foreground">
                Cuando recibas solicitudes de reserva para tus espacios, aparecerán aquí
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
