import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAgentPermissions, AGENT_ROLE_LABELS, AGENT_ROLE_DESCRIPTIONS, AgentRole, AgentRoleOrNull } from '@/hooks/useAgentPermissions';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Pencil, Shield, ShieldCheck, Eye, Calendar, UserCog, Users } from 'lucide-react';

interface Agent {
  id: string;
  nombre_completo: string;
  email: string;
  telefono: string | null;
  codigo_agente: string;
  rol_agente: AgentRoleOrNull;
  activo: boolean;
  created_at: string;
}

const ROLE_ICONS: Record<string, React.ReactNode> = {
  administrador: <ShieldCheck className="h-4 w-4" />,
  aprobador: <Shield className="h-4 w-4" />,
  gestor_disponibilidad: <Calendar className="h-4 w-4" />,
  supervisor: <Eye className="h-4 w-4" />,
};

const ROLE_COLORS: Record<string, string> = {
  administrador: 'bg-red-100 text-red-800 border-red-200',
  aprobador: 'bg-blue-100 text-blue-800 border-blue-200',
  gestor_disponibilidad: 'bg-green-100 text-green-800 border-green-200',
  supervisor: 'bg-gray-100 text-gray-800 border-gray-200',
};

export function AgentRoleManager() {
  const { user } = useAuth();
  const { isOwner, hasPermission, loading: permLoading } = useAgentPermissions();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [formData, setFormData] = useState({
    nombre_completo: '',
    email: '',
    telefono: '',
    codigo_agente: '',
    rol_agente: 'supervisor' as AgentRole,
    password: '',
  });

  const canManageAgents = isOwner || hasPermission('manage_agents');

  useEffect(() => {
    if (!permLoading) {
      loadAgents();
    }
  }, [user, permLoading]);

  const loadAgents = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('agentes_venta')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAgents((data as Agent[]) || []);
    } catch (error: any) {
      console.error('Error loading agents:', error);
      toast.error('Error al cargar agentes');
    } finally {
      setLoading(false);
    }
  };

  const generateAgentCode = () => {
    const prefix = 'AG';
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${random}`;
  };

  const handleOpenDialog = (agent?: Agent) => {
    if (agent) {
      setEditingAgent(agent);
      setFormData({
        nombre_completo: agent.nombre_completo,
        email: agent.email,
        telefono: agent.telefono || '',
        codigo_agente: agent.codigo_agente,
        rol_agente: agent.rol_agente,
        password: '',
      });
    } else {
      setEditingAgent(null);
      setFormData({
        nombre_completo: '',
        email: '',
        telefono: '',
        codigo_agente: generateAgentCode(),
        rol_agente: 'supervisor',
        password: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!user) return;

    try {
      if (editingAgent) {
        // Update existing agent
        const { error } = await supabase
          .from('agentes_venta')
          .update({
            nombre_completo: formData.nombre_completo,
            telefono: formData.telefono || null,
            rol_agente: formData.rol_agente,
          })
          .eq('id', editingAgent.id);

        if (error) throw error;
        toast.success('Agente actualizado correctamente');
      } else {
        // Create new agent via edge function
        const { data, error } = await supabase.functions.invoke('create-agent-user', {
          body: {
            email: formData.email,
            password: formData.password,
            nombre_completo: formData.nombre_completo,
            telefono: formData.telefono || null,
            codigo_agente: formData.codigo_agente,
            owner_id: user.id,
            rol_agente: formData.rol_agente,
          },
        });

        if (error) throw error;
        if (!data.success) throw new Error(data.error);

        toast.success('Agente creado correctamente. Se le envió un email con sus credenciales.');
      }

      setIsDialogOpen(false);
      loadAgents();
    } catch (error: any) {
      console.error('Error saving agent:', error);
      toast.error(error.message || 'Error al guardar agente');
    }
  };

  const handleToggleActive = async (agent: Agent) => {
    try {
      const { error } = await supabase
        .from('agentes_venta')
        .update({ activo: !agent.activo })
        .eq('id', agent.id);

      if (error) throw error;
      toast.success(agent.activo ? 'Agente desactivado' : 'Agente activado');
      loadAgents();
    } catch (error: any) {
      console.error('Error toggling agent:', error);
      toast.error('Error al cambiar estado del agente');
    }
  };

  if (!canManageAgents) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gestión de Agentes
          </CardTitle>
          <CardDescription>No tienes permisos para gestionar agentes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Solo los administradores pueden gestionar agentes.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Gestión de Agentes con Roles
          </CardTitle>
          <CardDescription>
            Administra los agentes de tu empresa y asigna roles con permisos específicos
          </CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Agente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingAgent ? 'Editar Agente' : 'Crear Nuevo Agente'}
              </DialogTitle>
              <DialogDescription>
                {editingAgent 
                  ? 'Modifica los datos y el rol del agente'
                  : 'Ingresa los datos del nuevo agente. Se le enviará un email con sus credenciales.'
                }
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nombre Completo *</Label>
                <Input
                  value={formData.nombre_completo}
                  onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
                  placeholder="Juan Pérez"
                />
              </div>

              {!editingAgent && (
                <>
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="agente@empresa.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Contraseña Temporal *</Label>
                    <Input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Mínimo 8 caracteres"
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  placeholder="+52 123 456 7890"
                />
              </div>

              <div className="space-y-2">
                <Label>Código de Agente</Label>
                <Input
                  value={formData.codigo_agente}
                  onChange={(e) => setFormData({ ...formData, codigo_agente: e.target.value })}
                  disabled={!!editingAgent}
                />
              </div>

              <div className="space-y-2">
                <Label>Rol del Agente *</Label>
                <Select
                  value={formData.rol_agente || 'supervisor'}
                  onValueChange={(value) => setFormData({ ...formData, rol_agente: value as AgentRole })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(AGENT_ROLE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        <div className="flex items-center gap-2">
                          {ROLE_ICONS[value]}
                          <span>{label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.rol_agente && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {AGENT_ROLE_DESCRIPTIONS[formData.rol_agente]}
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={!formData.nombre_completo || (!editingAgent && (!formData.email || !formData.password))}
              >
                {editingAgent ? 'Guardar Cambios' : 'Crear Agente'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="text-center py-8">Cargando agentes...</div>
        ) : agents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay agentes registrados.</p>
            <p className="text-sm">Crea tu primer agente para delegar tareas.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agente</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{agent.nombre_completo}</p>
                      <p className="text-sm text-muted-foreground">{agent.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {agent.codigo_agente}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={`flex items-center gap-1 w-fit ${ROLE_COLORS[agent.rol_agente || 'supervisor']}`}
                    >
                      {ROLE_ICONS[agent.rol_agente || 'supervisor']}
                      {AGENT_ROLE_LABELS[agent.rol_agente || 'supervisor']}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={agent.activo}
                        onCheckedChange={() => handleToggleActive(agent)}
                      />
                      <span className={agent.activo ? 'text-green-600' : 'text-red-600'}>
                        {agent.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(agent)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
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
