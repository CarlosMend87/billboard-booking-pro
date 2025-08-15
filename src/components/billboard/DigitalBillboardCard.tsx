import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { Badge } from "@/components/ui/badge"
import { MapPin, DollarSign, Users, Ruler, Monitor, Clock } from "lucide-react"
import { DigitalBillboard } from "@/types/billboard"

interface DigitalBillboardCardProps {
  billboard: DigitalBillboard
}

export function DigitalBillboardCard({ billboard }: DigitalBillboardCardProps) {
  const sizeDisplay = `${billboard.size.width_meters}m x ${billboard.size.height_meters}m`
  const pixelDisplay = billboard.size.width_pixels && billboard.size.height_pixels 
    ? `(${billboard.size.width_pixels}px x ${billboard.size.height_pixels}px)`
    : ""

  const occupancyPercentage = (billboard.currentClients.length / billboard.maxClients) * 100
  const getOccupancyColor = () => {
    if (occupancyPercentage === 0) return "text-status-available"
    if (occupancyPercentage < 50) return "text-status-reserved"
    if (occupancyPercentage < 100) return "text-status-confirmed"
    return "text-status-occupied"
  }

  const getStatusText = () => {
    if (billboard.currentClients.length === 0) return "Disponible"
    if (billboard.currentClients.length < billboard.maxClients) return "Parcialmente Ocupada"
    return "Completa"
  }

  const getStatusVariant = () => {
    if (billboard.currentClients.length === 0) return "available"
    if (billboard.currentClients.length < billboard.maxClients) return "reserved"
    return "occupied"
  }

  return (
    <Card className="bg-gradient-card shadow-soft hover:shadow-medium transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              {billboard.id}
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                <Monitor className="h-3 w-3 mr-1" />
                Digital
              </Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground flex items-center mt-1">
              <MapPin className="h-3 w-3 mr-1" />
              {billboard.location}
            </p>
          </div>
          <StatusBadge variant={getStatusVariant()}>
            {getStatusText()}
          </StatusBadge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground flex items-center">
            <Ruler className="h-3 w-3 mr-1" />
            Tamaño:
          </span>
          <div className="text-right">
            <span className="font-medium">{sizeDisplay}</span>
            {pixelDisplay && (
              <div className="text-xs text-muted-foreground">{pixelDisplay}</div>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground flex items-center">
            <Users className="h-3 w-3 mr-1" />
            Ocupación:
          </span>
          <span className={`font-bold ${getOccupancyColor()}`}>
            {billboard.currentClients.length}/{billboard.maxClients} clientes
          </span>
        </div>

        <div className="bg-muted rounded-lg p-3 space-y-2">
          <h4 className="text-sm font-medium flex items-center">
            <DollarSign className="h-3 w-3 mr-1" />
            Precios por Unidad:
          </h4>
          <div className="grid grid-cols-2 gap-1 text-xs">
            {billboard.pricePerSpot && (
              <div>Spot: ${billboard.pricePerSpot}</div>
            )}
            {billboard.pricePerHour && (
              <div>Hora: ${billboard.pricePerHour}</div>
            )}
            {billboard.pricePerDay && (
              <div>Día: ${billboard.pricePerDay}</div>
            )}
            {billboard.pricePerWeek && (
              <div>Semana: ${billboard.pricePerWeek}</div>
            )}
            {billboard.pricePerMonth && (
              <div>Mes: ${billboard.pricePerMonth}</div>
            )}
          </div>
        </div>
        
        {billboard.currentClients.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Clientes Activos:</h4>
            <div className="max-h-20 overflow-y-auto space-y-1">
              {billboard.currentClients.slice(0, 3).map((client, index) => (
                <div key={index} className="flex items-center justify-between text-xs bg-secondary/50 rounded px-2 py-1">
                  <span className="font-medium">{client.name}</span>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-xs">
                      {client.saleUnit === "spot" ? "Spot" :
                       client.saleUnit === "hour" ? "Hora" :
                       client.saleUnit === "day" ? "Día" :
                       client.saleUnit === "week" ? "Semana" : "Mes"}
                    </Badge>
                    <Badge variant={client.salesChannel === "direct" ? "default" : "secondary"}>
                      {client.salesChannel === "direct" ? "Directa" : "Plataforma"}
                    </Badge>
                  </div>
                </div>
              ))}
              {billboard.currentClients.length > 3 && (
                <div className="text-xs text-muted-foreground text-center">
                  +{billboard.currentClients.length - 3} más
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="flex gap-2 pt-2">
          {billboard.availableSlots > 0 && (
            <Button size="sm" className="flex-1">
              Reservar Slot
            </Button>
          )}
          <Button variant="outline" size="sm" className="flex-1">
            Ver Programación
          </Button>
        </div>
        
        {billboard.availableSlots > 0 && (
          <div className="text-xs text-center text-muted-foreground">
            {billboard.availableSlots} slots disponibles
          </div>
        )}
      </CardContent>
    </Card>
  )
}