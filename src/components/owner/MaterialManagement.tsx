import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, CheckCircle, AlertCircle } from "lucide-react";

interface MaterialManagementProps {
  reservaId: string;
}

interface MaterialData {
  id?: string;
  material_recibido: boolean;
  fecha_recepcion: string | null;
  fecha_limite_entrega: string | null;
  dias_retraso: number;
  quien_imprime: string | null;
  archivo_material: string | null;
  foto_confirmacion: string | null;
  notas: string | null;
}

export function MaterialManagement({ reservaId }: MaterialManagementProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [material, setMaterial] = useState<MaterialData>({
    material_recibido: false,
    fecha_recepcion: null,
    fecha_limite_entrega: null,
    dias_retraso: 0,
    quien_imprime: null,
    archivo_material: null,
    foto_confirmacion: null,
    notas: null,
  });

  useEffect(() => {
    fetchMaterial();
  }, [reservaId]);

  const fetchMaterial = async () => {
    try {
      const { data, error } = await supabase
        .from('materiales_campana')
        .select('*')
        .eq('reserva_id', reservaId)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setMaterial(data);
      }
    } catch (error: any) {
      console.error('Error fetching material:', error);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Si el material fue marcado como recibido, establecer fecha de recepción
      const updateData = {
        ...material,
        fecha_recepcion: material.material_recibido 
          ? (material.fecha_recepcion || new Date().toISOString())
          : material.fecha_recepcion,
      };

      if (material.id) {
        // Update existing
        const { error } = await supabase
          .from('materiales_campana')
          .update(updateData)
          .eq('id', material.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('materiales_campana')
          .insert({
            reserva_id: reservaId,
            ...updateData,
          });

        if (error) throw error;
      }

      toast({
        title: "Éxito",
        description: "Información del material actualizada",
      });

      await fetchMaterial();
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

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    field: 'archivo_material' | 'foto_confirmacion'
  ) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${reservaId}/${field}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('billboard-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('billboard-images')
        .getPublicUrl(fileName);

      setMaterial(prev => ({ ...prev, [field]: publicUrl }));

      toast({
        title: "Archivo subido",
        description: "El archivo se ha subido correctamente",
      });
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Gestión de Material Gráfico
        </CardTitle>
        <CardDescription>
          Administra la recepción y confirmación del material publicitario
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Material recibido */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="material-recibido"
            checked={material.material_recibido}
            onCheckedChange={(checked) =>
              setMaterial(prev => ({ ...prev, material_recibido: checked as boolean }))
            }
          />
          <Label htmlFor="material-recibido" className="flex items-center gap-2">
            {material.material_recibido ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            )}
            Material recibido
          </Label>
        </div>

        {/* Fecha límite de entrega */}
        <div className="space-y-2">
          <Label htmlFor="fecha-limite">Fecha límite de entrega</Label>
          <Input
            id="fecha-limite"
            type="date"
            value={material.fecha_limite_entrega || ''}
            onChange={(e) =>
              setMaterial(prev => ({ ...prev, fecha_limite_entrega: e.target.value }))
            }
          />
        </div>

        {/* Quien imprime */}
        <div className="space-y-2">
          <Label>¿Quién imprime el material?</Label>
          <RadioGroup
            value={material.quien_imprime || ''}
            onValueChange={(value) =>
              setMaterial(prev => ({ ...prev, quien_imprime: value }))
            }
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="dueno" id="dueno" />
              <Label htmlFor="dueno">El Dueño imprime</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="cliente" id="cliente" />
              <Label htmlFor="cliente">El Cliente imprime</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Archivo de material */}
        <div className="space-y-2">
          <Label htmlFor="archivo">Archivo del material</Label>
          <Input
            id="archivo"
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => handleFileUpload(e, 'archivo_material')}
            disabled={loading}
          />
          {material.archivo_material && (
            <p className="text-sm text-muted-foreground">
              Archivo subido: <a href={material.archivo_material} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Ver archivo</a>
            </p>
          )}
        </div>

        {/* Foto de confirmación */}
        <div className="space-y-2">
          <Label htmlFor="foto">Foto de confirmación</Label>
          <Input
            id="foto"
            type="file"
            accept="image/*"
            onChange={(e) => handleFileUpload(e, 'foto_confirmacion')}
            disabled={loading}
          />
          {material.foto_confirmacion && (
            <p className="text-sm text-muted-foreground">
              Foto subida: <a href={material.foto_confirmacion} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Ver foto</a>
            </p>
          )}
        </div>

        {/* Notas */}
        <div className="space-y-2">
          <Label htmlFor="notas">Notas adicionales</Label>
          <Textarea
            id="notas"
            value={material.notas || ''}
            onChange={(e) =>
              setMaterial(prev => ({ ...prev, notas: e.target.value }))
            }
            placeholder="Observaciones sobre el material..."
            rows={3}
          />
        </div>

        {/* Días de retraso (calculado automáticamente) */}
        {material.dias_retraso > 0 && (
          <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-4 border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Días de retraso: {material.dias_retraso}
            </p>
          </div>
        )}

        <Button onClick={handleSave} disabled={loading} className="w-full">
          {loading ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </CardContent>
    </Card>
  );
}
