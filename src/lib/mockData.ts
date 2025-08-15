import { Billboard, FixedBillboard, DigitalBillboard, BillboardStatus, DigitalClient } from '@/types/billboard'

const locations = [
  'Plaza Centro', 'Autopista Norte', 'Centro Comercial Principal', 'Estación Metro Centro',
  'Aeropuerto Internacional', 'Hospital Central', 'Universidad Nacional', 'Parque Industrial',
  'Zona Financiera', 'Puerto Comercial', 'Estadio Municipal', 'Terminal de Buses',
  'Complejo Deportivo', 'Mercado Central', 'Zona Turística', 'Polígono Industrial',
  'Centro Histórico', 'Avenida Principal', 'Plaza de Armas', 'Distrito Comercial',
  'Zona Residencial Norte', 'Sector Sur', 'Barrio Universitario', 'Zona Hotelera',
  'Centro de Convenciones', 'Parque Tecnológico', 'Zona Franca', 'Puerto Deportivo',
  'Centro de Salud', 'Complejo Educativo', 'Zona de Oficinas', 'Centro Logístico'
]

const statuses: BillboardStatus[] = ['available', 'reserved', 'confirmed', 'occupied']

const companyNames = [
  'Tech Innovators', 'Global Marketing', 'Digital Solutions', 'Creative Agency',
  'Food & Beverage Co', 'Fashion Trends', 'Auto Group', 'Real Estate Plus',
  'Health Services', 'Education First', 'Travel World', 'Sports Equipment',
  'Electronics Store', 'Banking Corp', 'Insurance Group', 'Retail Chain',
  'Restaurant Network', 'Fitness Centers', 'Beauty Salon', 'Construction Co',
  'Energy Solutions', 'Telecom Services', 'Media Group', 'Entertainment Co',
  'Pharmaceutical Ltd', 'Agriculture Corp', 'Transport Services', 'Logistics Pro'
]

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateRandomDate(daysFromNow: number = 30): string {
  const date = new Date()
  date.setDate(date.getDate() + getRandomNumber(-daysFromNow, daysFromNow))
  return date.toISOString().split('T')[0]
}

function generateDigitalClients(maxClients: number): DigitalClient[] {
  const numClients = getRandomNumber(0, maxClients)
  const clients: DigitalClient[] = []
  
  for (let i = 0; i < numClients; i++) {
    const saleUnit = getRandomElement(['spot', 'hour', 'day', 'week', 'month'] as const)
    const client: DigitalClient = {
      name: getRandomElement(companyNames),
      salesChannel: getRandomElement(['platform', 'direct']),
      startDate: generateRandomDate(30),
      endDate: generateRandomDate(60),
      price: getRandomNumber(10, 500),
      saleUnit,
      ...(saleUnit === 'spot' && { spotsPerDay: getRandomNumber(5, 20) }),
      ...(saleUnit === 'hour' && { hoursPerDay: getRandomNumber(2, 12) })
    }
    clients.push(client)
  }
  
  return clients
}

export function generateMockBillboards(count: number): Billboard[] {
  const billboards: Billboard[] = []
  
  // Generate approximately 70% fixed, 30% digital billboards
  const fixedCount = Math.floor(count * 0.7)
  const digitalCount = count - fixedCount
  
  // Generate Fixed Billboards
  for (let i = 0; i < fixedCount; i++) {
    const status = getRandomElement(statuses)
    const monthlyPrice = getRandomNumber(800, 8000)
    
    const billboard: FixedBillboard = {
      id: `VF${String(i + 1).padStart(4, '0')}`,
      type: 'fixed',
      location: getRandomElement(locations),
      size: {
        width_meters: getRandomNumber(6, 30),
        height_meters: getRandomNumber(3, 15),
        width_pixels: getRandomNumber(1920, 3840),
        height_pixels: getRandomNumber(1080, 2160)
      },
      monthlyPrice,
      status,
      ...(status === 'confirmed' || status === 'occupied') && {
        client: {
          name: getRandomElement(companyNames),
          salesChannel: getRandomElement(['platform', 'direct']),
          startDate: generateRandomDate(30),
          endDate: generateRandomDate(90),
          price: monthlyPrice
        },
        contractMonths: getRandomNumber(1, 12)
      }
    }
    
    billboards.push(billboard)
  }
  
  // Generate Digital Billboards
  for (let i = 0; i < digitalCount; i++) {
    const maxClients = getRandomNumber(5, 15)
    const currentClients = generateDigitalClients(maxClients)
    const availableSlots = maxClients - currentClients.length
    
    // Determine status based on occupancy
    let status: BillboardStatus
    if (availableSlots === maxClients) status = 'available'
    else if (availableSlots === 0) status = 'occupied'
    else if (availableSlots <= 2) status = 'confirmed'
    else status = 'reserved'
    
    const billboard: DigitalBillboard = {
      id: `VD${String(i + 1).padStart(4, '0')}`,
      type: 'digital',
      location: getRandomElement(locations),
      size: {
        width_meters: getRandomNumber(2, 10),
        height_meters: getRandomNumber(1.5, 8),
        width_pixels: getRandomNumber(1080, 3840),
        height_pixels: getRandomNumber(1920, 2160)
      },
      maxClients,
      currentClients,
      pricePerSpot: getRandomNumber(15, 50),
      pricePerHour: getRandomNumber(8, 30),
      pricePerDay: getRandomNumber(80, 200),
      pricePerWeek: getRandomNumber(500, 1200),
      pricePerMonth: getRandomNumber(2000, 5000),
      status,
      availableSlots
    }
    
    billboards.push(billboard)
  }
  
  return billboards
}