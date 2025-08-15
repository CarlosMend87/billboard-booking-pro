export type BillboardStatus = "available" | "reserved" | "confirmed" | "occupied"
export type SalesChannel = "platform" | "direct"
export type BillboardType = "fixed" | "digital"

// Unidades de venta para vallas digitales
export type DigitalSaleUnit = "spot" | "hour" | "day" | "week" | "month"

export interface BillboardSize {
  width_meters: number
  height_meters: number
  width_pixels?: number
  height_pixels?: number
}

export interface BaseClient {
  name: string
  salesChannel: SalesChannel
  startDate: string
  endDate: string
  price: number
}

// Valla Fija - Tradicional con lona impresa
export interface FixedBillboard {
  id: string
  type: "fixed"
  location: string
  size: BillboardSize
  monthlyPrice: number
  status: BillboardStatus
  client?: BaseClient
  contractMonths?: number
}

// Cliente para valla digital con unidad de venta específica
export interface DigitalClient extends BaseClient {
  saleUnit: DigitalSaleUnit
  spotsPerDay?: number // Para spots
  hoursPerDay?: number // Para horas
}

// Valla Digital - DOOH hasta 15 clientes por pantalla
export interface DigitalBillboard {
  id: string
  type: "digital"
  location: string
  size: BillboardSize
  maxClients: number // Máximo 15
  currentClients: DigitalClient[]
  pricePerSpot?: number
  pricePerHour?: number
  pricePerDay?: number
  pricePerWeek?: number
  pricePerMonth?: number
  status: BillboardStatus
  availableSlots: number
}

export type Billboard = FixedBillboard | DigitalBillboard