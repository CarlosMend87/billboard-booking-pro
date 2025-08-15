import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FixedBillboardCard } from "./FixedBillboardCard"
import { DigitalBillboardCard } from "./DigitalBillboardCard"
import { Billboard, FixedBillboard, DigitalBillboard } from "@/types/billboard"

const mockBillboards: Billboard[] = [
  // Anuncios Fijos
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
  
  // Anuncios Digitales (DOOH)
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


export function BillboardGrid() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Inventario de Anuncios</h2>
        <Button className="bg-gradient-primary text-white hover:opacity-90 transition-opacity">
          Agregar Nuevo Anuncio
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mockBillboards.map((billboard) => (
          billboard.type === "fixed" ? (
            <FixedBillboardCard key={billboard.id} billboard={billboard as FixedBillboard} />
          ) : (
            <DigitalBillboardCard key={billboard.id} billboard={billboard as DigitalBillboard} />
          )
        ))}
      </div>
    </div>
  )
}