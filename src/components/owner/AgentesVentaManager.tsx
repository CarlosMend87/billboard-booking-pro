import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, UserPlus, Phone, Mail, Hash } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface Agente {
  id: string;
  nombre_completo: string;
  email: string;
  telefono: string | null;
  codigo_agente: string;
  comision_porcentaje: number | null;
  comision_monto_fijo: number | null;
  activo: boolean | null;
}

export function AgentesVentaManager({ ownerId }: { ownerId: string }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAgente, setEditingAgente] = useState<Agente | null>(null);
  const [formData, setFormData] = useState({
    nombre_completo: "",
    email: "",
    password: "",
    telefono: "",
    codigo_agente: "",
    activo: true,
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: agentes, isLoading } = useQuery({
    queryKey: ["agentes-venta", ownerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agentes_venta")
        .select("*")
        .eq("owner_id", ownerId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Agente[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Call edge function to create user with credentials
      const { data: result, error } = await supabase.functions.invoke("create-agent-user", {
        body: {
          email: data.email,
          password: data.password,
          nombre_completo: data.nombre_completo,
          telefono: data.telefono || null,
          codigo_agente: data.codigo_agente,
          owner_id: ownerId,
        },
      });

      if (error) throw error;
      if (!result?.success) throw new Error(result?.error || "Error al crear agente");
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agentes-venta", ownerId] });
      toast({ 
        title: "Agente creado exitosamente", 
        description: "Se ha enviado un email con las credenciales de acceso"
      });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error al crear agente", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from("agentes_venta")
        .update({
          nombre_completo: data.nombre_completo,
          email: data.email,
          telefono: data.telefono || null,
          codigo_agente: data.codigo_agente,
          activo: data.activo,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agentes-venta", ownerId] });
      toast({ title: "Agente actualizado exitosamente" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error al actualizar agente", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("agentes_venta").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agentes-venta", ownerId] });
      toast({ title: "Agente eliminado exitosamente" });
    },
    onError: (error: Error) => {
      toast({ title: "Error al eliminar agente", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      nombre_completo: "",
      email: "",
      password: "",
      telefono: "",
      codigo_agente: "",
      activo: true,
    });
    setEditingAgente(null);
  };

  const handleEdit = (agente: Agente) => {
    setEditingAgente(agente);
    setFormData({
      nombre_completo: agente.nombre_completo,
      email: agente.email,
      password: "", // Don't show existing password
      telefono: agente.telefono || "",
      codigo_agente: agente.codigo_agente,
      activo: agente.activo ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAgente) {
      updateMutation.mutate({ id: editingAgente.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Agentes de Venta</CardTitle>
            <CardDescription>Gestiona tu equipo de agentes comerciales</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Nuevo Agente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingAgente ? "Editar Agente" : "Nuevo Agente"}</DialogTitle>
                <DialogDescription>
                  {editingAgente ? "Modifica los datos del agente" : "Registra un nuevo agente de ventas"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre_completo">Nombre Completo *</Label>
                    <Input
                      id="nombre_completo"
                      value={formData.nombre_completo}
                      onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="codigo_agente">Código Interno *</Label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="codigo_agente"
                        value={formData.codigo_agente}
                        onChange={(e) => setFormData({ ...formData, codigo_agente: e.target.value })}
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo Electrónico *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="pl-9"
                        required
                        disabled={!!editingAgente}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="telefono"
                        value={formData.telefono}
                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                        className="pl-9"
                      />
                    </div>
                  </div>
                </div>

                {!editingAgente && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      minLength={6}
                      placeholder="Mínimo 6 caracteres"
                    />
                    <p className="text-xs text-muted-foreground">
                      Se enviará un email al agente con sus credenciales de acceso
                    </p>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Switch
                    id="activo"
                    checked={formData.activo}
                    onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                  />
                  <Label htmlFor="activo">Agente activo</Label>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingAgente ? "Actualizar" : "Crear"} Agente
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground">Cargando agentes...</p>
        ) : !agentes || agentes.length === 0 ? (
          <p className="text-muted-foreground">No hay agentes registrados</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agentes.map((agente) => (
                <TableRow key={agente.id}>
                  <TableCell className="font-medium">{agente.nombre_completo}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{agente.codigo_agente}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {agente.email}
                      </div>
                      {agente.telefono && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {agente.telefono}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={agente.activo ? "default" : "secondary"}>
                      {agente.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(agente)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm("¿Estás seguro de eliminar este agente?")) {
                            deleteMutation.mutate(agente.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
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
