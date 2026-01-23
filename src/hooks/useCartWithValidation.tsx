import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FloatingCartItem } from "@/components/cart/FloatingCart";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimeCartConflicts } from "./useRealtimeCartConflicts";

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

// Storage keys
const CART_STORAGE_KEY = "dooh_floating_cart";
const DATES_STORAGE_KEY = "dooh_cart_dates";
const LEGACY_CART_KEY = "cart";

// Debounce timeout for DB sync
const DB_SYNC_DEBOUNCE = 1000;

export function useCartWithValidation() {
  const { user } = useAuth();
  const [items, setItems] = useState<FloatingCartItem[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [activeDates, setActiveDates] = useState<DateRange | null>(null);
  const [isLoadingFromDb, setIsLoadingFromDb] = useState(false);
  const [hasConflicts, setHasConflicts] = useState(false);
  
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasLoadedFromDb = useRef(false);

  // Handle real-time conflict detection
  const handleConflictDetected = useCallback((conflictedItemIds: string[]) => {
    setHasConflicts(true);
    
    // Mark conflicted items as invalid
    setItems(prevItems => 
      prevItems.map(item => 
        conflictedItemIds.includes(item.id)
          ? { ...item, isValid: false, validationError: "Reservada por otra persona" }
          : item
      )
    );
  }, []);

  // Subscribe to real-time conflicts
  useRealtimeCartConflicts({
    items,
    onConflictDetected: handleConflictDetected,
    enabled: items.length > 0,
  });

  // Load cart from database for authenticated users
  const loadCartFromDatabase = useCallback(async () => {
    if (!user?.id || hasLoadedFromDb.current) return;
    
    setIsLoadingFromDb(true);
    try {
      // Use raw query to avoid type issues with new table
      const { data, error } = await supabase
        .from("user_carts" as any)
        .select("items, active_dates")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error loading cart from DB:", error);
        return;
      }

      if (data) {
        // Parse items from JSON - cast through unknown for type safety
        const record = data as unknown as { items: any[]; active_dates: any };
        const dbItems = record.items || [];
        const parsedItems: FloatingCartItem[] = dbItems.map((item: any) => ({
          ...item,
          fechaInicio: new Date(item.fechaInicio),
          fechaFin: new Date(item.fechaFin),
        }));

        // Parse dates
        const dbDates = record.active_dates;
        const parsedDates = dbDates ? {
          startDate: new Date(dbDates.startDate),
          endDate: new Date(dbDates.endDate),
        } : null;

        // Update state
        if (parsedItems.length > 0) {
          setItems(parsedItems);
          if (parsedDates) {
            setActiveDates(parsedDates);
          }
          // Also update localStorage
          localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(parsedItems));
          if (parsedDates) {
            localStorage.setItem(DATES_STORAGE_KEY, JSON.stringify(parsedDates));
          }
        }
      }
      
      hasLoadedFromDb.current = true;
    } catch (err) {
      console.error("Error loading cart:", err);
    } finally {
      setIsLoadingFromDb(false);
    }
  }, [user?.id]);

  // Save cart to database (debounced)
  const saveCartToDatabase = useCallback(async (
    cartItems: FloatingCartItem[], 
    dates: DateRange | null
  ) => {
    if (!user?.id) return;

    try {
      // Prepare items for JSON storage (convert Dates to strings)
      const itemsForDb = cartItems.map(item => ({
        ...item,
        fechaInicio: item.fechaInicio.toISOString(),
        fechaFin: item.fechaFin.toISOString(),
      }));

      const datesForDb = dates ? {
        startDate: dates.startDate.toISOString(),
        endDate: dates.endDate.toISOString(),
      } : null;

      // Upsert cart data - use raw query to avoid type issues
      const { error } = await supabase
        .from("user_carts" as any)
        .upsert({
          user_id: user.id,
          items: itemsForDb,
          active_dates: datesForDb,
          updated_at: new Date().toISOString(),
        } as any, {
          onConflict: "user_id",
        });

      if (error) {
        console.error("Error saving cart to DB:", error);
      }
    } catch (err) {
      console.error("Error saving cart:", err);
    }
  }, [user?.id]);

  // Debounced DB sync
  const scheduleDatabaseSync = useCallback((
    cartItems: FloatingCartItem[], 
    dates: DateRange | null
  ) => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    syncTimeoutRef.current = setTimeout(() => {
      saveCartToDatabase(cartItems, dates);
    }, DB_SYNC_DEBOUNCE);
  }, [saveCartToDatabase]);

  // Load cart on mount - first from localStorage, then from DB
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      const savedDates = localStorage.getItem(DATES_STORAGE_KEY);
      
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
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

  // Load from database when user is authenticated
  useEffect(() => {
    if (user?.id) {
      loadCartFromDatabase();
    } else {
      hasLoadedFromDb.current = false;
    }
  }, [user?.id, loadCartFromDatabase]);

  // Save to localStorage and schedule DB sync when items change
  useEffect(() => {
    if (items.length > 0) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      scheduleDatabaseSync(items, activeDates);
    } else {
      localStorage.removeItem(CART_STORAGE_KEY);
      if (user?.id) {
        // Clear from DB too
        saveCartToDatabase([], null);
      }
    }
  }, [items, activeDates, scheduleDatabaseSync, saveCartToDatabase, user?.id]);

  // Save dates to localStorage when they change
  useEffect(() => {
    if (activeDates) {
      localStorage.setItem(DATES_STORAGE_KEY, JSON.stringify(activeDates));
    }
  }, [activeDates]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

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
    if (!dates.startDate || !dates.endDate) {
      toast.error("Selecciona fechas antes de agregar al carrito");
      return { success: false, error: "Fechas requeridas" };
    }

    const existingItem = items.find(item => item.billboardId === params.billboardId);
    if (existingItem) {
      toast.info("Esta pantalla ya está en tu carrito");
      return { success: false, error: "Ya está en el carrito" };
    }

    setIsValidating(true);

    try {
      const isAvailable = await checkAvailabilityBackend(
        params.billboardId,
        dates.startDate,
        dates.endDate
      );

      if (!isAvailable) {
        toast.error("Esta pantalla no está disponible en las fechas seleccionadas");
        return { success: false, error: "No disponible" };
      }

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
    
    // Clear from database
    if (user?.id) {
      saveCartToDatabase([], null);
    }
    
    toast.success("Carrito limpiado");
  }, [user?.id, saveCartToDatabase]);

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

  // Transfer cart data to legacy CartContext format for BookingWizard
  const transferToBookingWizard = useCallback(async (): Promise<boolean> => {
    const validItems = items.filter(i => i.isValid);
    
    if (validItems.length === 0) {
      toast.error("No hay pantallas válidas en el carrito");
      return false;
    }

    setIsTransferring(true);
    
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

      // Build legacy cart format
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

      localStorage.setItem(LEGACY_CART_KEY, JSON.stringify(legacyCart));
      setItems(revalidated);

      return true;
    } catch (err) {
      console.error("Error transferring cart:", err);
      toast.error("Error al preparar la reserva");
      return false;
    } finally {
      setIsTransferring(false);
    }
  }, [items, checkAvailabilityBackend]);

  // Clear conflict state when cart is cleared or items change
  useEffect(() => {
    if (items.every(item => item.isValid)) {
      setHasConflicts(false);
    }
  }, [items]);

  return {
    items,
    isValidating,
    isTransferring,
    isLoadingFromDb,
    hasConflicts,
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