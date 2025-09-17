import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useUserManagement, AuditLog } from '@/hooks/useUserManagement';
import { 
  Activity, 
  Search, 
  UserPlus, 
  UserMinus, 
  Edit, 
  Shield, 
  AlertTriangle,
  FileText,
  Download
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function AuditLogsPanel() {
  const { auditLogs, fetchAuditLogs, hasPermission } = useUserManagement();
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create_user':
        return <UserPlus className="h-4 w-4 text-green-600" />;
      case 'delete_user':
        return <UserMinus className="h-4 w-4 text-red-600" />;
      case 'update_user':
        return <Edit className="h-4 w-4 text-blue-600" />;
      case 'login':
        return <Shield className="h-4 w-4 text-primary" />;
      case 'logout':
        return <Shield className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActionBadge = (action: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      create_user: 'default',
      update_user: 'secondary',
      delete_user: 'destructive',
      login: 'outline',
      logout: 'outline'
    };

    const labels: Record<string, string> = {
      create_user: 'Usuario Creado',
      update_user: 'Usuario Actualizado',
      delete_user: 'Usuario Eliminado',
      login: 'Inicio de Sesión',
      logout: 'Cierre de Sesión',
      reset_password: 'Reset Contraseña',
      suspend_user: 'Usuario Suspendido',
      activate_user: 'Usuario Activado'
    };

    return (
      <Badge variant={variants[action.toLowerCase()] || 'outline'}>
        {labels[action.toLowerCase()] || action}
      </Badge>
    );
  };

  const formatDetails = (details: any) => {
    if (!details) return '';
    
    const entries = Object.entries(details).filter(([key, value]) => 
      value !== null && value !== undefined && value !== ''
    );
    
    if (entries.length === 0) return '';
    
    return entries.map(([key, value]) => 
      `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`
    ).join(', ');
  };

  const exportAuditLogs = () => {
    try {
      const csvData = filteredLogs.map(log => ({
        'Fecha': format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss'),
        'Usuario': log.profiles?.name || log.profiles?.email || 'Sistema',
        'Acción': log.action,
        'Tipo de Recurso': log.resource_type || '',
        'Detalles': formatDetails(log.details)
      }));

      const csv = [
        Object.keys(csvData[0]).join(','),
        ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting audit logs:', error);
    }
  };

  useEffect(() => {
    let filtered = auditLogs;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.profiles?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formatDetails(log.details).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by action
    if (actionFilter) {
      filtered = filtered.filter(log => log.action === actionFilter);
    }

    // Filter by date
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      filtered = filtered.filter(log => {
        const logDate = new Date(log.created_at);
        return logDate.toDateString() === filterDate.toDateString();
      });
    }

    setFilteredLogs(filtered);
  }, [auditLogs, searchTerm, actionFilter, dateFilter]);

  if (!hasPermission) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium text-muted-foreground">
            No tienes permisos para acceder a los registros de auditoría
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Registros de Auditoría</h1>
          <p className="text-muted-foreground">
            Historial completo de actividades del sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportAuditLogs}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={() => fetchAuditLogs(100)}>
            <Activity className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Buscar</label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar en acciones, usuarios o detalles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Acción</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las acciones" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  <SelectItem value="create_user">Usuario Creado</SelectItem>
                  <SelectItem value="update_user">Usuario Actualizado</SelectItem>
                  <SelectItem value="delete_user">Usuario Eliminado</SelectItem>
                  <SelectItem value="login">Inicio de Sesión</SelectItem>
                  <SelectItem value="logout">Cierre de Sesión</SelectItem>
                  <SelectItem value="reset_password">Reset Contraseña</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[180px]">
              <label className="text-sm font-medium mb-2 block">Fecha</label>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setActionFilter('');
                setDateFilter('');
              }}
            >
              Limpiar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Registros de Actividad ({filteredLogs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha y Hora</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Acción</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Detalles</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    No se encontraron registros
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="font-mono text-sm">
                        {format(new Date(log.created_at), 'dd/MM/yyyy', { locale: es })}
                        <br />
                        <span className="text-muted-foreground">
                          {format(new Date(log.created_at), 'HH:mm:ss')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {log.profiles?.name || 'Sistema'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {log.profiles?.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        {getActionBadge(log.action)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {log.resource_type || 'Sistema'}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="text-sm text-muted-foreground truncate">
                        {formatDetails(log.details) || 'Sin detalles'}
                      </p>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}