import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Billboard } from "@/hooks/useBillboards";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertTriangle,
  Calendar,
  MapPin,
  Eye,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface BusinessIntelligenceProps {
  billboards: Billboard[];
}

export function BusinessIntelligence({ billboards }: BusinessIntelligenceProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("monthly");

  // Cálculos de métricas
  const totalScreens = billboards.length;
  const activeScreens = billboards.filter(b => b.status === 'ocupada').length;
  const availableScreens = billboards.filter(b => b.status === 'disponible').length;
  const maintenanceScreens = billboards.filter(b => b.status === 'mantenimiento').length;

  // Simulación de datos financieros (en producción vendrían de reservas/contratos)
  const monthlyRevenue = 125000;
  const estimatedLosses = availableScreens * 2500; // Promedio mensual por pantalla
  const occupancyRate = totalScreens > 0 ? (activeScreens / totalScreens) * 100 : 0;
  
  // Pantallas de alta demanda (simulado - >80% ocupación)
  const highDemandScreens = billboards.filter(() => Math.random() > 0.7).length;

  // Datos para gráficas
  const monthlyData = [
    { month: 'Ene', revenue: 95000, screens: 85 },
    { month: 'Feb', revenue: 105000, screens: 90 },
    { month: 'Mar', revenue: 115000, screens: 95 },
    { month: 'Abr', revenue: 120000, screens: 98 },
    { month: 'May', revenue: 125000, screens: totalScreens },
  ];

  const screenTypeData = [
    { name: 'Digital', value: billboards.filter(b => b.tipo === 'digital').length, color: '#8B5CF6' },
    { name: 'Espectacular', value: billboards.filter(b => b.tipo === 'espectacular').length, color: '#06B6D4' },
    { name: 'Muro', value: billboards.filter(b => b.tipo === 'muro').length, color: '#10B981' },
    { name: 'Valla', value: billboards.filter(b => b.tipo === 'valla').length, color: '#F59E0B' },
    { name: 'Parabús', value: billboards.filter(b => b.tipo === 'parabus').length, color: '#EF4444' },
  ].filter(item => item.value > 0);

  // Top 5 pantallas más rentables (simulado)
  const topPerformingScreens = billboards
    .slice(0, 5)
    .map(screen => ({
      ...screen,
      revenue: Math.floor(Math.random() * 5000) + 2000,
      occupancy: Math.floor(Math.random() * 30) + 70
    }))
    .sort((a, b) => b.revenue - a.revenue);

  // Pantallas con bajo rendimiento
  const lowPerformingScreens = billboards
    .filter(() => Math.random() > 0.8)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ingresos del Mes</p>
                <p className="text-2xl font-bold">${monthlyRevenue.toLocaleString()}</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-500">+12.5%</span>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tasa de Ocupación</p>
                <p className="text-2xl font-bold">{occupancyRate.toFixed(1)}%</p>
                <div className="flex items-center mt-1">
                  <Target className="h-4 w-4 text-blue-500 mr-1" />
                  <span className="text-sm text-muted-foreground">{activeScreens}/{totalScreens} activas</span>
                </div>
              </div>
              <Eye className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pérdidas Estimadas</p>
                <p className="text-2xl font-bold">${estimatedLosses.toLocaleString()}</p>
                <div className="flex items-center mt-1">
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  <span className="text-sm text-red-500">{availableScreens} sin rentar</span>
                </div>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Alta Demanda</p>
                <p className="text-2xl font-bold">{highDemandScreens}</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-500">+80% ocupación</span>
                </div>
              </div>
              <MapPin className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="financial" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="financial">Finanzas</TabsTrigger>
          <TabsTrigger value="performance">Rendimiento</TabsTrigger>
          <TabsTrigger value="contracts">Contratos</TabsTrigger>
          <TabsTrigger value="analytics">Análisis</TabsTrigger>
        </TabsList>

        <TabsContent value="financial" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Ingresos Mensuales</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Ingresos']} />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribución por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={screenTypeData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {screenTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top 5 Pantallas Más Rentables</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topPerformingScreens.map((screen, index) => (
                    <div key={screen.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline">#{index + 1}</Badge>
                        <div>
                          <p className="font-medium">{screen.nombre}</p>
                          <p className="text-sm text-muted-foreground">{screen.direccion}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${screen.revenue.toLocaleString()}</p>
                        <p className="text-sm text-green-500">{screen.occupancy}% ocupación</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Bajo Rendimiento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {lowPerformingScreens.length > 0 ? (
                    lowPerformingScreens.map((screen) => (
                      <div key={screen.id} className="p-3 border border-red-200 rounded-lg bg-red-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{screen.nombre}</p>
                            <p className="text-sm text-muted-foreground">{screen.direccion}</p>
                          </div>
                          <Badge variant="destructive">Sin actividad</Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">¡Excelente! Todas las pantallas tienen buen rendimiento.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="contracts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Próximos Vencimientos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Pantalla Centro Comercial</p>
                      <p className="text-sm text-muted-foreground">Vence: 15 de Junio, 2024</p>
                    </div>
                    <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                      7 días restantes
                    </Badge>
                  </div>
                </div>
                
                <div className="p-4 border border-orange-200 rounded-lg bg-orange-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Espectacular Av. Principal</p>
                      <p className="text-sm text-muted-foreground">Vence: 20 de Junio, 2024</p>
                    </div>
                    <Badge variant="outline" className="text-orange-600 border-orange-600">
                      12 días restantes
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tendencia de Ocupación</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="screens" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}