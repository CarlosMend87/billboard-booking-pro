import React, { createContext, useContext, ReactNode } from "react";
import { useCartWithValidation } from "@/hooks/useCartWithValidation";
import { FloatingCartItem } from "@/components/cart/FloatingCart";

interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface AddToCartParams {
  billboardId: string;
  nombre: string;
  ubicacion: string;
  tipo: string;
  precio: number;
  ownerId?: string;
  medidas?: { ancho?: number; alto?: number };
  foto?: string;
}

interface CartValidationContextType {
  items: FloatingCartItem[];
  isValidating: boolean;
  isTransferring: boolean;
  isLoadingFromDb: boolean;
  hasConflicts: boolean;
  activeDates: DateRange | null;
  addToCart: (params: AddToCartParams, dates: DateRange) => Promise<{ success: boolean; error?: string }>;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  revalidateCart: (newDates: DateRange) => Promise<void>;
  isInCart: (billboardId: string) => boolean;
  transferToBookingWizard: () => Promise<boolean>;
  loadFromPropuesta: (propuestaItems: FloatingCartItem[], propuestaDates: DateRange | null) => void;
  itemCount: number;
  validItemCount: number;
  total: number;
}

const CartValidationContext = createContext<CartValidationContextType | undefined>(undefined);

interface CartValidationProviderProps {
  children: ReactNode;
}

export function CartValidationProvider({ children }: CartValidationProviderProps) {
  const cartState = useCartWithValidation();

  return (
    <CartValidationContext.Provider value={cartState}>
      {children}
    </CartValidationContext.Provider>
  );
}

export function useCartValidation(): CartValidationContextType {
  const context = useContext(CartValidationContext);
  if (context === undefined) {
    throw new Error("useCartValidation must be used within a CartValidationProvider");
  }
  return context;
}
