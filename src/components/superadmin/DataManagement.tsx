import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Download, 
  Upload, 
  Database, 
  HardDrive, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  Trash2,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DatabaseExport } from "@/components/export/DatabaseExport";

export default function DataManagement() {
  const [backupProgress, setBackupProgress] = useState(0);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  
  const [systemStats, setSystemStats] = useState({
    totalUsers: 156,
    totalBillboards: 89,
    totalCampaigns: 234,
    totalReservations: 456,
    dbSize: "2.4 GB",
    storageUsed: "8.7 GB",
    storageTotal: "50 GB",
    lastBackup: "2025-01-15T10:30:00Z"
  });

  const { toast } = useToast();

  const createBackup = async () => {
    setIsBackingUp(true);
    setBackupProgress(0);

    try {
      // Simulate backup process
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setBackupProgress(i);
      }

      toast({
        title: "Backup creado",
        description: "El respaldo de la base de datos se ha completado exitosamente",
      });

      setSystemStats(prev => ({
        ...prev,
        lastBackup: new Date().toISOString()
      }));

    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear el backup de la base de datos",
        variant: "destructive",
      });
    } finally {
      setIsBackingUp(false);
      setBackupProgress(0);
    }
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportProgress(0);

    try {
      // Validate file type
      if (!file.name.endsWith('.csv') && !file.name.endsWith('.json')) {
        throw new Error('Formato de archivo no soportado. Use CSV o JSON.');
      }

      // Simulate import process
      for (let i = 0; i <= 100; i += 20) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setImportProgress(i);
      }

      toast({
        title: "Importación completada",
        description: `Se importaron los datos desde ${file.name} exitosamente`,
      });

    } catch (error: any) {
      toast({
        title: "Error de importación",
        description: error.message || "No se pudo importar el archivo",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      setImportProgress(0);
      // Reset file input
      event.target.value = '';
    }
  };

  const exportData = async (dataType: string) => {
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create sample CSV data
      let csvContent = '';
      switch (dataType) {
        case 'users':
          csvContent = 'ID,Name,Email,Role,Status\n1,Juan Pérez,juan@example.com,advertiser,active\n2,María García,maria@example.com,owner,active';
          break;
        case 'billboards':
          csvContent = 'ID,Name,Location,Type,Status\n1,Billboard 1,Mexico City,digital,available\n2,Billboard 2,Guadalajara,traditional,occupied';
          break;
        case 'campaigns':
          csvContent = 'ID,Name,Budget,Status,Start Date\n1,Campaign A,5000,active,2025-01-15\n2,Campaign B,3000,completed,2025-01-10';
          break;
        default:
          csvContent = 'No data available';
      }

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${dataType}-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Datos exportados",
        description: `Los datos de ${dataType} se han descargado exitosamente`,
      });

    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo exportar los datos",
        variant: "destructive",
      });
    }
  };

  const cleanupOldData = async () => {
    try {
      // Simulate cleanup process
      await new Promise(resolve => setTimeout(resolve, 3000));

      toast({
        title: "Limpieza completada",
        description: "Se eliminaron los datos obsoletos y archivos temporales",
      });

    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo completar la limpieza de datos",
        variant: "destructive",
      });
    }
  };

  const storagePercentage = (parseFloat(systemStats.storageUsed) / parseFloat(systemStats.storageTotal)) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="w-5 h-5" />
            <span>Gestión de Datos</span>
          </CardTitle>
          <CardDescription>
            Backup, importación, exportación y mantenimiento de datos
          </CardDescription>
        </CardHeader>
      </Card>

      {/* System Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Estadísticas del Sistema</CardTitle>
          <CardDescription>
            Información general sobre los datos almacenados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary">{systemStats.totalUsers}</div>
              <div className="text-sm text-muted-foreground">Usuarios</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary">{systemStats.totalBillboards}</div>
              <div className="text-sm text-muted-foreground">Vallas</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary">{systemStats.totalCampaigns}</div>
              <div className="text-sm text-muted-foreground">Campañas</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary">{systemStats.totalReservations}</div>
              <div className="text-sm text-muted-foreground">Reservas</div>
            </div>
          </div>

          {/* Storage Usage */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="flex items-center space-x-2">
                  <HardDrive className="w-4 h-4" />
                  <span>Uso de Almacenamiento</span>
                </Label>
                <span className="text-sm text-muted-foreground">
                  {systemStats.storageUsed} / {systemStats.storageTotal}
                </span>
              </div>
              <Progress value={storagePercentage} className="h-2" />
              <div className="text-xs text-muted-foreground mt-1">
                {storagePercentage.toFixed(1)}% utilizado
              </div>
            </div>
            
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-muted-foreground" />
                <span>Base de datos: {systemStats.dbSize}</span>
              </div>
              <Badge variant="outline">
                Último backup: {new Date(systemStats.lastBackup).toLocaleDateString()}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Backup & Restore */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Download className="w-5 h-5" />
            <span>Backup y Restauración</span>
          </CardTitle>
          <CardDescription>
            Crear respaldos de seguridad y restaurar datos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <CheckCircle className="h-4 w-4 text-status-available" />
            <AlertDescription>
              Se recomienda realizar backups automáticos cada 24 horas. 
              Último backup: {new Date(systemStats.lastBackup).toLocaleString()}
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Crear Backup Completo</h4>
                <p className="text-sm text-muted-foreground">
                  Incluye usuarios, vallas, campañas y configuración
                </p>
              </div>
              <Button 
                onClick={createBackup} 
                disabled={isBackingUp}
                className="w-32"
              >
                {isBackingUp ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    {backupProgress}%
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Crear Backup
                  </>
                )}
              </Button>
            </div>

            {isBackingUp && (
              <Progress value={backupProgress} className="h-2" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Database Export - Excel completo */}
      <DatabaseExport />

      {/* Data Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Exportación de Datos (CSV)</span>
          </CardTitle>
          <CardDescription>
            Exportar datos específicos en formato CSV
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg space-y-3">
              <h4 className="font-medium">Usuarios</h4>
              <p className="text-sm text-muted-foreground">
                Exportar lista completa de usuarios registrados
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => exportData('users')}
                className="w-full"
              >
                <Download className="w-3 h-3 mr-2" />
                Exportar Usuarios
              </Button>
            </div>

            <div className="p-4 border rounded-lg space-y-3">
              <h4 className="font-medium">Vallas Publicitarias</h4>
              <p className="text-sm text-muted-foreground">
                Exportar inventario de espacios publicitarios
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => exportData('billboards')}
                className="w-full"
              >
                <Download className="w-3 h-3 mr-2" />
                Exportar Vallas
              </Button>
            </div>

            <div className="p-4 border rounded-lg space-y-3">
              <h4 className="font-medium">Campañas</h4>
              <p className="text-sm text-muted-foreground">
                Exportar historial de campañas publicitarias
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => exportData('campaigns')}
                className="w-full"
              >
                <Download className="w-3 h-3 mr-2" />
                Exportar Campañas
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Import */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="w-5 h-5" />
            <span>Importación de Datos</span>
          </CardTitle>
          <CardDescription>
            Importar datos desde archivos CSV o JSON
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              La importación de datos reemplazará los registros existentes. 
              Se recomienda crear un backup antes de proceder.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div>
              <Label htmlFor="file-import">Seleccionar archivo (CSV o JSON)</Label>
              <Input
                id="file-import"
                type="file"
                accept=".csv,.json"
                onChange={handleFileImport}
                disabled={isImporting}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Formatos soportados: CSV, JSON (máximo 10MB)
              </p>
            </div>

            {isImporting && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Importando datos...</span>
                  <span className="text-sm">{importProgress}%</span>
                </div>
                <Progress value={importProgress} className="h-2" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* System Maintenance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trash2 className="w-5 h-5" />
            <span>Mantenimiento del Sistema</span>
          </CardTitle>
          <CardDescription>
            Herramientas de limpieza y optimización
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Limpiar datos obsoletos</h4>
                <p className="text-sm text-muted-foreground">
                  Eliminar logs antiguos, archivos temporales y datos no utilizados
                </p>
              </div>
              <Button variant="outline" onClick={cleanupOldData}>
                <Trash2 className="w-4 h-4 mr-2" />
                Limpiar Sistema
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Optimizar base de datos</h4>
                <p className="text-sm text-muted-foreground">
                  Reorganizar índices y mejorar el rendimiento
                </p>
              </div>
              <Button variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Optimizar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}