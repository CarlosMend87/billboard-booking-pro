import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Edit, Building2, Tag, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Anunciante {
  id: string;
  nombre: string;
  empresa: string | null;
  email: string | null;
  telefono: string | null;
  user_id: string | null;
  notas: string | null;
  activo: boolean;
  created_at: string;
}

interface Marca {
  id: string;
  anunciante_id: string;
  nombre: string;
  descripcion: string | null;
  activa: boolean;
}

export function AnunciantesManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMarcaDialogOpen, setIsMarcaDialogOpen] = useState(false);
  const [editingAnunciante, setEditingAnunciante] = useState<Anunciante | null>(null);
  const [selectedAnuncianteForMarca, setSelectedAnuncianteForMarca] = useState<string | null>(null);
  const [expandedAnunciantes, setExpandedAnunciantes] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState({
    nombre: "",
    empresa: "",
    email: "",
    telefono: "",
    notas: "",
    activo: true,
  });

  const [marcaFormData, setMarcaFormData] = useState({
    nombre: "",
    descripcion: "",
  });

  // Fetch anunciantes
  const { data: anunciantes, isLoading } = useQuery({
    queryKey: ["anunciantes", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("anunciantes")
        .select("*")
        .eq("owner_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Anunciante[];
    },
    enabled: !!user,
  });

  // Fetch marcas para todos los anunciantes
  const { data: marcas } = useQuery({
    queryKey: ["marcas", user?.id],
    queryFn: async () => {
      const anuncianteIds = anunciantes?.map(a => a.id) || [];
      if (anuncianteIds.length === 0) return [];

      const { data, error } = await supabase
        .from("marcas")
        .select("*")
        .in("anunciante_id", anuncianteIds);

      if (error) throw error;
      return data as Marca[];
    },
    enabled: !!anunciantes && anunciantes.length > 0,
  });

  // Mutations para anunciantes
  const createAnuncianteMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("anunciantes").insert({
        owner_id: user!.id,
        nombre: data.nombre,
        empresa: data.empresa || null,
        email: data.email || null,
        telefono: data.telefono || null,
        notas: data.notas || null,
        activo: data.activo,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anunciantes", user?.id] });
      toast({ title: "Anunciante creado exitosamente" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Error al crear anunciante", description: error.message, variant: "destructive" });
    },
  });

  const updateAnuncianteMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from("anunciantes")
        .update({
          nombre: data.nombre,
          empresa: data.empresa || null,
          email: data.email || null,
          telefono: data.telefono || null,
          notas: data.notas || null,
          activo: data.activo,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anunciantes", user?.id] });
      toast({ title: "Anunciante actualizado" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Error al actualizar", description: error.message, variant: "destructive" });
    },
  });

  const deleteAnuncianteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("anunciantes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anunciantes", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["marcas", user?.id] });
      toast({ title: "Anunciante eliminado" });
    },
    onError: (error: any) => {
      toast({ title: "Error al eliminar", description: error.message, variant: "destructive" });
    },
  });

  // Mutations para marcas
  const createMarcaMutation = useMutation({
    mutationFn: async ({ anuncianteId, data }: { anuncianteId: string; data: typeof marcaFormData }) => {
      const { error } = await supabase.from("marcas").insert({
        anunciante_id: anuncianteId,
        nombre: data.nombre,
        descripcion: data.descripcion || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marcas", user?.id] });
      toast({ title: "Marca creada exitosamente" });
      setMarcaFormData({ nombre: "", descripcion: "" });
      setIsMarcaDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Error al crear marca", description: error.message, variant: "destructive" });
    },
  });

  const deleteMarcaMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("marcas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marcas", user?.id] });
      toast({ title: "Marca eliminada" });
    },
    onError: (error: any) => {
      toast({ title: "Error al eliminar marca", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({ nombre: "", empresa: "", email: "", telefono: "", notas: "", activo: true });
    setEditingAnunciante(null);
  };

  const handleEdit = (anunciante: Anunciante) => {
    setEditingAnunciante(anunciante);
    setFormData({
      nombre: anunciante.nombre,
      empresa: anunciante.empresa || "",
      email: anunciante.email || "",
      telefono: anunciante.telefono || "",
      notas: anunciante.notas || "",
      activo: anunciante.activo,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAnunciante) {
      updateAnuncianteMutation.mutate({ id: editingAnunciante.id, data: formData });
    } else {
      createAnuncianteMutation.mutate(formData);
    }
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedAnunciantes);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedAnunciantes(newExpanded);
  };

  const getMarcasForAnunciante = (anuncianteId: string) => {
    return marcas?.filter(m => m.anunciante_id === anuncianteId) || [];
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Anunciantes y Marcas
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Anunciante
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingAnunciante ? "Editar Anunciante" : "Nuevo Anunciante"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Nombre *</Label>
                <Input
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Nombre del contacto"
                  required
                />
              </div>

              <div>
                <Label>Empresa</Label>
                <Input
                  value={formData.empresa}
                  onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                  placeholder="Nombre de la empresa"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@ejemplo.com"
                  />
                </div>
                <div>
                  <Label>Teléfono</Label>
                  <Input
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    placeholder="+52 55 1234 5678"
                  />
                </div>
              </div>

              <div>
                <Label>Notas</Label>
                <Textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  placeholder="Notas sobre este cliente..."
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.activo}
                  onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                />
                <Label>Cliente Activo</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingAnunciante ? "Actualizar" : "Crear"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Cargando anunciantes...</div>
        ) : !anunciantes || anunciantes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay anunciantes registrados. Crea uno para poder asignarle descuentos.
          </div>
        ) : (
          <div className="space-y-4">
            {anunciantes.map((anunciante) => {
              const marcasAnunciante = getMarcasForAnunciante(anunciante.id);
              const isExpanded = expandedAnunciantes.has(anunciante.id);

              return (
                <Collapsible key={anunciante.id} open={isExpanded} onOpenChange={() => toggleExpanded(anunciante.id)}>
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </Button>
                        </CollapsibleTrigger>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {anunciante.nombre}
                            {anunciante.empresa && (
                              <span className="text-muted-foreground">- {anunciante.empresa}</span>
                            )}
                            <Badge variant={anunciante.activo ? "default" : "secondary"}>
                              {anunciante.activo ? "Activo" : "Inactivo"}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {anunciante.email} {anunciante.telefono && `• ${anunciante.telefono}`}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {marcasAnunciante.length} marca(s)
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(anunciante)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteAnuncianteMutation.mutate(anunciante.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <CollapsibleContent className="mt-4">
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium flex items-center gap-2">
                            <Tag className="w-4 h-4" />
                            Marcas
                          </h4>
                          <Dialog open={isMarcaDialogOpen && selectedAnuncianteForMarca === anunciante.id} 
                                  onOpenChange={(open) => {
                                    setIsMarcaDialogOpen(open);
                                    if (open) setSelectedAnuncianteForMarca(anunciante.id);
                                  }}>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <Plus className="w-3 h-3 mr-1" />
                                Agregar Marca
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Nueva Marca para {anunciante.nombre}</DialogTitle>
                              </DialogHeader>
                              <form
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  createMarcaMutation.mutate({
                                    anuncianteId: anunciante.id,
                                    data: marcaFormData,
                                  });
                                }}
                                className="space-y-4"
                              >
                                <div>
                                  <Label>Nombre de la Marca *</Label>
                                  <Input
                                    value={marcaFormData.nombre}
                                    onChange={(e) =>
                                      setMarcaFormData({ ...marcaFormData, nombre: e.target.value })
                                    }
                                    placeholder="Ej: Coca-Cola, Nike..."
                                    required
                                  />
                                </div>
                                <div>
                                  <Label>Descripción</Label>
                                  <Textarea
                                    value={marcaFormData.descripcion}
                                    onChange={(e) =>
                                      setMarcaFormData({ ...marcaFormData, descripcion: e.target.value })
                                    }
                                    placeholder="Descripción opcional..."
                                  />
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button type="button" variant="outline" onClick={() => setIsMarcaDialogOpen(false)}>
                                    Cancelar
                                  </Button>
                                  <Button type="submit">Crear Marca</Button>
                                </div>
                              </form>
                            </DialogContent>
                          </Dialog>
                        </div>

                        {marcasAnunciante.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Sin marcas registradas</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {marcasAnunciante.map((marca) => (
                              <Badge
                                key={marca.id}
                                variant="outline"
                                className="flex items-center gap-1 px-3 py-1"
                              >
                                {marca.nombre}
                                <button
                                  onClick={() => deleteMarcaMutation.mutate(marca.id)}
                                  className="ml-1 hover:text-destructive"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
