import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Edit, Percent } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CodigoDescuento {
  id: string;
  codigo: string;
  tipo_descuento: string;
  valor_descuento: number;
  activo: boolean;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  uso_maximo: number | null;
  uso_actual: number;
  clientes_permitidos: string[] | null;
  notas: string | null;
  anunciante_id: string | null;
}

interface Anunciante {
  id: string;
  nombre: string;
  empresa: string | null;
}

export function CodigosDescuentoManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCodigo, setEditingCodigo] = useState<CodigoDescuento | null>(null);

  const [formData, setFormData] = useState({
    codigo: "",
    tipo_descuento: "porcentaje" as "porcentaje" | "monto_fijo",
    valor_descuento: "",
    activo: true,
    fecha_inicio: "",
    fecha_fin: "",
    uso_maximo: "",
    notas: "",
    anunciante_id: "" as string,
  });

  // Fetch anunciantes para el selector
  const { data: anunciantes } = useQuery({
    queryKey: ["anunciantes", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("anunciantes")
        .select("id, nombre, empresa")
        .eq("owner_id", user!.id)
        .eq("activo", true)
        .order("nombre");

      if (error) throw error;
      return data as Anunciante[];
    },
    enabled: !!user,
  });

  const { data: codigos, isLoading } = useQuery({
    queryKey: ["codigos-descuento", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("codigos_descuento")
        .select("*")
        .eq("owner_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as CodigoDescuento[];
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("codigos_descuento").insert({
        owner_id: user!.id,
        codigo: data.codigo,
        tipo_descuento: data.tipo_descuento,
        valor_descuento: parseFloat(data.valor_descuento),
        activo: data.activo,
        fecha_inicio: data.fecha_inicio || null,
        fecha_fin: data.fecha_fin || null,
        uso_maximo: data.uso_maximo ? parseInt(data.uso_maximo) : null,
        notas: data.notas || null,
        anunciante_id: data.anunciante_id || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["codigos-descuento", user?.id] });
      toast({ title: "Código creado exitosamente" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error al crear código",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from("codigos_descuento")
        .update({
          codigo: data.codigo,
          tipo_descuento: data.tipo_descuento,
          valor_descuento: parseFloat(data.valor_descuento),
          activo: data.activo,
          fecha_inicio: data.fecha_inicio || null,
          fecha_fin: data.fecha_fin || null,
          uso_maximo: data.uso_maximo ? parseInt(data.uso_maximo) : null,
          notas: data.notas || null,
          anunciante_id: data.anunciante_id || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["codigos-descuento", user?.id] });
      toast({ title: "Código actualizado exitosamente" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error al actualizar código",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("codigos_descuento").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["codigos-descuento", user?.id] });
      toast({ title: "Código eliminado exitosamente" });
    },
    onError: (error: any) => {
      toast({
        title: "Error al eliminar código",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      codigo: "",
      tipo_descuento: "porcentaje",
      valor_descuento: "",
      activo: true,
      fecha_inicio: "",
      fecha_fin: "",
      uso_maximo: "",
      notas: "",
      anunciante_id: "",
    });
    setEditingCodigo(null);
  };

  const handleEdit = (codigo: CodigoDescuento) => {
    setEditingCodigo(codigo);
    setFormData({
      codigo: codigo.codigo,
      tipo_descuento: codigo.tipo_descuento as "porcentaje" | "monto_fijo",
      valor_descuento: codigo.valor_descuento.toString(),
      activo: codigo.activo,
      fecha_inicio: codigo.fecha_inicio || "",
      fecha_fin: codigo.fecha_fin || "",
      uso_maximo: codigo.uso_maximo?.toString() || "",
      notas: codigo.notas || "",
      anunciante_id: codigo.anunciante_id || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCodigo) {
      updateMutation.mutate({ id: editingCodigo.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getAnuncianteNombre = (anuncianteId: string | null) => {
    if (!anuncianteId) return "Todos";
    const anunciante = anunciantes?.find((a) => a.id === anuncianteId);
    return anunciante ? `${anunciante.nombre}${anunciante.empresa ? ` (${anunciante.empresa})` : ""}` : "N/A";
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Percent className="w-5 h-5" />
          Códigos de Descuento
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Código
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCodigo ? "Editar Código" : "Crear Código de Descuento"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Código</Label>
                  <Input
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                    placeholder="VERANO2024"
                    required
                  />
                </div>
                <div>
                  <Label>Tipo de Descuento</Label>
                  <Select
                    value={formData.tipo_descuento}
                    onValueChange={(value: "porcentaje" | "monto_fijo") =>
                      setFormData({ ...formData, tipo_descuento: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="porcentaje">Porcentaje</SelectItem>
                      <SelectItem value="monto_fijo">Monto Fijo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Valor ({formData.tipo_descuento === "porcentaje" ? "%" : "$"})</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.valor_descuento}
                    onChange={(e) => setFormData({ ...formData, valor_descuento: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Uso Máximo (opcional)</Label>
                  <Input
                    type="number"
                    value={formData.uso_maximo}
                    onChange={(e) => setFormData({ ...formData, uso_maximo: e.target.value })}
                    placeholder="Ilimitado"
                  />
                </div>
              </div>

              <div>
                <Label>Anunciante (opcional)</Label>
                <Select
                  value={formData.anunciante_id || "all"}
                  onValueChange={(value) => setFormData({ ...formData, anunciante_id: value === "all" ? "" : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Aplicar a todos los anunciantes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los anunciantes</SelectItem>
                    {anunciantes?.map((anunciante) => (
                      <SelectItem key={anunciante.id} value={anunciante.id}>
                        {anunciante.nombre}
                        {anunciante.empresa && ` (${anunciante.empresa})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-1">
                  Si seleccionas un anunciante, el descuento aplicará a todas sus marcas
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Fecha Inicio (opcional)</Label>
                  <Input
                    type="date"
                    value={formData.fecha_inicio}
                    onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Fecha Fin (opcional)</Label>
                  <Input
                    type="date"
                    value={formData.fecha_fin}
                    onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Notas</Label>
                <Textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  placeholder="Notas internas sobre este código"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.activo}
                  onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                />
                <Label>Código Activo</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">{editingCodigo ? "Actualizar" : "Crear"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div>Cargando códigos...</div>
        ) : !codigos || codigos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay códigos de descuento creados
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Anunciante</TableHead>
                <TableHead>Uso</TableHead>
                <TableHead>Vigencia</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {codigos.map((codigo) => (
                <TableRow key={codigo.id}>
                  <TableCell className="font-mono font-bold">{codigo.codigo}</TableCell>
                  <TableCell className="capitalize">{codigo.tipo_descuento.replace("_", " ")}</TableCell>
                  <TableCell>
                    {codigo.tipo_descuento === "porcentaje"
                      ? `${codigo.valor_descuento}%`
                      : `$${codigo.valor_descuento}`}
                  </TableCell>
                  <TableCell>
                    <Badge variant={codigo.anunciante_id ? "outline" : "secondary"}>
                      {getAnuncianteNombre(codigo.anunciante_id)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {codigo.uso_actual}/{codigo.uso_maximo || "∞"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {codigo.fecha_inicio || codigo.fecha_fin ? (
                      <div>
                        {codigo.fecha_inicio && <div>Desde: {codigo.fecha_inicio}</div>}
                        {codigo.fecha_fin && <div>Hasta: {codigo.fecha_fin}</div>}
                      </div>
                    ) : (
                      "Sin límite"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={codigo.activo ? "default" : "secondary"}>
                      {codigo.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(codigo)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteMutation.mutate(codigo.id)}
                      >
                        <Trash2 className="w-4 h-4" />
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
  );
}
