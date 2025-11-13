import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { FileText, Upload, CheckCircle, AlertCircle, Calendar } from 'lucide-react';

interface Material {
  id: string;
  reserva_id: string;
  campana_id: string | null;
  material_recibido: boolean;
  fecha_recepcion: string | null;
  quien_imprime: string | null;
  archivo_material: string | null;
  foto_confirmacion: string | null;
  fecha_limite_entrega: string | null;
  dias_retraso: number;
  notas: string | null;
  reserva: {
    asset_name: string;
    advertiser: {
      name: string;
    };
  };
}

export function MaterialesManagement() {
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchMateriales = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('materiales_campana')
        .select(`
          *,
          reserva:reservas!inner (
            asset_name,
            owner_id,
            advertiser:profiles!advertiser_id (
              name
            )
          )
        `)
        .eq('reserva.owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMateriales(data || []);
    } catch (error) {
      console.error('Error fetching materiales:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los materiales",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmarRecepcion = async (materialId: string) => {
    try {
      const { error } = await supabase
        .from('materiales_campana')
        .update({
          material_recibido: true,
          fecha_recepcion: new Date().toISOString(),
        })
        .eq('id', materialId);

      if (error) throw error;

      toast({
        title: "Material confirmado",
        description: "La recepción del material ha sido registrada",
      });

      fetchMateriales();
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo confirmar el material",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchMateriales();
  }, [user]);

  const materialesPendientes = materiales.filter(m => !m.material_recibido);
  const materialesRecibidos = materiales.filter(m => m.material_recibido);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Gestión de Materiales</h2>
        <p className="text-muted-foreground">Confirma la recepción de materiales publicitarios</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{materialesPendientes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Recibidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{materialesRecibidos.length}</div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {materialesPendientes.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Materiales Pendientes</h3>
              <div className="grid gap-4">
                {materialesPendientes.map((material) => (
                  <Card key={material.id} className="border-yellow-200">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{material.reserva.asset_name}</CardTitle>
                          <CardDescription>
                            Cliente: {material.reserva.advertiser?.name || 'N/A'}
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                          Pendiente
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {material.fecha_limite_entrega && (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>Fecha límite: {new Date(material.fecha_limite_entrega).toLocaleDateString('es-MX')}</span>
                          </div>
                        )}
                        {material.quien_imprime && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Imprime: </span>
                            <span className="font-medium capitalize">{material.quien_imprime}</span>
                          </div>
                        )}
                        <Dialog open={isDialogOpen && selectedMaterial?.id === material.id} onOpenChange={setIsDialogOpen}>
                          <DialogTrigger asChild>
                            <Button 
                              className="w-full"
                              onClick={() => setSelectedMaterial(material)}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Confirmar Recepción
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Confirmar Recepción de Material</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <p className="text-sm text-muted-foreground">
                                Confirma que has recibido el material publicitario para {material.reserva.asset_name}
                              </p>
                              <Button 
                                className="w-full"
                                onClick={() => handleConfirmarRecepcion(material.id)}
                              >
                                Confirmar Recepción
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {materialesRecibidos.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Materiales Recibidos</h3>
              <div className="grid gap-4">
                {materialesRecibidos.map((material) => (
                  <Card key={material.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{material.reserva.asset_name}</CardTitle>
                          <CardDescription>
                            Cliente: {material.reserva.advertiser?.name || 'N/A'}
                          </CardDescription>
                        </div>
                        <Badge className="bg-green-500">Recibido</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {material.fecha_recepcion && (
                          <div>
                            <span className="text-muted-foreground">Fecha recepción:</span>
                            <p className="font-medium">
                              {new Date(material.fecha_recepcion).toLocaleDateString('es-MX')}
                            </p>
                          </div>
                        )}
                        {material.dias_retraso > 0 && (
                          <div>
                            <span className="text-muted-foreground">Días de retraso:</span>
                            <p className="font-medium text-red-600">{material.dias_retraso}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {materiales.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No hay materiales</h3>
                <p className="text-muted-foreground">
                  Los materiales de las campañas aparecerán aquí
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
