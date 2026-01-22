import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FloatingCartItem } from "@/components/cart/FloatingCart";
import { toast } from "sonner";

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

interface DateRange {
  startDate: Date;
  endDate: Date;
}

// Storage keys - using consistent naming
const CART_STORAGE_KEY = "dooh_floating_cart";
const DATES_STORAGE_KEY = "dooh_cart_dates";

// Transfer data to legacy cart context format
const LEGACY_CART_KEY = "cart";

export function useCartWithValidation() {
  const [items, setItems] = useState<FloatingCartItem[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [activeDates, setActiveDates] = useState<DateRange | null>(null);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      const savedDates = localStorage.getItem(DATES_STORAGE_KEY);
      
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        // Convert date strings back to Date objects
        const cartItems: FloatingCartItem[] = parsed.map((item: any) => ({
          ...item,
          fechaInicio: new Date(item.fechaInicio),
          fechaFin: new Date(item.fechaFin),
        }));
        setItems(cartItems);
      }
      
      if (savedDates) {
        const dates = JSON.parse(savedDates);
        setActiveDates({
          startDate: new Date(dates.startDate),
          endDate: new Date(dates.endDate),
        });
      }
    } catch (err) {
      console.error("Error loading cart from storage:", err);
    }
  }, []);

  // Save cart to localStorage when items change
  useEffect(() => {
    if (items.length > 0) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } else {
      localStorage.removeItem(CART_STORAGE_KEY);
    }
  }, [items]);

  // Save dates to localStorage when they change
  useEffect(() => {
    if (activeDates) {
      localStorage.setItem(DATES_STORAGE_KEY, JSON.stringify(activeDates));
    }
  }, [activeDates]);

  // Backend availability check using RPC
  const checkAvailabilityBackend = useCallback(async (
    billboardId: string,
    startDate: Date,
    endDate: Date
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .rpc("check_billboard_availability", {
          p_billboard_id: billboardId,
          p_start_date: startDate.toISOString().split('T')[0],
          p_end_date: endDate.toISOString().split('T')[0],
        });

      if (error) {
        console.error("Availability check error:", error);
        return false;
      }
      
      return data as boolean;
    } catch (err) {
      console.error("Error checking availability:", err);
      return false;
    }
  }, []);

  // Add item to cart with backend validation
  const addToCart = useCallback(async (
    params: AddToCartParams,
    dates: DateRange
  ): Promise<{ success: boolean; error?: string }> => {
    // Validate dates are selected
    if (!dates.startDate || !dates.endDate) {
      toast.error("Selecciona fechas antes de agregar al carrito");
      return { success: false, error: "Fechas requeridas" };
    }

    // Check if item already in cart
    const existingItem = items.find(item => item.billboardId === params.billboardId);
    if (existingItem) {
      toast.info("Esta pantalla ya está en tu carrito");
      return { success: false, error: "Ya está en el carrito" };
    }

    setIsValidating(true);

    try {
      // CRITICAL: Backend validation
      const isAvailable = await checkAvailabilityBackend(
        params.billboardId,
        dates.startDate,
        dates.endDate
      );

      if (!isAvailable) {
        toast.error("Esta pantalla no está disponible en las fechas seleccionadas");
        return { success: false, error: "No disponible" };
      }

      // Create cart item with all necessary data
      const newItem: FloatingCartItem = {
        id: `${params.billboardId}-${Date.now()}`,
        billboardId: params.billboardId,
        nombre: params.nombre,
        ubicacion: params.ubicacion,
        tipo: params.tipo,
        precio: params.precio,
        fechaInicio: dates.startDate,
        fechaFin: dates.endDate,
        isValid: true,
        ownerId: params.ownerId,
        medidas: params.medidas,
        foto: params.foto,
      };

      setItems(prev => [...prev, newItem]);
      setActiveDates(dates);
      
      toast.success("Pantalla agregada al carrito", {
        description: `${params.nombre} del ${dates.startDate.toLocaleDateString('es-MX')} al ${dates.endDate.toLocaleDateString('es-MX')}`,
      });

      return { success: true };
    } catch (err) {
      console.error("Error adding to cart:", err);
      toast.error("Error al validar disponibilidad");
      return { success: false, error: "Error de validación" };
    } finally {
      setIsValidating(false);
    }
  }, [items, checkAvailabilityBackend]);

  // Remove item from cart
  const removeFromCart = useCallback((itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
    toast.success("Pantalla eliminada del carrito");
  }, []);

  // Clear entire cart
  const clearCart = useCallback(() => {
    setItems([]);
    setActiveDates(null);
    localStorage.removeItem(CART_STORAGE_KEY);
    localStorage.removeItem(DATES_STORAGE_KEY);
    toast.success("Carrito limpiado");
  }, []);

  // Revalidate all items when dates change
  const revalidateCart = useCallback(async (newDates: DateRange) => {
    if (items.length === 0) {
      setActiveDates(newDates);
      return;
    }

    setIsValidating(true);
    setActiveDates(newDates);

    try {
      const validatedItems = await Promise.all(
        items.map(async (item) => {
          const isAvailable = await checkAvailabilityBackend(
            item.billboardId,
            newDates.startDate,
            newDates.endDate
          );

          return {
            ...item,
            fechaInicio: newDates.startDate,
            fechaFin: newDates.endDate,
            isValid: isAvailable,
            validationError: isAvailable ? undefined : "No disponible en las nuevas fechas",
          };
        })
      );

      setItems(validatedItems);

      const invalidCount = validatedItems.filter(i => !i.isValid).length;
      if (invalidCount > 0) {
        toast.warning(`${invalidCount} pantalla${invalidCount !== 1 ? 's' : ''} ya no ${invalidCount !== 1 ? 'están' : 'está'} disponible${invalidCount !== 1 ? 's' : ''} en las nuevas fechas`);
      }
    } catch (err) {
      console.error("Error revalidating cart:", err);
      toast.error("Error al revalidar disponibilidad");
    } finally {
      setIsValidating(false);
    }
  }, [items, checkAvailabilityBackend]);

  // Check if a billboard is in cart
  const isInCart = useCallback((billboardId: string) => {
    return items.some(item => item.billboardId === billboardId);
  }, [items]);

  // CRITICAL: Transfer cart data to legacy CartContext format for BookingWizard
  const transferToBookingWizard = useCallback(async (): Promise<boolean> => {
    // Only transfer valid items
    const validItems = items.filter(i => i.isValid);
    
    if (validItems.length === 0) {
      toast.error("No hay pantallas válidas en el carrito");
      return false;
    }

    // Final validation before transfer
    setIsValidating(true);
    
    try {
      // Revalidate all items one more time
      const revalidated = await Promise.all(
        validItems.map(async (item) => {
          const isAvailable = await checkAvailabilityBackend(
            item.billboardId,
            item.fechaInicio,
            item.fechaFin
          );
          return { ...item, isValid: isAvailable };
        })
      );

      const stillValid = revalidated.filter(i => i.isValid);
      
      if (stillValid.length === 0) {
        toast.error("Las pantallas ya no están disponibles. Intenta con otras fechas.");
        setItems(revalidated.map(item => ({
          ...item,
          validationError: item.isValid ? undefined : "Ya no disponible"
        })));
        return false;
      }

      if (stillValid.length < validItems.length) {
        toast.warning(`${validItems.length - stillValid.length} pantalla(s) ya no están disponibles`);
      }

      // Build legacy cart format that BookingWizard expects
      const legacyCartItems = stillValid.map(item => ({
        id: `${item.billboardId}-mensual-{}`,
        asset: {
          id: item.billboardId,
          nombre: item.nombre,
          tipo: item.tipo,
          lat: 0,
          lng: 0,
          medidas: {
            ancho: item.medidas?.ancho || 0,
            alto: item.medidas?.alto || 0,
            caras: 1,
          },
          contratacion: {
            mensual: true,
          },
          precio: {
            mensual: item.precio,
          },
          estado: "disponible" as const,
          foto: item.foto || "/placeholder.svg",
          owner_id: item.ownerId,
        },
        modalidad: "mensual" as const,
        config: {
          meses: 1,
          fechaInicio: item.fechaInicio.toISOString().split('T')[0],
          fechaFin: item.fechaFin.toISOString().split('T')[0],
        },
        precioUnitario: item.precio,
        subtotal: item.precio,
        quantity: 1,
      }));

      const legacyCart = {
        items: legacyCartItems,
        total: stillValid.reduce((sum, i) => sum + i.precio, 0),
        itemCount: stillValid.length,
        campaignInfo: null,
      };

      // Store in legacy format for BookingWizard
      localStorage.setItem(LEGACY_CART_KEY, JSON.stringify(legacyCart));
      
      // Update our items to reflect final state
      setItems(revalidated);

      return true;
    } catch (err) {
      console.error("Error transferring cart:", err);
      toast.error("Error al preparar la reserva");
      return false;
    } finally {
      setIsValidating(false);
    }
  }, [items, checkAvailabilityBackend]);

  return {
    items,
    isValidating,
    activeDates,
    addToCart,
    removeFromCart,
    clearCart,
    revalidateCart,
    isInCart,
    transferToBookingWizard,
    itemCount: items.length,
    validItemCount: items.filter(i => i.isValid).length,
    total: items.filter(i => i.isValid).reduce((sum, item) => sum + item.precio, 0),
  };
}