import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useAgentes, CreateAgente, Agente } from '@/hooks/useAgentes';
import { Plus, Edit2, Trash2, Mail, Phone, Hash, Percent, DollarSign } from 'lucide-react';

export function AgentesManagement() {
  const { agentes, loading, createAgente, updateAgente, deleteAgente } = useAgentes();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAgente, setSelectedAgente] = useState<Agente | null>(null);
  const [formData, setFormData] = useState<CreateAgente>({
    nombre_completo: '',
    email: '',
    telefono: '',
    codigo_agente: '',
    comision_porcentaje: undefined,
    comision_monto_fijo: undefined,
  });

  const resetForm = () => {
    setFormData({
      nombre_completo: '',
      email: '',
      telefono: '',
      codigo_agente: '',
      comision_porcentaje: undefined,
      comision_monto_fijo: undefined,
    });
    setSelectedAgente(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (selectedAgente) {
        await updateAgente(selectedAgente.id, formData);
      } else {
        await createAgente(formData);
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleEdit = (agente: Agente) => {
    setSelectedAgente(agente);
    setFormData({
      nombre_completo: agente.nombre_completo,
      email: agente.email,
      telefono: agente.telefono || '',
      codigo_agente: agente.codigo_agente,
      comision_porcentaje: agente.comision_porcentaje || undefined,
      comision_monto_fijo: agente.comision_monto_fijo || undefined,
    });
    setIsDialogOpen(true);
  };

  const handleToggleActivo = async (agente: Agente) => {
    await updateAgente(agente.id, { activo: !agente.activo });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Agentes de Venta</h2>
          <p className="text-muted-foreground">Gestiona tu equipo de ventas</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Agente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedAgente ? 'Editar Agente' : 'Nuevo Agente'}</DialogTitle>
              <DialogDescription>
                {selectedAgente ? 'Actualiza la información del agente' : 'Agrega un nuevo agente a tu equipo'}
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
                  <Label htmlFor="codigo_agente">Código de Agente *</Label>
                  <Input
                    id="codigo_agente"
                    value={formData.codigo_agente}
                    onChange={(e) => setFormData({ ...formData, codigo_agente: e.target.value })}
                    placeholder="AG001"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="comision_porcentaje">Comisión (%)</Label>
                  <Input
                    id="comision_porcentaje"
                    type="number"
                    step="0.01"
                    value={formData.comision_porcentaje || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      comision_porcentaje: e.target.value ? parseFloat(e.target.value) : undefined 
                    })}
                    placeholder="5.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comision_monto_fijo">Comisión Fija (MXN)</Label>
                  <Input
                    id="comision_monto_fijo"
                    type="number"
                    step="0.01"
                    value={formData.comision_monto_fijo || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      comision_monto_fijo: e.target.value ? parseFloat(e.target.value) : undefined 
                    })}
                    placeholder="1000"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {selectedAgente ? 'Actualizar' : 'Crear'} Agente
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : agentes.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Plus className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay agentes</h3>
            <p className="text-muted-foreground mb-4">
              Comienza agregando tu primer agente de venta
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Agente
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {agentes.map((agente) => (
            <Card key={agente.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {agente.nombre_completo}
                      {agente.activo ? (
                        <Badge className="bg-green-500">Activo</Badge>
                      ) : (
                        <Badge variant="secondary">Inactivo</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Hash className="h-3 w-3" />
                      {agente.codigo_agente}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(agente)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar agente?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente a {agente.nombre_completo}.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteAgente(agente.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="flex items-center gap-1 text-muted-foreground mb-1">
                      <Mail className="h-3 w-3" />
                      <span>Email</span>
                    </div>
                    <p className="font-medium">{agente.email}</p>
                  </div>
                  {agente.telefono && (
                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground mb-1">
                        <Phone className="h-3 w-3" />
                        <span>Teléfono</span>
                      </div>
                      <p className="font-medium">{agente.telefono}</p>
                    </div>
                  )}
                  {agente.comision_porcentaje && (
                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground mb-1">
                        <Percent className="h-3 w-3" />
                        <span>Comisión %</span>
                      </div>
                      <p className="font-medium">{agente.comision_porcentaje}%</p>
                    </div>
                  )}
                  {agente.comision_monto_fijo && (
                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground mb-1">
                        <DollarSign className="h-3 w-3" />
                        <span>Comisión Fija</span>
                      </div>
                      <p className="font-medium">${agente.comision_monto_fijo.toLocaleString()}</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                  <Switch
                    checked={agente.activo}
                    onCheckedChange={() => handleToggleActivo(agente)}
                  />
                  <Label>{agente.activo ? 'Agente activo' : 'Agente inactivo'}</Label>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
