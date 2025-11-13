import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Calendar, AlertCircle } from 'lucide-react';

interface Renovacion {
  id: string;
  campana_id: string;
  fecha_recordatorio: string;
  recordatorio_enviado: boolean;
  respuesta_owner: string;
  nueva_campana_id: string | null;
  notas: string | null;
  campana: {
    nombre: string;
    fecha_fin: string;
    presupuesto_total: number;
    reserva: {
      asset_name: string;
      advertiser: {
        name: string;
        email: string;
      };
    };
  };
}

export function RenovacionesPanel() {
  const [renovaciones, setRenovaciones] = useState<Renovacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRenovacion, setSelectedRenovacion] = useState<Renovacion | null>(null);
  const [notas, setNotas] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchRenovaciones = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('renovaciones_campana')
        .select(`
          *,
          campana:campañas!inner (
            nombre,
            fecha_fin,
            presupuesto_total,
            reserva:reservas!inner (
              asset_name,
              owner_id,
              advertiser:profiles!advertiser_id (
                name,
                email
              )
            )
          )
        `)
        .eq('campana.reserva.owner_id', user.id)
        .eq('respuesta_owner', 'pendiente')
        .order('fecha_recordatorio', { ascending: true }) as any;

      if (error) throw error;
      setRenovaciones(data || []);
    } catch (error) {
      console.error('Error fetching renovaciones:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las renovaciones",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRespuesta = async (renovacionId: string, respuesta: 'renovar' | 'finalizar') => {
    try {
      const { error } = await supabase
        .from('renovaciones_campana')
        .update({
          respuesta_owner: respuesta,
          notas: notas,
        })
        .eq('id', renovacionId);

      if (error) throw error;

      toast({
        title: respuesta === 'renovar' ? 'Renovación confirmada' : 'Finalización confirmada',
        description: `La campaña será ${respuesta === 'renovar' ? 'renovada' : 'finalizada'}`,
      });

      fetchRenovaciones();
      setSelectedRenovacion(null);
      setNotas('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo procesar la respuesta",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchRenovaciones();
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Renovaciones de Campaña</h2>
        <p className="text-muted-foreground">Gestiona las renovaciones próximas a vencer</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : renovaciones.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <RefreshCw className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay renovaciones pendientes</h3>
            <p className="text-muted-foreground">
              Las campañas próximas a vencer aparecerán aquí
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {renovaciones.map((renovacion) => {
            const diasParaVencer = Math.ceil(
              (new Date(renovacion.campana.fecha_fin).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            );

            return (
              <Card key={renovacion.id} className="border-orange-200">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {renovacion.campana.nombre}
                        <Badge variant="outline" className="text-orange-600 border-orange-600">
                          {diasParaVencer} días
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        {renovacion.campana.reserva.asset_name}
                      </CardDescription>
                    </div>
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Cliente:</span>
                        <p className="font-medium">{renovacion.campana.reserva.advertiser?.name}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Fecha de vencimiento:</span>
                        <p className="font-medium">
                          {new Date(renovacion.campana.fecha_fin).toLocaleDateString('es-MX')}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Presupuesto:</span>
                        <p className="font-medium">${renovacion.campana.presupuesto_total.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Email:</span>
                        <p className="font-medium text-sm">{renovacion.campana.reserva.advertiser?.email}</p>
                      </div>
                    </div>

                    <Dialog open={selectedRenovacion?.id === renovacion.id} onOpenChange={(open) => {
                      if (!open) {
                        setSelectedRenovacion(null);
                        setNotas('');
                      }
                    }}>
                      <div className="flex gap-2 pt-4 border-t">
                        <Button
                          className="flex-1"
                          onClick={() => setSelectedRenovacion(renovacion)}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Renovar
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setSelectedRenovacion(renovacion);
                          }}
                        >
                          Finalizar
                        </Button>
                      </div>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Gestionar Renovación</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-muted-foreground mb-2">
                              Campaña: {selectedRenovacion?.campana.nombre}
                            </p>
                            <Textarea
                              placeholder="Notas adicionales (opcional)"
                              value={notas}
                              onChange={(e) => setNotas(e.target.value)}
                              rows={3}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              className="flex-1"
                              onClick={() => handleRespuesta(renovacion.id, 'renovar')}
                            >
                              Renovar Campaña
                            </Button>
                            <Button
                              variant="outline"
                              className="flex-1"
                              onClick={() => handleRespuesta(renovacion.id, 'finalizar')}
                            >
                              Finalizar Campaña
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
