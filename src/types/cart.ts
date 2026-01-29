import { InventoryAsset } from "@/lib/mockInventory";

// Campaign types (previously in CampaignContext)
export type CampaignSearchMethod = 'mensual' | 'dia' | 'spot' | 'full' | 'catorcenal';

export interface CampaignInfo {
  id?: string;
  nombre: string;
  propuesta: string;
  presupuesto: number;
  metodo: CampaignSearchMethod;
}
export type CartItemModalidad = 
  | 'mensual' 
  | 'catorcenal' 
  | 'semanal' 
  | 'spot' 
  | 'hora' 
  | 'dia' 
  | 'cpm';

export interface CartItemConfig {
  // For traditional
  meses?: number;
  catorcenas?: number;
  
  // For digital
  spotsDia?: number;
  horas?: number;
  dias?: number;
  impresiones?: number;
  
  // Common
  fechaInicio?: string;
  fechaFin?: string;
  periodo?: string; // For catorcenas like "C01-2024,C02-2024"
  
  // Descuento
  codigoDescuentoId?: string;
  
  // Creativos
  creativos?: {
    archivos?: { [resolucion: string]: File | null };
    quienImprime?: 'cliente' | 'propietario';
    fechaEnvioMaterial?: string;
  };
}

export interface CartItem {
  id: string;
  asset: InventoryAsset;
  modalidad: CartItemModalidad;
  config: CartItemConfig;
  precioUnitario: number;
  subtotal: number;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
  itemCount: number;
  campaignInfo?: CampaignInfo | null;
}