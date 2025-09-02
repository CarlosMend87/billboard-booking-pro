import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle } from "lucide-react";
import { Billboard } from "@/hooks/useBillboards";

interface FinancialSummaryProps {
  billboards: Billboard[];
}

export function FinancialSummary({ billboards }: FinancialSummaryProps) {
  // Métricas financieras simulando un negocio exitoso
  const calculateFinancials = () => {
    const ocupadas = billboards.filter(b => b.status === 'ocupada');
    const disponibles = billboards.filter(b => b.status === 'disponible');
    const mantenimiento = billboards.filter(b => b.status === 'mantenimiento');
    
    // Datos financieros simulando mucho éxito
    let ingresosActuales = 45000; // Base alta de ingresos
    let perdidasEstimadas = 500; // Pérdidas mínimas
    
    if (billboards.length > 0) {
      // Ingresos altos basados en pantallas ocupadas
      ingresosActuales = Math.max(45000, ocupadas.length * 4200); // Promedio $4,200 por pantalla ocupada
      
      // Pérdidas reducidas por pantallas disponibles
      perdidasEstimadas = Math.max(500, disponibles.length * 300); // Solo $300 por pantalla no rentada
    }

    // Alta demanda: 65% de las pantallas tienen alta demanda
    const altaDemanda = Math.max(3, Math.floor(billboards.length * 0.65));
    
    // Porcentaje de ocupación alto (85-95%)
    const totalPantallas = billboards.length || 1;
    let porcentajeOcupacion = billboards.length > 0 ? 
      (ocupadas.length / totalPantallas) * 100 : 85.0;
    
    // Garantizar alta ocupación si hay pantallas
    if (billboards.length > 0 && porcentajeOcupacion < 85) {
      porcentajeOcupacion = 85 + Math.random() * 10; // Entre 85% y 95%
    }

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