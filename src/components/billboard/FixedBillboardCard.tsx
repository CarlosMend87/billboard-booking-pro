import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { Badge } from "@/components/ui/badge"
import { MapPin, DollarSign, Calendar, Users, Ruler } from "lucide-react"
import { FixedBillboard } from "@/types/billboard"

interface FixedBillboardCardProps {
  billboard: FixedBillboard
}

export function FixedBillboardCard({ billboard }: FixedBillboardCardProps) {
  const sizeDisplay = `${billboard.size.width_meters}m x ${billboard.size.height_meters}m`
  const pixelDisplay = billboard.size.width_pixels && billboard.size.height_pixels 
    ? `(${billboard.size.width_pixels}px x ${billboard.size.height_pixels}px)`
    : ""

  return (
    <Card className="bg-gradient-card shadow-soft hover:shadow-medium transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              {billboard.id}
              <Badge variant="outline" className="text-xs">
                Fija
              </Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground flex items-center mt-1">
              <MapPin className="h-3 w-3 mr-1" />
              {billboard.location}
            </p>
          </div>
          <StatusBadge variant={billboard.status} className="capitalize">
            {billboard.status === "available" ? "Disponible" : 
             billboard.status === "reserved" ? "Reservada" :
             billboard.status === "confirmed" ? "Confirmada" : "Ocupada"}
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
            <DollarSign className="h-3 w-3 mr-1" />
            Precio/Mes:
          </span>
          <span className="font-bold text-primary">${billboard.monthlyPrice.toLocaleString()}</span>
        </div>
        
        {billboard.client && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center">
                <Users className="h-3 w-3 mr-1" />
                Cliente:
              </span>
              <span className="font-medium">{billboard.client.name}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Canal de Venta:</span>
              <Badge variant={billboard.client.salesChannel === "direct" ? "default" : "secondary"}>
                {billboard.client.salesChannel === "direct" ? "Venta Directa" : "Plataforma"}
              </Badge>
            </div>
            
            {billboard.contractMonths && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  Contrato:
                </span>
                <span className="text-primary font-medium">
                  {billboard.contractMonths} {billboard.contractMonths === 1 ? "mes" : "meses"}
                </span>
              </div>
            )}
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Período:</span>
              <span className="font-medium">
                {billboard.client.startDate} - {billboard.client.endDate}
              </span>
            </div>
          </div>
        )}
        
        <div className="flex gap-2 pt-2">
          {billboard.status === "available" && (
            <Button size="sm" className="flex-1">Reservar</Button>
          )}
          {billboard.status === "reserved" && (
            <Button size="sm" className="flex-1">Confirmar</Button>
          )}
          <Button variant="outline" size="sm" className="flex-1">
            Detalles
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}