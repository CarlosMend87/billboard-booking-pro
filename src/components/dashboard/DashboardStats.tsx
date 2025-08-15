import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Calendar, DollarSign, Eye, BarChart3, TrendingUp } from "lucide-react"
import { Billboard, FixedBillboard, DigitalBillboard } from "@/types/billboard"

// Datos mock - en una app real vendrían de una API
const mockBillboards: Billboard[] = [
  // Vallas Fijas
  {
    id: "VF001",
    type: "fixed",
    location: "Plaza Centro",
    size: { width_meters: 14.6, height_meters: 4.3, width_pixels: 1920, height_pixels: 1080 },
    monthlyPrice: 2500,
    status: "available"
  } as FixedBillboard,
  {
    id: "VF002", 
    type: "fixed",
    location: "Autopista 101 Norte",
    size: { width_meters: 29.3, height_meters: 14.6 },
    monthlyPrice: 4200,
    status: "confirmed",
    client: {
      name: "Campaña Nike",
      salesChannel: "platform",
      startDate: "2024-08-01",
      endDate: "2024-11-01",
      price: 4200
    },
    contractMonths: 3
  } as FixedBillboard,
  {
    id: "VF003",
    type: "fixed",
    location: "Salida Aeropuerto",
    size: { width_meters: 7.3, height_meters: 3.7 }, 
    monthlyPrice: 1800,
    status: "confirmed",
    client: {
      name: "Restaurante Local",
      salesChannel: "direct",
      startDate: "2024-08-01",
      endDate: "2024-09-01",
      price: 1800
    },
    contractMonths: 1
  } as FixedBillboard,
  
  // Vallas Digitales (DOOH)
  {
    id: "VD001",
    type: "digital",
    location: "Centro Comercial Principal",
    size: { width_meters: 4.0, height_meters: 3.0, width_pixels: 1920, height_pixels: 1440 },
    maxClients: 15,
    currentClients: [
      {
        name: "Tech Startup",
        salesChannel: "platform",
        startDate: "2024-08-01",
        endDate: "2024-08-31",
        price: 120,
        saleUnit: "day"
      },
      {
        name: "Restaurante Gourmet",
        salesChannel: "direct",
        startDate: "2024-08-01",
        endDate: "2024-08-31",
        price: 15,
        saleUnit: "hour",
        hoursPerDay: 8
      },
      {
        name: "Marca Deportiva",
        salesChannel: "platform",
        startDate: "2024-08-01",
        endDate: "2024-08-31",
        price: 25,
        saleUnit: "spot",
        spotsPerDay: 12
      }
    ],
    pricePerSpot: 25,
    pricePerHour: 15,
    pricePerDay: 120,
    pricePerWeek: 800,
    pricePerMonth: 3200,
    status: "reserved",
    availableSlots: 12
  } as DigitalBillboard,
  {
    id: "VD002",
    type: "digital",
    location: "Estación Metro Centro",
    size: { width_meters: 2.0, height_meters: 1.5, width_pixels: 1080, height_pixels: 1920 },
    maxClients: 10,
    currentClients: [],
    pricePerSpot: 18,
    pricePerHour: 12,
    pricePerDay: 95,
    pricePerWeek: 650,
    pricePerMonth: 2800,
    status: "available",
    availableSlots: 10
  } as DigitalBillboard,
  {
    id: "VD003",
    type: "digital",
    location: "Complejo Deportivo",
    size: { width_meters: 6.0, height_meters: 4.0, width_pixels: 1920, height_pixels: 1280 },
    maxClients: 15,
    currentClients: new Array(15).fill(null).map((_, i) => ({
      name: `Cliente ${i + 1}`,
      salesChannel: i % 2 === 0 ? "platform" : "direct",
      startDate: "2024-08-01",
      endDate: "2024-08-31",
      price: 30,
      saleUnit: "spot",
      spotsPerDay: 8
    })),
    pricePerSpot: 30,
    pricePerHour: 20,
    pricePerDay: 150,
    pricePerWeek: 1000,
    pricePerMonth: 4200,
    status: "occupied",
    availableSlots: 0
  } as DigitalBillboard
]

