import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  CheckCircle, 
  Percent, 
  DollarSign,
  Monitor,
  ShoppingCart,
  BarChart3,
  Users
} from 'lucide-react'
import { mockInventoryAssets, InventoryAsset } from '@/lib/mockInventory'

export function BusinessIntelligence() {
  const analytics = useMemo(() => {
    const assets = mockInventoryAssets
    const total = assets.length
    
    // Basic counts
    const disponibles = assets.filter(a => a.estado === 'disponible').length
    const reservados = assets.filter(a => a.estado === 'reservado').length
    const ocupados = assets.filter(a => a.estado === 'ocupado').length
    const enRevision = assets.filter(a => a.estado === 'en_revision').length
    const aceptados = assets.filter(a => a.estado === 'aceptado').length
    
    // Digital specific metrics
    const digitales = assets.filter(a => a.tipo === 'digital')
    const digitalesReservados = digitales.filter(a => a.estado === 'reservado' || a.estado === 'ocupado').length
    const digitalesComprados = digitales.filter(a => a.estado === 'ocupado').length
    
    // Occupancy percentage
    const ocupados_y_reservados = ocupados + reservados
    const ocupancyRate = total > 0 ? ((ocupados_y_reservados / total) * 100) : 0
    
    // Revenue calculations
    const ingresosMensuales = assets
      .filter(a => a.estado === 'ocupado' || a.estado === 'reservado')
      .reduce((sum, asset) => sum + (asset.precio.mensual || 0), 0)
    
    const ingresosPotenciales = assets
      .reduce((sum, asset) => sum + (asset.precio.mensual || 0), 0)
    
    const rentabilidad = ingresosPotenciales > 0 ? 
      ((ingresosMensuales / ingresosPotenciales) * 100) : 0
    
    // Discount calculations
    const assetsWithDiscount = assets.filter(a => a.precio.descuento_volumen && a.precio.descuento_volumen > 0)
    const promedioDescuento = assetsWithDiscount.length > 0 ?
      assetsWithDiscount.reduce((sum, a) => sum + (a.precio.descuento_volumen || 0), 0) / assetsWithDiscount.length : 0
    
    return {
      total,
      disponibles,
      reservados,
      ocupados,
      enRevision,
      aceptados,
      digitalesReservados,
      digitalesComprados,
      digitalesTotal: digitales.length,
      ocupancyRate,
      ingresosMensuales,
      ingresosPotenciales,
      rentabilidad,
      promedioDescuento,
      conversionRate: enRevision > 0 ? ((aceptados / (enRevision + aceptados)) * 100) : 0
    }
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Inteligencia de Negocio</h2>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-500" />
              En Revisión
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{analytics.enRevision}</div>
            <p className="text-xs text-muted-foreground">Espacios siendo evaluados</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Aceptados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{analytics.aceptados}</div>
            <p className="text-xs text-muted-foreground">Espacios aprobados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-500" />
              Tasa Conversión
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {analytics.conversionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Revisión → Aceptación</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Percent className="h-4 w-4 text-orange-500" />
              Ocupación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {analytics.ocupancyRate.toFixed(1)}%
            </div>
            <Progress value={analytics.ocupancyRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Revenue Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              Ingresos Actuales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(analytics.ingresosMensuales)}
            </div>
            <p className="text-xs text-muted-foreground">Por mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Potencial Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(analytics.ingresosPotenciales)}
            </div>
            <p className="text-xs text-muted-foreground">Si ocupación fuera 100%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-purple-500" />
              Rentabilidad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {analytics.rentabilidad.toFixed(1)}%
            </div>
            <Progress value={analytics.rentabilidad} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Digital & Discounts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-cyan-500" />
              Espacios Digitales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total digitales:</span>
              <Badge variant="outline">{analytics.digitalesTotal}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Reservados:</span>
              <Badge variant="secondary">{analytics.digitalesReservados}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Comprados:</span>
              <Badge variant="default">{analytics.digitalesComprados}</Badge>
            </div>
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Tasa ocupación digital:</span>
                <span className="font-bold text-cyan-600">
                  {analytics.digitalesTotal > 0 ? 
                    ((analytics.digitalesReservados / analytics.digitalesTotal) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              Análisis de Descuentos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Descuento promedio:</span>
              <Badge variant="destructive">{analytics.promedioDescuento.toFixed(1)}%</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Espacios con descuento:</span>
              <Badge variant="outline">
                {mockInventoryAssets.filter(a => a.precio.descuento_volumen && a.precio.descuento_volumen > 0).length}
              </Badge>
            </div>
            <div className="pt-2 border-t">
              <div className="text-sm">
                <span className="text-muted-foreground">Impacto en ingresos: </span>
                <span className="font-medium text-red-600">
                  -{formatCurrency(analytics.ingresosPotenciales * (analytics.promedioDescuento / 100))}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Insights Clave</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">📈 Oportunidades</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• {analytics.disponibles} espacios disponibles para comercializar</li>
                <li>• Potencial de {formatCurrency(analytics.ingresosPotenciales - analytics.ingresosMensuales)} adicionales</li>
                <li>• {analytics.enRevision} clientes en proceso de decisión</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">⚠️ Áreas de Atención</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Ocupación actual: {analytics.ocupancyRate.toFixed(1)}% del total</li>
                <li>• Descuentos promedio reducen ingresos {analytics.promedioDescuento.toFixed(1)}%</li>
                <li>• {analytics.digitalesTotal - analytics.digitalesReservados} espacios digitales sin usar</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}