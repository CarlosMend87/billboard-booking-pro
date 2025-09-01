import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText, FileSpreadsheet } from "lucide-react";
import { Billboard } from "@/hooks/useBillboards";
import { useToast } from "@/hooks/use-toast";

interface ExportReportsProps {
  billboards: Billboard[];
}

export function ExportReports({ billboards }: ExportReportsProps) {
  const { toast } = useToast();

  const generateCSVData = (type: 'billboards' | 'financials' | 'contracts') => {
    switch (type) {
      case 'billboards':
        const headers = ['Nombre', 'Dirección', 'Tipo', 'Estado', 'Precio Mensual'];
        const rows = billboards.map(billboard => [
          billboard.nombre,
          billboard.direccion,
          billboard.tipo,
          billboard.status,
          (billboard.precio as any)?.mensual || 'N/A'
        ]);
        return [headers, ...rows];
      
      case 'financials':
        return [
          ['Mes', 'Ingresos', 'Pérdidas', 'ROI'],
          ['Enero', '85000', '25000', '85%'],
          ['Febrero', '92000', '18000', '90%'],
          ['Marzo', '78000', '32000', '75%'],
          ['Abril', '105000', '15000', '95%'],
          ['Mayo', '98000', '22000', '88%'],
          ['Junio', '115000', '12000', '97%']
        ];
      
      case 'contracts':
        return [
          ['Pantalla', 'Cliente', 'Fecha Inicio', 'Fecha Fin', 'Monto'],
          ...billboards.filter(b => b.status === 'ocupada').map(billboard => [
            billboard.nombre,
            'Cliente Ejemplo',
            '2024-01-01',
            '2024-12-31',
            (billboard.precio as any)?.mensual || 'N/A'
          ])
        ];
    }
  };

  const downloadCSV = (data: any[][], filename: string) => {
    const csvContent = data.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Reporte Exportado",
      description: `${filename}.csv se ha descargado correctamente`,
    });
  };

  const generatePDFReport = (type: string) => {
    // Simular generación de PDF
    toast({
      title: "Generando PDF",
      description: `El reporte ${type} se está preparando para descarga`,
    });
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Exportar Reportes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium">Listado de Pantallas</h4>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => downloadCSV(generateCSVData('billboards'), 'pantallas')}
                className="flex-1"
              >
                <FileSpreadsheet className="h-4 w-4 mr-1" />
                Excel
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => generatePDFReport('pantallas')}
                className="flex-1"
              >
                <FileText className="h-4 w-4 mr-1" />
                PDF
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Reporte Financiero</h4>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => downloadCSV(generateCSVData('financials'), 'finanzas')}
                className="flex-1"
              >
                <FileSpreadsheet className="h-4 w-4 mr-1" />
                Excel
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => generatePDFReport('finanzas')}
                className="flex-1"
              >
                <FileText className="h-4 w-4 mr-1" />
                PDF
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Contratos Activos</h4>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => downloadCSV(generateCSVData('contracts'), 'contratos')}
                className="flex-1"
              >
                <FileSpreadsheet className="h-4 w-4 mr-1" />
                Excel
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => generatePDFReport('contratos')}
                className="flex-1"
              >
                <FileText className="h-4 w-4 mr-1" />
                PDF
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}