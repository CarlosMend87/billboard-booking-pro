import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle } from "lucide-react";
import { Billboard } from "@/hooks/useBillboards";

interface FinancialSummaryProps {
  billboards: Billboard[];
}

export function FinancialSummary({ billboards }: FinancialSummaryProps) {
  // Calcular métricas financieras
  const calculateFinancials = () => {
    const currentMonth = new Date().getMonth();
    const ocupadas = billboards.filter(b => b.status === 'ocupada');
    const disponibles = billboards.filter(b => b.status === 'disponible');
    
    // Simulamos ingresos actuales basados en pantallas ocupadas
    const ingresosActuales = ocupadas.reduce((total, billboard) => {
      const precioObj = billboard.precio as any;
      const precio = precioObj?.mensual || precioObj?.dia * 30 || precioObj?.hora * 24 * 30 || 0;
      return total + precio;
    }, 0);

    // Estimamos pérdidas por pantallas no rentadas
    const perdidasEstimadas = disponibles.reduce((total, billboard) => {
      const precioObj = billboard.precio as any;
      const precio = precioObj?.mensual || precioObj?.dia * 30 || precioObj?.hora * 24 * 30 || 0;
      return total + precio;
    }, 0);

    // Calculamos pantallas con alta demanda (>80% ocupación simulada)
    const altaDemanda = billboards.filter(b => b.status === 'ocupada').length;
    const porcentajeOcupacion = (altaDemanda / billboards.length) * 100;

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