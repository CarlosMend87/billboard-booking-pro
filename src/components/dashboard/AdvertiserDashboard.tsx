import { useMemo, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendingUp, 
  Calendar, 
  DollarSign,
  BarChart3,
  Activity,
  Target,
  Clock,
  CheckCircle2,
  Eye,
  Users,
  Repeat,
  MousePointer,
  MapPin,
  AlertTriangle,
  TrendingDown
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
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'

interface Campaign {
  id: string
  nombre: string
  presupuesto_total: number
  presupuesto_usado: number
  dias_totales: number
  dias_transcurridos: number
  fecha_inicio: string
  fecha_fin: string
  status: string
  reserva_id: string
}

// Mock data para el dashboard
const mockCampaignData = {
  impresiones: 1200000,
  alcance: 450000,
  frecuencia: 2.7,
  cpm: 85.50,
  ctr: 1.8,
  dias_transcurridos: 12,
  dias_contratados: 30,
  progreso: 40,
  ubicaciones: {
    "CDMX": 500000,
    "Guadalajara": 300000,
    "Monterrey": 200000,
    "Puebla": 120000,
    "Tijuana": 80000
  },
  horarios: {
    "06:00-12:00": 300000,
    "12:00-18:00": 600000,
    "18:00-00:00": 300000
  },
  historico: [
    { mes: "Ene", campaña_actual: 1200000, promedio_anterior: 800000 },
    { mes: "Feb", campaña_actual: 1150000, promedio_anterior: 950000 },
    { mes: "Mar", campaña_actual: 1300000, promedio_anterior: 1000000 }
  ],
  alertas: [
    { tipo: "warning", mensaje: "La campaña termina en 5 días" },
    { tipo: "info", mensaje: "Saldo disponible: $12,500" }
  ],
  roi_estimado: 1.5
}

const ubicacionesData = Object.entries(mockCampaignData.ubicaciones).map(([ciudad, impresiones]) => ({
  ciudad,
  impresiones
}))

const horariosData = Object.entries(mockCampaignData.horarios).map(([horario, impresiones]) => ({
  horario,
  impresiones
}))

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))', 'hsl(var(--border))']

export function AdvertiserDashboard() {
  const { user } = useAuth()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchCampaigns()
    }
  }, [user])

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('campañas')
        .select('*')
        .eq('advertiser_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setCampaigns(data || [])
    } catch (error) {
      console.error('Error fetching campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  const analytics = useMemo(() => {
    const total = campaigns.length
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length
    const completedCampaigns = campaigns.filter(c => c.status === 'completed').length
    
    const totalSpent = campaigns.reduce((sum, c) => sum + (c.presupuesto_usado || 0), 0)
    const totalBudget = campaigns.reduce((sum, c) => sum + c.presupuesto_total, 0)
    const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
    
    const avgCampaignDuration = total > 0 ? 
      campaigns.reduce((sum, c) => sum + c.dias_totales, 0) / total : 0
    
    return {
      total,
      activeCampaigns,
      completedCampaigns,
      totalSpent,
      totalBudget,
      budgetUtilization,
      avgCampaignDuration
    }
  }, [campaigns])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-MX').format(num)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCampaignProgress = (campaign: Campaign) => {
    return campaign.dias_totales > 0 ? (campaign.dias_transcurridos / campaign.dias_totales) * 100 : 0
  }

  const getBudgetProgress = (campaign: Campaign) => {
    return campaign.presupuesto_total > 0 ? (campaign.presupuesto_usado / campaign.presupuesto_total) * 100 : 0
  }

  const getAlertColor = (tipo: string) => {
    switch (tipo) {
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'error': return 'bg-red-50 border-red-200 text-red-800'
      case 'info': return 'bg-blue-50 border-blue-200 text-blue-800'
      default: return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Cargando...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Inteligencia de Negocio</h2>
      </div>

      {/* Alertas */}
      {mockCampaignData.alertas.length > 0 && (
        <div className="space-y-2">
          {mockCampaignData.alertas.map((alerta, index) => (
            <div key={index} className={`p-3 rounded-lg border flex items-center gap-2 ${getAlertColor(alerta.tipo)}`}>
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">{alerta.mensaje}</span>
            </div>
          ))}
        </div>
      )}

      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-500" />
              Impresiones Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatNumber(mockCampaignData.impresiones)}
            </div>
            <p className="text-xs text-muted-foreground">Veces mostrada la campaña</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-green-500" />
              Alcance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatNumber(mockCampaignData.alcance)}
            </div>
            <p className="text-xs text-muted-foreground">Personas únicas impactadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Repeat className="h-4 w-4 text-purple-500" />
              Frecuencia Promedio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {mockCampaignData.frecuencia.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">Veces por persona</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-orange-500" />
              CPM
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              ${mockCampaignData.cpm.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Costo por mil impresiones</p>
          </CardContent>
        </Card>
      </div>

      {/* Métricas Adicionales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MousePointer className="h-4 w-4 text-indigo-500" />
              CTR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">
              {mockCampaignData.ctr}%
            </div>
            <p className="text-xs text-muted-foreground">Click Through Rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-teal-500" />
              Duración de Campaña
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-600">
              {mockCampaignData.dias_transcurridos}/{mockCampaignData.dias_contratados}
            </div>
            <p className="text-xs text-muted-foreground">Días transcurridos/contratados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-pink-500" />
              % de Avance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-pink-600">
              {mockCampaignData.progreso}%
            </div>
            <Progress value={mockCampaignData.progreso} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              ROI Estimado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {mockCampaignData.roi_estimado.toFixed(1)}x
            </div>
            <p className="text-xs text-muted-foreground">Retorno de inversión</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos y Análisis */}
      <Tabs defaultValue="distribucion" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="distribucion">Distribución</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
          <TabsTrigger value="horarios">Horarios</TabsTrigger>
        </TabsList>

        <TabsContent value="distribucion" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                    <XAxis dataKey="ciudad" />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatNumber(value as number), 'Impresiones']} />
                    <Bar dataKey="impresiones" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Distribución por Ciudad
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={ubicacionesData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ ciudad, percent }) => `${ciudad} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="impresiones"
                    >
                      {ubicacionesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [formatNumber(value as number), 'Impresiones']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="historico" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Comparativo Histórico
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={mockCampaignData.historico}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatNumber(value as number), 'Impresiones']} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="campaña_actual" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Campaña Actual"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="promedio_anterior" 
                    stroke="hsl(var(--muted-foreground))" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Promedio Anterior"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="horarios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Distribución por Horarios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={horariosData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="horario" />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatNumber(value as number), 'Impresiones']} />
                  <Bar dataKey="impresiones" fill="hsl(var(--secondary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Campañas Activas (versión simplificada) */}
      {campaigns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Resumen de Campañas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="border-dashed">
                <CardContent className="pt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{analytics.activeCampaigns}</div>
                    <p className="text-sm text-muted-foreground">Campañas Activas</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-dashed">
                <CardContent className="pt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{analytics.completedCampaigns}</div>
                    <p className="text-sm text-muted-foreground">Completadas</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-dashed">
                <CardContent className="pt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {analytics.budgetUtilization.toFixed(1)}%
                    </div>
                    <p className="text-sm text-muted-foreground">Presupuesto Usado</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {campaigns.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tienes campañas activas</h3>
            <p className="text-muted-foreground">
              Explora los espacios disponibles y crea tu primera campaña publicitaria.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}