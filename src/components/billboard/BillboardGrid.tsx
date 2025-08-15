import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { Badge } from "@/components/ui/badge"
import { MapPin, DollarSign, Calendar, Users } from "lucide-react"

interface Billboard {
  id: string
  location: string
  size: string
  price: number
  status: "available" | "reserved" | "confirmed" | "occupied"
  client?: string
  salesChannel?: "platform" | "direct"
  reservedUntil?: string
}

const mockBillboards: Billboard[] = [
  {
    id: "VL001",
    location: "Plaza Centro",
    size: "48' x 14'",
    price: 2500,
    status: "available"
  },
  {
    id: "VL002", 
    location: "Autopista 101 Norte",
    size: "96' x 48'",
    price: 4200,
    status: "reserved",
    client: "Campaña Nike",
    salesChannel: "platform",
    reservedUntil: "2024-08-20"
  },
  {
    id: "VL003",
    location: "Salida Aeropuerto",
    size: "24' x 12'", 
    price: 1800,
    status: "confirmed",
    client: "Restaurante Local",
    salesChannel: "direct"
  },
  {
    id: "VL004",
    location: "Centro Comercial",
    size: "32' x 16'",
    price: 3100,
    status: "reserved",
    client: "Startup Tecnológica",
    salesChannel: "platform",
    reservedUntil: "2024-08-18"
  },
  {
    id: "VL005",
    location: "Calle Principal",
    size: "20' x 8'",
    price: 1200,
    status: "available"
  },
  {
    id: "VL006",
    location: "Complejo Deportivo",
    size: "64' x 32'",
    price: 5500,
    status: "occupied",
    client: "Marca Deportiva",
    salesChannel: "direct"
  }
]

export function BillboardGrid() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Inventario de Vallas</h2>
        <Button className="bg-gradient-primary text-white hover:opacity-90 transition-opacity">
          Agregar Nueva Valla
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mockBillboards.map((billboard) => (
          <Card key={billboard.id} className="bg-gradient-card shadow-soft hover:shadow-medium transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{billboard.id}</CardTitle>
                  <p className="text-sm text-muted-foreground flex items-center mt-1">
                    <MapPin className="h-3 w-3 mr-1" />
                    {billboard.location}
                  </p>
                </div>
                <StatusBadge variant={billboard.status} className="capitalize">
                  {billboard.status}
                </StatusBadge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Tamaño:</span>
                <span className="font-medium">{billboard.size}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center">
                  <DollarSign className="h-3 w-3 mr-1" />
                  Precio/Mes:
                </span>
                <span className="font-bold text-primary">${billboard.price.toLocaleString()}</span>
              </div>
              
              {billboard.client && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      Cliente:
                    </span>
                    <span className="font-medium">{billboard.client}</span>
                  </div>
                  
                  {billboard.salesChannel && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Canal de Venta:</span>
                      <Badge variant={billboard.salesChannel === "direct" ? "default" : "secondary"}>
                        {billboard.salesChannel === "direct" ? "Venta Directa" : "Plataforma"}
                      </Badge>
                    </div>
                  )}
                  
                  {billboard.reservedUntil && billboard.status === "reserved" && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        Reservada hasta:
                      </span>
                      <span className="text-status-reserved font-medium">{billboard.reservedUntil}</span>
                    </div>
                  )}
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
        ))}
      </div>
    </div>
  )
}