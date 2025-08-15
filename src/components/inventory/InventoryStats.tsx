import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, 
  Building2, 
  Monitor, 
  DollarSign, 
  TrendingUp, 
  Users, 
  MapPin,
  Target,
  AlertTriangle
} from 'lucide-react'
import { Billboard as BillboardType, FixedBillboard, DigitalBillboard } from '@/types/billboard'

interface InventoryStatsProps {
  billboards: BillboardType[]
}

export function InventoryStats({ billboards }: InventoryStatsProps) {
  // Calculate comprehensive stats
  const fixedBillboards = billboards.filter(b => b.type === 'fixed') as FixedBillboard[]
  const digitalBillboards = billboards.filter(b => b.type === 'digital') as DigitalBillboard[]

  const totalBillboards = billboards.length
  const totalFixed = fixedBillboards.length
  const totalDigital = digitalBillboards.length

  // Occupancy rates
  const occupiedFixed = fixedBillboards.filter(b => b.status === 'occupied' || b.status === 'confirmed').length
  const fixedOccupancyRate = totalFixed > 0 ? (occupiedFixed / totalFixed) * 100 : 0

  // Digital slots
  const totalDigitalSlots = digitalBillboards.reduce((sum, b) => sum + b.maxClients, 0)
  const occupiedDigitalSlots = digitalBillboards.reduce((sum, b) => sum + (b.maxClients - b.availableSlots), 0)
  const digitalOccupancyRate = totalDigitalSlots > 0 ? (occupiedDigitalSlots / totalDigitalSlots) * 100 : 0

  // Revenue calculations
  const fixedRevenue = fixedBillboards.reduce((sum, b) => {
    return sum + (b.client ? b.monthlyPrice : 0)
  }, 0)

  const digitalRevenue = digitalBillboards.reduce((sum, b) => {
    return sum + b.currentClients.reduce((clientSum, client) => clientSum + client.price, 0)
  }, 0)

  const totalRevenue = fixedRevenue + digitalRevenue

  // Potential revenue (if all were occupied)
  const potentialFixedRevenue = fixedBillboards.reduce((sum, b) => sum + b.monthlyPrice, 0)
  const potentialDigitalRevenue = digitalBillboards.reduce((sum, b) => sum + (b.pricePerMonth || 0), 0)
  const totalPotentialRevenue = potentialFixedRevenue + potentialDigitalRevenue

  const revenueEfficiency = totalPotentialRevenue > 0 ? (totalRevenue / totalPotentialRevenue) * 100 : 0

  // Location analysis
  const locationGroups = billboards.reduce((acc, billboard) => {
    const location = billboard.location.split(' ')[0] // Get first word as location group
    acc[location] = (acc[location] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const topLocations = Object.entries(locationGroups)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)

  // Performance insights
  const underperformingBillboards = billboards.filter(b => {
    if (b.type === 'fixed') {
      return b.status === 'available'
    } else {
      return b.availableSlots > b.maxClients * 0.7 // More than 70% availability
    }
  }).length

  const stats = [
    {
      title: "Inventario Total",
      value: totalBillboards.toLocaleString(),
      icon: BarChart3,
      color: "text-primary",
      description: `${totalFixed} fijas, ${totalDigital} digitales`,
      change: "+12% vs mes anterior"
    },
    {
      title: "Ocupación Global",
      value: `${Math.round((fixedOccupancyRate + digitalOccupancyRate) / 2)}%`,
      icon: Target,
      color: "text-status-confirmed",
      description: `${occupiedFixed + occupiedDigitalSlots} espacios ocupados`,
      change: "+5% vs mes anterior"
    },
    {
      title: "Ingresos Mensuales",
      value: `€${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-success",
      description: `${Math.round(revenueEfficiency)}% del potencial máximo`,
      change: "+18% vs mes anterior"
    },
    {
      title: "Eficiencia de Red",
      value: `${Math.round(revenueEfficiency)}%`,
      icon: TrendingUp,
      color: revenueEfficiency > 70 ? "text-success" : revenueEfficiency > 50 ? "text-warning" : "text-destructive",
      description: `€${(totalPotentialRevenue - totalRevenue).toLocaleString()} potencial perdido`,
      change: revenueEfficiency > 70 ? "+8% vs mes anterior" : "-3% vs mes anterior"
    }
  ]

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
              <div className="flex items-center mt-2">
                <Badge variant="secondary" className="text-xs">
                  {stat.change}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Analytics */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Occupancy Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Análisis de Ocupación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Anuncios Fijos</span>
                  <span className="text-sm">{Math.round(fixedOccupancyRate)}%</span>
                </div>
                <Progress value={fixedOccupancyRate} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {occupiedFixed} de {totalFixed} anuncios ocupados
                </p>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Pantallas Digitales</span>
                  <span className="text-sm">{Math.round(digitalOccupancyRate)}%</span>
                </div>
                <Progress value={digitalOccupancyRate} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {occupiedDigitalSlots} de {totalDigitalSlots} espacios ocupados
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Distribución de Ingresos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Anuncios Fijos</span>
                  <span className="text-sm font-bold">€{fixedRevenue.toLocaleString()}</span>
                </div>
                <Progress 
                  value={totalRevenue > 0 ? (fixedRevenue / totalRevenue) * 100 : 0} 
                  className="h-2" 
                />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Pantallas Digitales</span>
                  <span className="text-sm font-bold">€{digitalRevenue.toLocaleString()}</span>
                </div>
                <Progress 
                  value={totalRevenue > 0 ? (digitalRevenue / totalRevenue) * 100 : 0} 
                  className="h-2" 
                />
              </div>

              <div className="pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Ingresos Totales</span>
                  <span className="text-lg font-bold">€{totalRevenue.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Top Locations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Ubicaciones Principales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topLocations.map(([location, count], index) => (
                <div key={location} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{index + 1}</Badge>
                    <span className="text-sm font-medium">{location}</span>
                  </div>
                  <span className="text-sm">{count} anuncios</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Digital Clients */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Clientes Digitales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-center">
                <div className="text-3xl font-bold">
                  {digitalBillboards.reduce((sum, b) => sum + b.currentClients.length, 0)}
                </div>
                <p className="text-sm text-muted-foreground">Clientes activos</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold text-status-confirmed">
                    {digitalBillboards.filter(b => b.currentClients.some(c => c.salesChannel === 'platform')).length}
                  </div>
                  <p className="text-xs text-muted-foreground">Via Plataforma</p>
                </div>
                <div>
                  <div className="text-lg font-semibold text-status-reserved">
                    {digitalBillboards.filter(b => b.currentClients.some(c => c.salesChannel === 'direct')).length}
                  </div>
                  <p className="text-xs text-muted-foreground">Venta Directa</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Alertas de Rendimiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-warning/10 rounded">
                <span className="text-sm">Anuncios sin ocupar</span>
                <Badge variant="outline">{underperformingBillboards}</Badge>
              </div>
              
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <span className="text-sm">Ocupación bajo 50%</span>
                <Badge variant="outline">
                  {digitalBillboards.filter(b => (b.maxClients - b.availableSlots) / b.maxClients < 0.5).length}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-2 bg-success/10 rounded">
                <span className="text-sm">Alto rendimiento</span>
                <Badge variant="outline">
                  {digitalBillboards.filter(b => b.availableSlots === 0).length}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}