import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Clock, TrendingUp, Calendar } from "lucide-react";
import { Billboard } from "@/hooks/useBillboards";

interface AlertsPanelProps {
  billboards: Billboard[];
}

export function AlertsPanel({ billboards }: AlertsPanelProps) {
  // Simular alertas basadas en las pantallas
  const generateAlerts = () => {
    const alerts = [];
    
    // Pantallas sin renta por más de 30 días
    const sinRenta = billboards.filter(b => b.status === 'disponible').slice(0, 2);
    sinRenta.forEach(billboard => {
      alerts.push({
        tipo: 'sin_renta',
        titulo: 'Pantalla sin rentar',
        descripcion: `${billboard.nombre} lleva más de 30 días sin renta`,
        urgencia: 'alta',
        icono: AlertTriangle
      });
    });

    // Contratos próximos a vencer (simulado)
    const proximosVencimientos = billboards.filter(b => b.status === 'ocupada').slice(0, 1);
    proximosVencimientos.forEach(billboard => {
      alerts.push({
        tipo: 'vencimiento',
        titulo: 'Contrato próximo a vencer',
        descripcion: `${billboard.nombre} vence en 5 días`,
        urgencia: 'media',
        icono: Calendar
      });
    });

    // Pantallas con alta frecuencia de renta
    const altaFrecuencia = billboards.filter(b => b.status === 'ocupada').slice(0, 1);
    altaFrecuencia.forEach(billboard => {
      alerts.push({
        tipo: 'alta_demanda',
        titulo: 'Candidata a ajuste de precio',
        descripcion: `${billboard.nombre} tiene alta frecuencia de renta`,
        urgencia: 'baja',
        icono: TrendingUp
      });
    });

    return alerts;
  };

  const alerts = generateAlerts();

  const getUrgencyColor = (urgencia: string) => {
    switch (urgencia) {
      case 'alta': return 'destructive';
      case 'media': return 'default';
      case 'baja': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Alertas Automáticas
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No hay alertas pendientes
          </p>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert, index) => {
              const IconComponent = alert.icono;
              return (
                <Alert key={index}>
                  <IconComponent className="h-4 w-4" />
                  <div className="flex items-center justify-between w-full">
                    <div>
                      <h4 className="font-medium">{alert.titulo}</h4>
                      <AlertDescription>{alert.descripcion}</AlertDescription>
                    </div>
                    <Badge variant={getUrgencyColor(alert.urgencia)}>
                      {alert.urgencia}
                    </Badge>
                  </div>
                </Alert>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}