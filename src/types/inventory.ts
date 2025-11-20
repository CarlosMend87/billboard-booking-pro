// Shared types for inventory filtering and management

export interface AdvancedFiltersState {
  billboardTypes: string[];
  modalidades: string[];
  priceRange: [number, number];
  proximityFilters: string[];
  hasComputerVision: boolean | null;
}

export interface InventoryFilters {
  location: string;
  startDate: Date | null;
  endDate: Date | null;
  advancedFilters: AdvancedFiltersState;
  sortBy: string;
}
