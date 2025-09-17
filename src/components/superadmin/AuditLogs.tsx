import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Search, Filter, Download, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  details: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [timeRange, setTimeRange] = useState("24h");
  const { toast } = useToast();

  useEffect(() => {
    loadLogs();
  }, [searchTerm, actionFilter, timeRange]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      
      let query = supabase.from('audit_logs').select('*');
      
      // Time range filter
      const now = new Date();
      let startDate = new Date();
      
      switch (timeRange) {
        case '1h':
          startDate.setHours(now.getHours() - 1);
          break;
        case '24h':
          startDate.setDate(now.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
      }
      
      query = query.gte('created_at', startDate.toISOString());

      if (searchTerm) {
        query = query.ilike('action', `%${searchTerm}%`);
      }
      
      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error loading audit logs:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los logs de auditoría",
          variant: "destructive",
        });
      } else {
        setLogs((data || []) as AuditLog[]);
      }
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) {
        throw error;
      }

      // Convert to CSV
      const headers = ['Fecha', 'Usuario', 'Acción', 'Recurso', 'IP', 'Detalles'];
      const csvContent = [
        headers.join(','),
        ...(data || []).map(log => [
          new Date(log.created_at).toLocaleString(),
          log.user_id || 'Sistema',
          log.action,
          log.resource_type || '',
          log.ip_address || '',
          JSON.stringify(log.details || {})
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Logs exportados",
        description: "Los logs de auditoría se han descargado exitosamente",
      });

    } catch (error: any) {
      console.error('Error exporting logs:', error);
      toast({
        title: "Error",
        description: "No se pudieron exportar los logs",
        variant: "destructive",
      });
    }
  };

  const getActionBadge = (action: string) => {
    const actionColors: { [key: string]: string } = {
      'user_created': 'bg-status-available/20 text-status-available',
      'user_updated': 'bg-status-confirmed/20 text-status-confirmed',
      'user_deleted': 'bg-destructive/20 text-destructive',
      'user_suspended': 'bg-destructive/20 text-destructive',
      'user_activated': 'bg-status-available/20 text-status-available',
      'password_reset_requested': 'bg-status-reserved/20 text-status-reserved',
      'role_permissions_updated': 'bg-primary/20 text-primary',
      'superadmin_login': 'bg-primary/20 text-primary'
    };

    return (
      <Badge className={actionColors[action] || 'bg-muted/20 text-muted-foreground'}>
        {action}
      </Badge>
    );
  };

  const formatDetails = (details: any) => {
    if (!details) return 'N/A';
    
    const detailsObj = typeof details === 'object' ? details : {};
    const keys = Object.keys(detailsObj);
    
    if (keys.length === 0) return 'Sin detalles';
    
    return keys.slice(0, 2).map(key => `${key}: ${detailsObj[key]}`).join(', ');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5" />
                <span>Logs de Auditoría</span>
              </CardTitle>
              <CardDescription>
                Registro de todas las actividades del sistema
              </CardDescription>
            </div>
            <Button onClick={exportLogs}>
              <Download className="w-4 h-4 mr-2" />
              Exportar Logs
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar por acción..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtrar por acción" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las acciones</SelectItem>
                <SelectItem value="user_created">Usuario creado</SelectItem>
                <SelectItem value="user_updated">Usuario actualizado</SelectItem>
                <SelectItem value="user_suspended">Usuario suspendido</SelectItem>
                <SelectItem value="password_reset_requested">Reset de contraseña</SelectItem>
                <SelectItem value="superadmin_login">Login superadmin</SelectItem>
              </SelectContent>
            </Select>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Periodo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Última hora</SelectItem>
                <SelectItem value="24h">Últimas 24h</SelectItem>
                <SelectItem value="7d">Últimos 7 días</SelectItem>
                <SelectItem value="30d">Últimos 30 días</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-8">Cargando logs de auditoría...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha/Hora</TableHead>
                  <TableHead>Acción</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Recurso</TableHead>
                  <TableHead>Detalles</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getActionBadge(log.action)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {log.user_id ? log.user_id.substring(0, 8) + '...' : 'Sistema'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {log.resource_type || 'N/A'}
                        {log.resource_id && (
                          <div className="text-xs text-muted-foreground">
                            {log.resource_id.substring(0, 8)}...
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm max-w-[200px] truncate">
                        {formatDetails(log.details)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {log.ip_address || 'N/A'}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          
          {!loading && logs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron logs de auditoría para el período seleccionado
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}