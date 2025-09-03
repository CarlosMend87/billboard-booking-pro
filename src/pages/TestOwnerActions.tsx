import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/Header";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle } from "lucide-react";

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
}

export default function TestOwnerActions() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchReservas = async () => {
    if (!user) return;

    try {
      // Get all reservas for testing - we'll simulate being the owner
      const { data, error } = await supabase
        .from('reservas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReservas(data || []);
    } catch (error) {
      console.error('Error fetching reservas:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateReservaStatus = async (reservaId: string, status: 'accepted' | 'rejected') => {
    try {
      console.log(`Updating reserva ${reservaId} to status: ${status}`);
      
      const { error } = await supabase
        .from('reservas')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', reservaId);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Reserva updated successfully');

      toast({
        title: status === 'accepted' ? "Reserva Aceptada" : "Reserva Rechazada",
        description: `La reserva ha sido ${status === 'accepted' ? 'aceptada' : 'rechazada'} exitosamente`,
      });

      // Wait a bit for triggers to process, then fetch updated data
      setTimeout(() => {
        fetchReservas();
      }, 1000);
      
    } catch (error: any) {
      console.error('Error updating reserva:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchReservas();
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

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
          <h1 className="text-3xl font-bold mb-2">Panel de Prueba - Gestión de Reservas</h1>
          <p className="text-muted-foreground">
            Simula acciones del propietario para crear campañas (ve a /test-owner)
          </p>
        </div>

        {reservas.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <h3 className="text-lg font-medium mb-2">No hay reservas pendientes</h3>
              <p className="text-muted-foreground">
                Cuando recibas solicitudes de reserva, aparecerán aquí
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {reservas.map((reserva) => (
              <Card key={reserva.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {reserva.asset_name}
                        <Badge className={getStatusColor(reserva.status)}>
                          {reserva.status}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        {reserva.asset_type} - {reserva.modalidad}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">
                        ${reserva.precio_total.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Fecha Inicio</p>
                      <p className="text-muted-foreground">
                        {new Date(reserva.fecha_inicio).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Fecha Fin</p>
                      <p className="text-muted-foreground">
                        {new Date(reserva.fecha_fin).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">ID Reserva</p>
                      <p className="text-muted-foreground font-mono">
                        {reserva.id.slice(-6)}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Creada</p>
                      <p className="text-muted-foreground">
                        {new Date(reserva.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {reserva.config && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-medium mb-2">Configuración:</p>
                      <pre className="text-xs text-muted-foreground">
                        {JSON.stringify(reserva.config, null, 2)}
                      </pre>
                    </div>
                  )}

                  {reserva.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => updateReservaStatus(reserva.id, 'accepted')}
                        className="flex items-center gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Aceptar Reserva
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => updateReservaStatus(reserva.id, 'rejected')}
                        className="flex items-center gap-2"
                      >
                        <XCircle className="h-4 w-4" />
                        Rechazar Reserva
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}