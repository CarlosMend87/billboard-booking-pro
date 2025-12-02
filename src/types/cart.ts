import { InventoryAsset } from "@/lib/mockInventory";
import { CampaignInfo } from "@/context/CampaignContext";

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