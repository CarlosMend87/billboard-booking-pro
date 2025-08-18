// Mock inventory data exactly as specified in the requirements
export interface InventoryAsset {
  id: string;
  tipo: "espectacular" | "muro" | "valla" | "parabus" | "digital";
  nombre: string;
  lat: number;
  lng: number;
  medidas: {
    ancho_m?: number;
    alto_m?: number;
    base_m?: number;
    caras: number;
    modulos?: number;
  };
  digital?: {
    loop_seg: number;
    slot_seg: number;
  };
  contratacion: {
    mensual?: boolean;
    catorcenal?: boolean;
    rotativo?: boolean;
    spot?: boolean;
    hora?: boolean;
    dia?: boolean;
    cpm?: boolean;
  };
  precio: {
    mensual?: number;
    spot?: number;
    hora?: number;
    dia?: number;
    cpm?: number;
  };
  estado: "disponible" | "reservado" | "ocupado";
  propietario?: string;
  foto: string;
}

export const mockInventoryAssets: InventoryAsset[] = [
  {
    "id": "VF0001",
    "tipo": "espectacular",
    "nombre": "Aeropuerto Internacional",
    "lat": 19.435,
    "lng": -99.085,
    "medidas": {"ancho_m": 12.9, "alto_m": 7.2, "caras": 2},
    "contratacion": {"mensual": true, "rotativo": true},
    "precio": {"mensual": 25000},
    "estado": "disponible",
    "propietario": "JCDecaux",
    "foto": "https://picsum.photos/seed/vf0001/800/450"
  },
  {
    "id": "MU0010",
    "tipo": "muro",
    "nombre": "Centro Histórico - Muro Sur",
    "lat": 19.433,
    "lng": -99.133,
    "medidas": {"base_m": 12, "alto_m": 30, "caras": 1},
    "contratacion": {"mensual": true},
    "precio": {"mensual": 32000},
    "estado": "reservado",
    "propietario": "Rentable",
    "foto": "https://picsum.photos/seed/mu0010/800/450"
  },
  {
    "id": "VA0123",
    "tipo": "valla",
    "nombre": "Periférico Norte",
    "lat": 19.55,
    "lng": -99.22,
    "medidas": {"ancho_m": 4.5, "alto_m": 2.1, "modulos": 1, "caras": 1},
    "contratacion": {"catorcenal": true},
    "precio": {"mensual": 14000},
    "estado": "disponible",
    "propietario": "Grupo Vallas",
    "foto": "https://picsum.photos/seed/va0123/800/450"
  },
  {
    "id": "PB090",
    "tipo": "parabus",
    "nombre": "Reforma 123 - Parabús",
    "lat": 19.432,
    "lng": -99.15,
    "medidas": {"ancho_m": 1.77, "alto_m": 1.22, "caras": 1},
    "contratacion": {"catorcenal": true},
    "precio": {"mensual": 8000},
    "estado": "disponible",
    "propietario": "Visual Shot",
    "foto": "https://picsum.photos/seed/pb090/800/450"
  },
  {
    "id": "DG002",
    "tipo": "digital",
    "nombre": "Plaza Comercial - Pantalla LED",
    "lat": 19.41,
    "lng": -99.16,
    "medidas": {"ancho_m": 8, "alto_m": 4, "caras": 1},
    "digital": {"loop_seg": 60, "slot_seg": 10},
    "contratacion": {"spot": true, "hora": true, "dia": true, "cpm": true},
    "precio": {"spot": 15, "hora": 600, "dia": 4000, "cpm": 80},
    "estado": "disponible",
    "propietario": "IMU",
    "foto": "https://picsum.photos/seed/dg002/800/450"
  },
  {
    "id": "VF0002",
    "tipo": "espectacular",
    "nombre": "Insurgentes Centro",
    "lat": 19.421,
    "lng": -99.165,
    "medidas": {"ancho_m": 12.9, "alto_m": 7.2, "caras": 2},
    "contratacion": {"mensual": true, "rotativo": true},
    "precio": {"mensual": 28000},
    "estado": "disponible",
    "propietario": "Global",
    "foto": "https://picsum.photos/seed/vf0002/800/450"
  },
  {
    "id": "MU0011",
    "tipo": "muro",
    "nombre": "Polanco - Muro Este",
    "lat": 19.434,
    "lng": -99.195,
    "medidas": {"base_m": 15, "alto_m": 25, "caras": 1},
    "contratacion": {"mensual": true},
    "precio": {"mensual": 45000},
    "estado": "ocupado",
    "propietario": "G8",
    "foto": "https://picsum.photos/seed/mu0011/800/450"
  },
  {
    "id": "VA0124",
    "tipo": "valla",
    "nombre": "Viaducto Sur",
    "lat": 19.405,
    "lng": -99.180,
    "medidas": {"ancho_m": 4.5, "alto_m": 2.1, "modulos": 1, "caras": 1},
    "contratacion": {"catorcenal": true},
    "precio": {"mensual": 12000},
    "estado": "disponible",
    "propietario": "Grupo Pol",
    "foto": "https://picsum.photos/seed/va0124/800/450"
  },
  {
    "id": "PB091",
    "tipo": "parabus",
    "nombre": "Santa Fe - Parabús",
    "lat": 19.360,
    "lng": -99.259,
    "medidas": {"ancho_m": 1.77, "alto_m": 1.22, "caras": 1},
    "contratacion": {"catorcenal": true},
    "precio": {"mensual": 9500},
    "estado": "disponible",
    "propietario": "ATM",
    "foto": "https://picsum.photos/seed/pb091/800/450"
  },
  {
    "id": "DG003",
    "tipo": "digital",
    "nombre": "Centro Comercial - LED Exterior",
    "lat": 19.405,
    "lng": -99.170,
    "medidas": {"ancho_m": 6, "alto_m": 3, "caras": 1},
    "digital": {"loop_seg": 45, "slot_seg": 15},
    "contratacion": {"spot": true, "hora": true, "dia": true, "cpm": true},
    "precio": {"spot": 12, "hora": 450, "dia": 3200, "cpm": 65},
    "estado": "disponible",
    "propietario": "Memije",
    "foto": "https://picsum.photos/seed/dg003/800/450"
  },
  {
    "id": "VA0125",
    "tipo": "valla",
    "nombre": "Circuito Interior - Módulo Continuo",
    "lat": 19.428,
    "lng": -99.188,
    "medidas": {"ancho_m": 22.5, "alto_m": 2.1, "modulos": 5, "caras": 1},
    "contratacion": {"catorcenal": true},
    "precio": {"mensual": 35000},
    "estado": "disponible",
    "propietario": "Mepexa",
    "foto": "https://picsum.photos/seed/va0125/800/450"
  },
  {
    "id": "DG004",
    "tipo": "digital",
    "nombre": "Aeropuerto T2 - Pantalla Premium",
    "lat": 19.436,
    "lng": -99.072,
    "medidas": {"ancho_m": 10, "alto_m": 6, "caras": 1},
    "digital": {"loop_seg": 90, "slot_seg": 20},
    "contratacion": {"spot": true, "hora": true, "dia": true, "cpm": true},
    "precio": {"spot": 25, "hora": 850, "dia": 6500, "cpm": 120},
    "estado": "disponible",
    "propietario": "JCDecaux",
    "foto": "https://picsum.photos/seed/dg004/800/450"
  }
];

