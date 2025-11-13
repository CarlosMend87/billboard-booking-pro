import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Gift, DollarSign, Calendar, TrendingDown } from 'lucide-react';

interface Bonificacion {
  id: string;
  campana_id: string;
  codigo_bonificacion: string;
  dias_bonificados: number;
  valor_dias_bonificados: number;
  motivo: string | null;
  fecha_inicio_bonificacion: string;
  fecha_fin_bonificacion: string;
  campana: {
    nombre: string;
    reserva: {
      asset_name: string;
    };
  };
}

interface Campana {
  id: string;
  nombre: string;
  presupuesto_total: number;
  dias_totales: number;
  reserva: {
    asset_name: string;
  };
}

export function BonificacionesPanel() {
  const [bonificaciones, setBonificaciones] = useState<Bonificacion[]>([]);
  const [campanas, setCampanas] = useState<Campana[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    campana_id: '',
    codigo_bonificacion: '',
    dias_bonificados: 0,
    motivo: '',
    fecha_inicio_bonificacion: '',
    fecha_fin_bonificacion: '',
  });
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchData = async () => {
    if (!user) return;

    try {
      // Fetch bonificaciones
      const { data: bonif, error: bonifError } = await supabase
        .from('bonificaciones')
        .select(`
          *,
          campana:campañas (
            nombre,
            reserva:reservas (
              asset_name
            )
          )
        `)
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false }) as any;

      if (bonifError) throw bonifError;
      setBonificaciones(bonif || []);

      // Fetch campanas activas
      const { data: camps, error: campsError } = await supabase
        .from('campañas')
        .select(`
          id,
          nombre,
          presupuesto_total,
          dias_totales,
          reserva:reservas!inner (
            asset_name,
            owner_id
          )
        `)
        .eq('reserva.owner_id', user.id)
        .eq('status', 'active') as any;

      if (campsError) throw campsError;
      setCampanas(camps || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const campanaSeleccionada = campanas.find(c => c.id === formData.campana_id);
    if (!campanaSeleccionada) return;

    const valorPorDia = campanaSeleccionada.presupuesto_total / campanaSeleccionada.dias_totales;
    const valorDiasBonificados = valorPorDia * formData.dias_bonificados;

    try {
      const { error } = await supabase
        .from('bonificaciones')
        .insert({
          ...formData,
          owner_id: user!.id,
          valor_dias_bonificados: valorDiasBonificados,
        });

      if (error) throw error;

      toast({
        title: "Bonificación registrada",
        description: `Se han bonificado ${formData.dias_bonificados} días por un valor de $${valorDiasBonificados.toLocaleString()}`,
      });

      setIsDialogOpen(false);
      setFormData({
        campana_id: '',
        codigo_bonificacion: '',
        dias_bonificados: 0,
        motivo: '',
        fecha_inicio_bonificacion: '',
        fecha_fin_bonificacion: '',
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo registrar la bonificación",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const totalBonificado = bonificaciones.reduce((sum, b) => sum + b.valor_dias_bonificados, 0);
  const totalDiasBonificados = bonificaciones.reduce((sum, b) => sum + b.dias_bonificados, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Bonificaciones</h2>
          <p className="text-muted-foreground">Registra tiempo extra otorgado a clientes</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Gift className="h-4 w-4 mr-2" />
              Nueva Bonificación
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Bonificación</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="campana_id">Campaña *</Label>
                <select
                  id="campana_id"
                  value={formData.campana_id}
                  onChange={(e) => setFormData({ ...formData, campana_id: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="">Selecciona una campaña</option>
                  {campanas.map((campana) => (
                    <option key={campana.id} value={campana.id}>
                      {campana.nombre} - {campana.reserva.asset_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigo_bonificacion">Código Bonificación *</Label>
                  <Input
                    id="codigo_bonificacion"
                    value={formData.codigo_bonificacion}
                    onChange={(e) => setFormData({ ...formData, codigo_bonificacion: e.target.value })}
                    placeholder="BON001"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dias_bonificados">Días Bonificados *</Label>
                  <Input
                    id="dias_bonificados"
                    type="number"
                    min="1"
                    value={formData.dias_bonificados}
                    onChange={(e) => setFormData({ ...formData, dias_bonificados: parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fecha_inicio_bonificacion">Fecha Inicio *</Label>
                  <Input
                    id="fecha_inicio_bonificacion"
                    type="date"
                    value={formData.fecha_inicio_bonificacion}
                    onChange={(e) => setFormData({ ...formData, fecha_inicio_bonificacion: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fecha_fin_bonificacion">Fecha Fin *</Label>
                  <Input
                    id="fecha_fin_bonificacion"
                    type="date"
                    value={formData.fecha_fin_bonificacion}
                    onChange={(e) => setFormData({ ...formData, fecha_fin_bonificacion: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="motivo">Motivo</Label>
                <Textarea
                  id="motivo"
                  value={formData.motivo}
                  onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                  placeholder="Describe el motivo de la bonificación"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Registrar Bonificación</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              Total Bonificado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              ${totalBonificado.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Valor total regalado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              Días Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalDiasBonificados}</div>
            <p className="text-sm text-muted-foreground mt-1">Días bonificados en total</p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : bonificaciones.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Gift className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay bonificaciones</h3>
            <p className="text-muted-foreground">
              Las bonificaciones registradas aparecerán aquí
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {bonificaciones.map((bonif) => (
            <Card key={bonif.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{bonif.campana.nombre}</CardTitle>
                    <CardDescription>{bonif.campana.reserva.asset_name}</CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-red-600">
                      -${bonif.valor_dias_bonificados.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">{bonif.dias_bonificados} días</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Código:</span>
                    <p className="font-medium">{bonif.codigo_bonificacion}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Inicio:</span>
                    <p className="font-medium">
                      {new Date(bonif.fecha_inicio_bonificacion).toLocaleDateString('es-MX')}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Fin:</span>
                    <p className="font-medium">
                      {new Date(bonif.fecha_fin_bonificacion).toLocaleDateString('es-MX')}
                    </p>
                  </div>
                </div>
                {bonif.motivo && (
                  <div className="mt-3 pt-3 border-t">
                    <span className="text-sm text-muted-foreground">Motivo:</span>
                    <p className="text-sm mt-1">{bonif.motivo}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