function calculateStats() {
  const fixedBillboards = mockBillboards.filter(b => b.type === "fixed") as FixedBillboard[]
  const digitalBillboards = mockBillboards.filter(b => b.type === "digital") as DigitalBillboard[]
  
  // Estadísticas Vallas Fijas
  const fixedReserved = fixedBillboards.filter(b => b.status === "reserved").length
  const fixedConfirmed = fixedBillboards.filter(b => b.status === "confirmed").length
  const fixedTotal = fixedBillboards.length
  const fixedOccupancy = fixedTotal > 0 ? ((fixedReserved + fixedConfirmed) / fixedTotal) * 100 : 0
  
  // Estadísticas Vallas Digitales (basado en slots)
  const digitalTotalSlots = digitalBillboards.reduce((acc, b) => acc + b.maxClients, 0)
  const digitalOccupiedSlots = digitalBillboards.reduce((acc, b) => acc + b.currentClients.length, 0)
  const digitalAvailableSlots = digitalBillboards.reduce((acc, b) => acc + b.availableSlots, 0)
  const digitalOccupancy = digitalTotalSlots > 0 ? (digitalOccupiedSlots / digitalTotalSlots) * 100 : 0
  
  // Ingresos estimados
  const fixedIncome = fixedBillboards
    .filter(b => b.client)
    .reduce((acc, b) => acc + b.monthlyPrice, 0)
  
  const digitalIncome = digitalBillboards.reduce((acc, b) => {
    return acc + b.currentClients.reduce((clientAcc, client) => clientAcc + client.price, 0)
  }, 0)
  
  const totalIncome = fixedIncome + digitalIncome
  
  return {
    fixedTotal,
    fixedReserved,
    fixedConfirmed,
    fixedOccupancy,
    fixedIncome,
    digitalTotal: digitalBillboards.length,
    digitalTotalSlots,
    digitalOccupiedSlots,
    digitalOccupancy,
    digitalAvailableSlots,
    digitalIncome,
    totalIncome
  }
}

const stats = calculateStats()

const statsConfig = [
  {
    title: "Inventario Fijo",
    value: `${stats.fixedTotal}`,
    description: `${stats.fixedOccupancy.toFixed(0)}% ocupación total`,
    icon: Building2,
    color: "text-primary",
    details: `Reservado: ${((stats.fixedReserved / stats.fixedTotal) * 100).toFixed(0)}% | Confirmado: ${((stats.fixedConfirmed / stats.fixedTotal) * 100).toFixed(0)}%`
  },
  {
    title: "Inventario Digital",
    value: `${stats.digitalTotal}`,
    description: `${stats.digitalOccupancy.toFixed(0)}% slots ocupados`,
    icon: Eye,
    color: "text-status-confirmed",
    details: `${stats.digitalTotalSlots} slots totales | ${stats.digitalOccupiedSlots} ocupados`
  },
  {
    title: "Estado Fijas",
    value: `${stats.fixedReserved + stats.fixedConfirmed}/${stats.fixedTotal}`,
    description: `Reservado: ${stats.fixedReserved} | Confirmado: ${stats.fixedConfirmed}`,
    icon: BarChart3,
    color: "text-status-reserved"
  },
  {
    title: "Slots Digitales",
    value: `${stats.digitalAvailableSlots}`,
    description: "Disponibles para reservar",
    icon: Calendar,
    color: "text-status-available"
  },
  {
    title: "Ingresos Fijas",
    value: `$${stats.fixedIncome.toLocaleString()}`,
    description: "Contratos confirmados",
    icon: DollarSign,
    color: "text-primary"
  },
  {
    title: "Ingresos Digitales",
    value: `$${stats.digitalIncome.toLocaleString()}`,
    description: "Clientes activos actuales", 
    icon: TrendingUp,
    color: "text-status-confirmed"
  }
]

export function DashboardStats() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {statsConfig.map((stat) => (
        <Card key={stat.title} className="bg-gradient-card shadow-soft hover:shadow-medium transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stat.value}</div>
            <p className="text-sm font-semibold text-muted-foreground">{stat.description}</p>
            {stat.details && (
              <p className="text-xs text-muted-foreground mt-1">{stat.details}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}