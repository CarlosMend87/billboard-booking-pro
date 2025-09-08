// Mock inventory data exactly as specified in the requirements
export interface InventoryAsset {
  id: string;
  tipo: "espectacular" | "muro" | "valla" | "parabus" | "digital";
  nombre: string;
  lat: number;
  lng: number;
  owner_id?: string;
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
    descuento_volumen?: number;
    precio_original?: number;
  };
  estado: "disponible" | "reservado" | "ocupado" | "en_revision" | "aceptado";
  propietario?: string;
  foto: string;
  metricas?: {
    ingresos_mensuales?: number;
    descuento_aplicado?: number;
    fecha_ultima_reserva?: string;
    cliente_actual?: string;
  };
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
    "precio": {"mensual": 25000, "descuento_volumen": 8, "precio_original": 27000},
    "estado": "en_revision",
    "propietario": "JCDecaux",
    "foto": "https://static.wixstatic.com/media/3aa6d8_ec45742e0c7642e29fff05d6e9636202~mv2.png/v1/fill/w_980,h_651,al_c,q_90,usm_0.66_1.00_0.01,enc_avif,quality_auto/Espectacular%202.png"
  },
  {
    "id": "MU0010",
    "tipo": "muro",
    "nombre": "Centro Histórico - Muro Sur",
    "lat": 19.433,
    "lng": -99.133,
    "medidas": {"base_m": 12, "alto_m": 30, "caras": 1},
    "contratacion": {"mensual": true},
    "precio": {"mensual": 32000, "descuento_volumen": 5, "precio_original": 33600},
    "estado": "aceptado",
    "propietario": "Rentable",
    "foto": "https://static.wixstatic.com/media/3aa6d8_ec45742e0c7642e29fff05d6e9636202~mv2.png/v1/fill/w_980,h_651,al_c,q_90,usm_0.66_1.00_0.01,enc_avif,quality_auto/Espectacular%202.png"
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
    "foto": "https://static.wixstatic.com/media/3aa6d8_ec45742e0c7642e29fff05d6e9636202~mv2.png/v1/fill/w_980,h_651,al_c,q_90,usm_0.66_1.00_0.01,enc_avif,quality_auto/Espectacular%202.png"
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
    "foto": "https://static.wixstatic.com/media/3aa6d8_ec45742e0c7642e29fff05d6e9636202~mv2.png/v1/fill/w_980,h_651,al_c,q_90,usm_0.66_1.00_0.01,enc_avif,quality_auto/Espectacular%202.png"
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
    "precio": {"spot": 15, "hora": 600, "dia": 4000, "cpm": 80, "descuento_volumen": 12, "precio_original": 4500},
    "estado": "en_revision",
    "propietario": "IMU",
    "foto": "https://static.wixstatic.com/media/3aa6d8_ec45742e0c7642e29fff05d6e9636202~mv2.png/v1/fill/w_980,h_651,al_c,q_90,usm_0.66_1.00_0.01,enc_avif,quality_auto/Espectacular%202.png"
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
    "foto": "https://static.wixstatic.com/media/3aa6d8_ec45742e0c7642e29fff05d6e9636202~mv2.png/v1/fill/w_980,h_651,al_c,q_90,usm_0.66_1.00_0.01,enc_avif,quality_auto/Espectacular%202.png"
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
    "foto": "https://static.wixstatic.com/media/3aa6d8_ec45742e0c7642e29fff05d6e9636202~mv2.png/v1/fill/w_980,h_651,al_c,q_90,usm_0.66_1.00_0.01,enc_avif,quality_auto/Espectacular%202.png"
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
    "foto": "https://static.wixstatic.com/media/3aa6d8_ec45742e0c7642e29fff05d6e9636202~mv2.png/v1/fill/w_980,h_651,al_c,q_90,usm_0.66_1.00_0.01,enc_avif,quality_auto/Espectacular%202.png"
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
    "foto": "https://static.wixstatic.com/media/3aa6d8_ec45742e0c7642e29fff05d6e9636202~mv2.png/v1/fill/w_980,h_651,al_c,q_90,usm_0.66_1.00_0.01,enc_avif,quality_auto/Espectacular%202.png"
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
    "foto": "https://static.wixstatic.com/media/3aa6d8_ec45742e0c7642e29fff05d6e9636202~mv2.png/v1/fill/w_980,h_651,al_c,q_90,usm_0.66_1.00_0.01,enc_avif,quality_auto/Espectacular%202.png"
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
    "foto": "https://static.wixstatic.com/media/3aa6d8_ec45742e0c7642e29fff05d6e9636202~mv2.png/v1/fill/w_980,h_651,al_c,q_90,usm_0.66_1.00_0.01,enc_avif,quality_auto/Espectacular%202.png"
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
    "foto": "https://static.wixstatic.com/media/3aa6d8_ec45742e0c7642e29fff05d6e9636202~mv2.png/v1/fill/w_980,h_651,al_c,q_90,usm_0.66_1.00_0.01,enc_avif,quality_auto/Espectacular%202.png"
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

// Catorcenas del año (completo)
export const catorcenas2024 = [
  { numero: 1, inicio: "2024-12-24", fin: "2025-01-06", periodo: "C01-2025" },
  { numero: 2, inicio: "2025-01-07", fin: "2025-01-20", periodo: "C02-2025" },
  { numero: 3, inicio: "2025-01-21", fin: "2025-02-03", periodo: "C03-2025" },
  { numero: 4, inicio: "2025-02-04", fin: "2025-02-17", periodo: "C04-2025" },
  { numero: 5, inicio: "2025-02-18", fin: "2025-03-03", periodo: "C05-2025" },
  { numero: 6, inicio: "2025-03-04", fin: "2025-03-17", periodo: "C06-2025" },
  { numero: 7, inicio: "2025-03-18", fin: "2025-03-31", periodo: "C07-2025" },
  { numero: 8, inicio: "2025-04-01", fin: "2025-04-14", periodo: "C08-2025" },
  { numero: 9, inicio: "2025-04-15", fin: "2025-04-28", periodo: "C09-2025" },
  { numero: 10, inicio: "2025-04-29", fin: "2025-05-12", periodo: "C10-2025" },
  { numero: 11, inicio: "2025-05-13", fin: "2025-05-26", periodo: "C11-2025" },
  { numero: 12, inicio: "2025-05-27", fin: "2025-06-09", periodo: "C12-2025" },
  { numero: 13, inicio: "2025-06-10", fin: "2025-06-23", periodo: "C13-2025" },
  { numero: 14, inicio: "2025-06-24", fin: "2025-07-07", periodo: "C14-2025" },
  { numero: 15, inicio: "2025-07-08", fin: "2025-07-21", periodo: "C15-2025" },
  { numero: 16, inicio: "2025-07-22", fin: "2025-08-04", periodo: "C16-2025" },
  { numero: 17, inicio: "2025-08-05", fin: "2025-08-18", periodo: "C17-2025" },
  { numero: 18, inicio: "2025-08-19", fin: "2025-09-01", periodo: "C18-2025" },
  { numero: 19, inicio: "2025-09-02", fin: "2025-09-15", periodo: "C19-2025" },
  { numero: 20, inicio: "2025-09-16", fin: "2025-09-29", periodo: "C20-2025" },
  { numero: 21, inicio: "2025-09-30", fin: "2025-10-13", periodo: "C21-2025" },
  { numero: 22, inicio: "2025-10-14", fin: "2025-10-27", periodo: "C22-2025" },
  { numero: 23, inicio: "2025-10-28", fin: "2025-11-10", periodo: "C23-2025" },
  { numero: 24, inicio: "2025-11-11", fin: "2025-11-24", periodo: "C24-2025" },
  { numero: 25, inicio: "2025-11-25", fin: "2025-12-08", periodo: "C25-2025" },
  { numero: 26, inicio: "2025-12-09", fin: "2025-12-22", periodo: "C26-2025" }
];