import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Download, Loader2, Database } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

export function DatabaseExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const tables = [
    { name: 'profiles', label: 'Perfiles' },
    { name: 'billboards', label: 'Pantallas' },
    { name: 'reservas', label: 'Reservas' },
    { name: 'campañas', label: 'Campañas' },
    { name: 'anunciantes', label: 'Anunciantes' },
    { name: 'agentes_venta', label: 'Agentes de Venta' },
    { name: 'codigos_descuento', label: 'Códigos de Descuento' },
    { name: 'bonificaciones', label: 'Bonificaciones' },
    { name: 'materiales_campana', label: 'Materiales de Campaña' },
    { name: 'notificaciones', label: 'Notificaciones' },
    { name: 'marcas', label: 'Marcas' },
    { name: 'renovaciones_campana', label: 'Renovaciones' },
    { name: 'audit_logs', label: 'Logs de Auditoría' },
  ];

  const exportDatabase = async () => {
    setIsExporting(true);
    setProgress(0);

    try {
      const workbook = XLSX.utils.book_new();
      let successCount = 0;

      for (let i = 0; i < tables.length; i++) {
        const table = tables[i];
        setProgress(Math.round(((i + 1) / tables.length) * 100));

        try {
          const { data, error } = await supabase
            .from(table.name as any)
            .select('*')
            .limit(10000);

          if (error) {
            console.warn(`Error fetching ${table.name}:`, error.message);
            continue;
          }

          if (data && data.length > 0) {
            // Flatten JSON columns for better readability
            const flattenedData = data.map((row: any) => {
              const flatRow: any = {};
              for (const [key, value] of Object.entries(row)) {
                if (typeof value === 'object' && value !== null) {
                  flatRow[key] = JSON.stringify(value);
                } else {
                  flatRow[key] = value;
                }
              }
              return flatRow;
            });

            const worksheet = XLSX.utils.json_to_sheet(flattenedData);
            
            // Auto-size columns
            const colWidths = Object.keys(flattenedData[0] || {}).map(key => ({
              wch: Math.max(key.length, 15)
            }));
            worksheet['!cols'] = colWidths;

            XLSX.utils.book_append_sheet(workbook, worksheet, table.label.substring(0, 31));
            successCount++;
          }
        } catch (tableError) {
          console.warn(`Skipping ${table.name}:`, tableError);
        }
      }

      if (successCount === 0) {
        toast.error('No se pudieron exportar datos. Verifica tus permisos.');
        return;
      }

      // Generate and download
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `database_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Base de datos exportada exitosamente (${successCount} tablas)`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Error al exportar la base de datos');
    } finally {
      setIsExporting(false);
      setProgress(0);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Exportar Base de Datos
        </CardTitle>
        <CardDescription>
          Descarga toda la información del sistema en un archivo Excel
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Se exportarán las siguientes tablas:
            <ul className="mt-2 grid grid-cols-2 gap-1">
              {tables.map(t => (
                <li key={t.name} className="text-xs">• {t.label}</li>
              ))}
            </ul>
          </div>

          {isExporting && (
            <div className="space-y-2">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Exportando... {progress}%
              </p>
            </div>
          )}

          <Button 
            onClick={exportDatabase} 
            disabled={isExporting}
            className="w-full"
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Descargar Excel
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
