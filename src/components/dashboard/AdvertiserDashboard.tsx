import { useMemo, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, 
  Calendar, 
  DollarSign,
  BarChart3,
  Activity,
  Target,
  Clock,
  CheckCircle2
} from 'lucide-react'
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

  if (loading) {
    return <div className="flex items-center justify-center h-64">Cargando...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Panel del Anunciante</h2>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-500" />
              Campañas Activas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{analytics.activeCampaigns}</div>
            <p className="text-xs text-muted-foreground">En ejecución actualmente</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-500" />
              Campañas Completadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{analytics.completedCampaigns}</div>
            <p className="text-xs text-muted-foreground">Finalizadas exitosamente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-purple-500" />
              Presupuesto Utilizado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {analytics.budgetUtilization.toFixed(1)}%
            </div>
            <Progress value={analytics.budgetUtilization} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              Duración Promedio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {analytics.avgCampaignDuration.toFixed(0)} días
            </div>
            <p className="text-xs text-muted-foreground">Por campaña</p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              Inversión Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(analytics.totalSpent)}
            </div>
            <p className="text-xs text-muted-foreground">
              De {formatCurrency(analytics.totalBudget)} presupuestado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500" />
              Eficiencia de Gasto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {analytics.totalBudget > 0 ? (analytics.totalSpent / analytics.totalBudget * 100).toFixed(1) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Del presupuesto total</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Campaigns Progress */}
      {campaigns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Progreso de Campañas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {campaigns.slice(0, 5).map((campaign) => (
                <div key={campaign.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{campaign.nombre}</h4>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(campaign.fecha_inicio)} - {formatDate(campaign.fecha_fin)}
                      </p>
                    </div>
                    <Badge className={getStatusColor(campaign.status)}>
                      {campaign.status === 'active' ? 'Activa' : 
                       campaign.status === 'completed' ? 'Completada' : campaign.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progreso de Tiempo</span>
                        <span>{campaign.dias_transcurridos}/{campaign.dias_totales} días</span>
                      </div>
                      <Progress value={getCampaignProgress(campaign)} />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Presupuesto Usado</span>
                        <span>{formatCurrency(campaign.presupuesto_usado)}/{formatCurrency(campaign.presupuesto_total)}</span>
                      </div>
                      <Progress value={getBudgetProgress(campaign)} />
                    </div>
                  </div>
                </div>
              ))}
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