export const propietarios = [
  "JCDecaux", "Rentable", "Grupo Vallas", "Visual Shot", "IMU", 
  "Global", "G8", "Grupo Pol", "ATM", "Memije", "Mepexa"
];

export const categoriasPOI = [
  "Bars", "Restaurants", "McDonalds", "Starbucks", "Hospitals", 
  "Car Dealerships", "Convenience Stores", "Supermarkets", "Shopping Malls",
  "Universities", "Airports", "Metro Stations", "Bus Terminals", "Hotels"
];

// Catorcenas del año (mock simplificado)
export const catorcenas2024 = [
  { numero: 1, inicio: "2024-01-01", fin: "2024-01-14", periodo: "C01-2024" },
  { numero: 2, inicio: "2024-01-15", fin: "2024-01-28", periodo: "C02-2024" },
  { numero: 3, inicio: "2024-01-29", fin: "2024-02-11", periodo: "C03-2024" },
  { numero: 4, inicio: "2024-02-12", fin: "2024-02-25", periodo: "C04-2024" },
  { numero: 5, inicio: "2024-02-26", fin: "2024-03-10", periodo: "C05-2024" },
  { numero: 6, inicio: "2024-03-11", fin: "2024-03-24", periodo: "C06-2024" },
  // Add more catorcenas as needed...
];