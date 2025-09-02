import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle } from "lucide-react";
import { Billboard } from "@/hooks/useBillboards";

interface FinancialSummaryProps {
  billboards: Billboard[];
}

export function FinancialSummary({ billboards }: FinancialSummaryProps) {
  // Métricas financieras con datos más realistas
  const calculateFinancials = () => {
    const ocupadas = billboards.filter(b => b.status === 'ocupada');
    const disponibles = billboards.filter(b => b.status === 'disponible');
    const mantenimiento = billboards.filter(b => b.status === 'mantenimiento');
    
    // Datos financieros más realistas
    let ingresosActuales = 0;
    let perdidasEstimadas = 1000; // Base mínima de pérdidas
    
    if (billboards.length > 0) {
      // Ingresos basados en pantallas ocupadas con precios más realistas
      ingresosActuales = ocupadas.length * 2500; // Promedio $2,500 por pantalla ocupada
      
      // Pérdidas por pantallas disponibles
      perdidasEstimadas = disponibles.length * 800; // $800 por pantalla no rentada
      if (perdidasEstimadas < 1000) perdidasEstimadas = 1000; // Mínimo $1,000
    }

    // Alta demanda: pantallas con >80% ocupación (simulado)
    const altaDemanda = Math.floor(billboards.length * 0.1); // 10% aproximado
    
    // Porcentaje de ocupación
    const totalPantallas = billboards.length || 1; // Evitar división por 0
    const porcentajeOcupacion = billboards.length > 0 ? 
      (ocupadas.length / totalPantallas) * 100 : 0.0;

    return {
      ingresosActuales,
      perdidasEstimadas,
      altaDemanda,
      porcentajeOcupacion
    };
  };

  const metrics = calculateFinancials();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
          <DollarSign className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            ${metrics.ingresosActuales.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            +12% vs mes anterior
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pérdidas Estimadas</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            ${metrics.perdidasEstimadas.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Pantallas sin rentar
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Alta Demanda</CardTitle>
          <TrendingUp className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">
            {metrics.altaDemanda}
          </div>
          <p className="text-xs text-muted-foreground">
            &gt;80% ocupación
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">% Ocupación</CardTitle>
          <AlertTriangle className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {metrics.porcentajeOcupacion.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">
            Total del inventario
          </p>
        </CardContent>
      </Card>
    </div>
  );
}