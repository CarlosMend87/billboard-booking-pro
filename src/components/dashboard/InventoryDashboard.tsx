import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  BarChart3,
  Monitor,
  Building2,
  MapPin,
  TrendingUp,
  Calendar,
  Activity,
  Target
} from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

// Mock data para el dashboard de inventario
const mockInventoryData = {
  total_anuncios: 2450,
  disponibles: 980,
  reservados: 720,
  ocupados: 750,
  por_ubicacion: {
    "CDMX": 850,
    "Guadalajara": 420,
    "Monterrey": 380,
    "Puebla": 280,
    "Tijuana": 210,
    "Mérida": 180,
    "Querétaro": 130
  },
  por_tipo: {
    "Espectaculares": 820,
    "Pantallas Digitales": 650,
    "Mupis": 480,
    "Vallas": 320,
    "Pantallas LED": 180
  },
  tendencia_semanal: [
    { semana: "S1", disponibles: 920, reservados: 680 },
    { semana: "S2", disponibles: 940, reservados: 700 },
    { semana: "S3", disponibles: 960, reservados: 710 },
    { semana: "S4", disponibles: 980, reservados: 720 }
  ]
}

const ubicacionesData = Object.entries(mockInventoryData.por_ubicacion).map(([ciudad, cantidad]) => ({
  ciudad,
  cantidad
}))

const tiposData = Object.entries(mockInventoryData.por_tipo).map(([tipo, cantidad]) => ({
  tipo,
  cantidad
}))

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))', 'hsl(var(--border))']

export function InventoryDashboard() {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-MX').format(num)
  }

  const getStatusPercentage = (value: number) => {
    return ((value / mockInventoryData.total_anuncios) * 100).toFixed(1)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Dashboard de Inventario</h2>
      </div>

      {/* Resumen General */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-500" />
              Total de Anuncios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatNumber(mockInventoryData.total_anuncios)}
            </div>
            <p className="text-xs text-muted-foreground">En toda la red</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-green-500" />
              Disponibles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatNumber(mockInventoryData.disponibles)}
            </div>
            <p className="text-xs text-muted-foreground">
              {getStatusPercentage(mockInventoryData.disponibles)}% del total
            </p>
            <Progress value={parseFloat(getStatusPercentage(mockInventoryData.disponibles))} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-yellow-500" />
              Reservados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatNumber(mockInventoryData.reservados)}
            </div>
            <p className="text-xs text-muted-foreground">
              {getStatusPercentage(mockInventoryData.reservados)}% del total
            </p>
            <Progress value={parseFloat(getStatusPercentage(mockInventoryData.reservados))} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-red-500" />
              Ocupados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatNumber(mockInventoryData.ocupados)}
            </div>
            <p className="text-xs text-muted-foreground">
              {getStatusPercentage(mockInventoryData.ocupados)}% del total
            </p>
            <Progress value={parseFloat(getStatusPercentage(mockInventoryData.ocupados))} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Gráficos de Distribución */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución por Ubicación */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Distribución por Ubicación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ubicacionesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="ciudad" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip formatter={(value) => [formatNumber(value as number), 'Anuncios']} />
                <Bar dataKey="cantidad" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribución por Tipo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-primary" />
              Distribución por Tipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={tiposData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ tipo, percent }) => `${tipo} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="cantidad"
                >
                  {tiposData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [formatNumber(value as number), 'Anuncios']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tendencia Semanal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Tendencia de Disponibilidad (Últimas 4 semanas)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mockInventoryData.tendencia_semanal}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="semana" />
              <YAxis />
              <Tooltip formatter={(value) => [formatNumber(value as number), 'Anuncios']} />
              <Bar dataKey="disponibles" fill="hsl(var(--primary))" name="Disponibles" />
              <Bar dataKey="reservados" fill="hsl(var(--secondary))" name="Reservados" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Resumen por Tipo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Inventario por Tipo de Anuncio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(mockInventoryData.por_tipo).map(([tipo, cantidad]) => (
              <Card key={tipo} className="border-dashed">
                <CardContent className="pt-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-primary">{formatNumber(cantidad)}</div>
                    <p className="text-sm text-muted-foreground font-medium">{tipo}</p>
                    <Badge variant="secondary" className="mt-1">
                      {((cantidad / mockInventoryData.total_anuncios) * 100).toFixed(1)}% del total
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}