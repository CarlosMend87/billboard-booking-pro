import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Billboard } from "@/hooks/useBillboards";

interface PerformanceChartProps {
  billboards: Billboard[];
}

export function PerformanceChart({ billboards }: PerformanceChartProps) {
  // Datos simulados para los últimos 6 meses
  const monthlyData = [
    { mes: "Jul", ingresos: 85000, perdidas: 25000 },
    { mes: "Ago", ingresos: 92000, perdidas: 18000 },
    { mes: "Sep", ingresos: 78000, perdidas: 32000 },
    { mes: "Oct", ingresos: 105000, perdidas: 15000 },
    { mes: "Nov", ingresos: 98000, perdidas: 22000 },
    { mes: "Dic", ingresos: 115000, perdidas: 12000 },
  ];

  // Top 5 pantallas más rentables (simulado)
  const topBillboards = billboards
    .slice(0, 5)
    .map((billboard, index) => ({
      nombre: billboard.nombre,
      ingresos: (index + 1) * 15000 + Math.random() * 10000,
      roi: 85 + index * 5 + Math.random() * 10
    }))
    .sort((a, b) => b.ingresos - a.ingresos);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <Card>
        <CardHeader>
          <CardTitle>Ingresos vs Pérdidas (6 meses)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, ""]} />
              <Bar dataKey="ingresos" fill="hsl(var(--primary))" name="Ingresos" />
              <Bar dataKey="perdidas" fill="hsl(var(--destructive))" name="Pérdidas" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top pantallas con mas rentabilidad</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topBillboards.map((billboard, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">{billboard.nombre}</p>
                  <p className="text-sm text-muted-foreground">ROI: {billboard.roi.toFixed(1)}%</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">${billboard.ingresos.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">este mes</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}