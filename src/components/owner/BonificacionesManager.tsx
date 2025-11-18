import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Gift, Plus, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface BonificacionesManagerProps {
  campanaId: string;
}

interface Bonificacion {
  id: string;
  dias_bonificados: number;
  valor_dias_bonificados: number;
  fecha_inicio_bonificacion: string;
  fecha_fin_bonificacion: string;
  codigo_bonificacion: string;
  motivo: string | null;
  created_at: string;
}

export function BonificacionesManager({ campanaId }: BonificacionesManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [bonificaciones, setBonificaciones] = useState<Bonificacion[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    dias_bonificados: 0,
    valor_dias_bonificados: 0,
    fecha_inicio: '',
    fecha_fin: '',
    codigo_bonificacion: '',
    motivo: '',
  });

  useEffect(() => {
    fetchBonificaciones();
  }, [campanaId]);

  const fetchBonificaciones = async () => {
    try {
      const { data, error } = await supabase
        .from('bonificaciones')
        .select('*')
        .eq('campana_id', campanaId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBonificaciones(data || []);
    } catch (error: any) {
      console.error('Error fetching bonificaciones:', error);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    // Validaciones
    if (formData.dias_bonificados <= 0) {
      toast({
        title: "Error",
        description: "Los días bonificados deben ser mayor a 0",
        variant: "destructive",
      });
      return;
    }

    if (!formData.fecha_inicio || !formData.fecha_fin) {
      toast({
        title: "Error",
        description: "Debes especificar las fechas de bonificación",
        variant: "destructive",
      });
      return;
    }

    if (!formData.codigo_bonificacion) {
      toast({
        title: "Error",
        description: "Debes ingresar un código de bonificación",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('bonificaciones')
        .insert({
          campana_id: campanaId,
          owner_id: user.id,
          dias_bonificados: formData.dias_bonificados,
          valor_dias_bonificados: formData.valor_dias_bonificados,
          fecha_inicio_bonificacion: formData.fecha_inicio,
          fecha_fin_bonificacion: formData.fecha_fin,
          codigo_bonificacion: formData.codigo_bonificacion,
          motivo: formData.motivo || null,
        });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Bonificación registrada correctamente",
      });

      setFormData({
        dias_bonificados: 0,
        valor_dias_bonificados: 0,
        fecha_inicio: '',
        fecha_fin: '',
        codigo_bonificacion: '',
        motivo: '',
      });
      setShowForm(false);
      await fetchBonificaciones();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta bonificación?')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('bonificaciones')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Bonificación eliminada",
      });

      await fetchBonificaciones();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const totalDiasBonificados = bonificaciones.reduce((sum, b) => sum + b.dias_bonificados, 0);
  const totalValorPerdido = bonificaciones.reduce((sum, b) => sum + b.valor_dias_bonificados, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Bonificaciones
            </CardTitle>
            <CardDescription>
              Registra días extra bonificados y su valor
            </CardDescription>
          </div>
          <Button onClick={() => setShowForm(!showForm)} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nueva bonificación
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Resumen */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">Total días bonificados</p>
            <p className="text-2xl font-bold">{totalDiasBonificados}</p>
          </div>
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">Valor total perdido</p>
            <p className="text-2xl font-bold">${totalValorPerdido.toLocaleString()}</p>
          </div>
        </div>

        {/* Formulario */}
        {showForm && (
          <div className="rounded-lg border p-4 space-y-4">
            <h3 className="font-semibold">Nueva Bonificación</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dias">Días bonificados</Label>
                <Input
                  id="dias"
                  type="number"
                  min="0"
                  value={formData.dias_bonificados}
                  onChange={(e) => setFormData(prev => ({ ...prev, dias_bonificados: parseInt(e.target.value) || 0 }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="valor">Valor de los días ($)</Label>
                <Input
                  id="valor"
                  type="number"
                  min="0"
                  value={formData.valor_dias_bonificados}
                  onChange={(e) => setFormData(prev => ({ ...prev, valor_dias_bonificados: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fecha-inicio">Fecha inicio</Label>
                <Input
                  id="fecha-inicio"
                  type="date"
                  value={formData.fecha_inicio}
                  onChange={(e) => setFormData(prev => ({ ...prev, fecha_inicio: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fecha-fin">Fecha fin</Label>
                <Input
                  id="fecha-fin"
                  type="date"
                  value={formData.fecha_fin}
                  onChange={(e) => setFormData(prev => ({ ...prev, fecha_fin: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="codigo">Código de bonificación</Label>
              <Input
                id="codigo"
                value={formData.codigo_bonificacion}
                onChange={(e) => setFormData(prev => ({ ...prev, codigo_bonificacion: e.target.value }))}
                placeholder="Ej: BON-2025-001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo (opcional)</Label>
              <Textarea
                id="motivo"
                value={formData.motivo}
                onChange={(e) => setFormData(prev => ({ ...prev, motivo: e.target.value }))}
                placeholder="Razón de la bonificación..."
                rows={2}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar bonificación'}
              </Button>
              <Button onClick={() => setShowForm(false)} variant="outline">
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Lista de bonificaciones */}
        {bonificaciones.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Días</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Periodo</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bonificaciones.map((bonif) => (
                <TableRow key={bonif.id}>
                  <TableCell>
                    <Badge variant="outline">{bonif.codigo_bonificacion}</Badge>
                  </TableCell>
                  <TableCell>{bonif.dias_bonificados}</TableCell>
                  <TableCell>${bonif.valor_dias_bonificados.toLocaleString()}</TableCell>
                  <TableCell className="text-sm">
                    {new Date(bonif.fecha_inicio_bonificacion).toLocaleDateString()} - {new Date(bonif.fecha_fin_bonificacion).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(bonif.id)}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            No hay bonificaciones registradas
          </p>
        )}
      </CardContent>
    </Card>
  );
}
