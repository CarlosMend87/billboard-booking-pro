import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FloatingCartItem } from "@/components/cart/FloatingCart";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useRealtimeCartConflicts } from "./useRealtimeCartConflicts";
import { buildLegacyCartFromFloatingItems } from "@/lib/cartLegacy";

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

/**
 * CRITICAL: Storage keys are namespaced per user to prevent data leakage
 * Format: cart_anunciante_<user_id>
 */
function getStorageKey(userId: string | undefined, suffix: string): string {
  if (!userId) return `cart_anonymous_${suffix}`;
  return `cart_anunciante_${userId}_${suffix}`;
}

// Debounce timeout for DB sync
const DB_SYNC_DEBOUNCE = 1000;

export function useCartWithValidation() {
  const { user } = useAuth();
  const { role } = useUserRole();
  const [items, setItems] = useState<FloatingCartItem[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [activeDates, setActiveDates] = useState<DateRange | null>(null);
  const [isLoadingFromDb, setIsLoadingFromDb] = useState(false);
  const [hasConflicts, setHasConflicts] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasLoadedFromDb = useRef(false);
  const latestItemsRef = useRef<FloatingCartItem[]>([]);
  const latestDatesRef = useRef<DateRange | null>(null);

  // Dynamic storage keys based on user ID (namespaced for isolation)
  const CART_STORAGE_KEY = getStorageKey(user?.id, "items");
  const DATES_STORAGE_KEY = getStorageKey(user?.id, "dates");
  const CART_META_KEY = getStorageKey(user?.id, "meta");
  const LEGACY_CART_KEY = getStorageKey(user?.id, "legacy");

  /**
   * CRITICAL: Check if cart operations are allowed
   * Cart is ONLY for advertisers - block all operations for other roles
   */
  const isCartAllowed = role === 'advertiser';

  const writeCartMeta = useCallback((updatedAtIso: string) => {
    if (!isCartAllowed) return;
    try {
      localStorage.setItem(CART_META_KEY, JSON.stringify({ updatedAt: updatedAtIso }));
    } catch {
      // ignore
    }
  }, [CART_META_KEY, isCartAllowed]);

  const readCartMetaUpdatedAt = useCallback((): Date | null => {
    if (!isCartAllowed) return null;
    try {
      const raw = localStorage.getItem(CART_META_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { updatedAt?: string };
      if (!parsed?.updatedAt) return null;
      const d = new Date(parsed.updatedAt);
      return Number.isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  }, [CART_META_KEY, isCartAllowed]);

  const persistCartToStorage = useCallback((nextItems: FloatingCartItem[], nextDates: DateRange | null) => {
    if (!isCartAllowed) return;
    
    const nowIso = new Date().toISOString();
    if (nextItems.length > 0) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(nextItems));
    } else {
      localStorage.removeItem(CART_STORAGE_KEY);
    }

    if (nextDates) {
      localStorage.setItem(DATES_STORAGE_KEY, JSON.stringify(nextDates));
    } else {
      localStorage.removeItem(DATES_STORAGE_KEY);
    }

    writeCartMeta(nowIso);
  }, [writeCartMeta, CART_STORAGE_KEY, DATES_STORAGE_KEY, isCartAllowed]);

  // Handle real-time conflict detection (defined before use by useRealtimeCartConflicts)
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

  // Subscribe to real-time conflicts - important: call hook unconditionally
  useRealtimeCartConflicts({
    items,
    onConflictDetected: handleConflictDetected,
    enabled: items.length > 0,
  });

  // Load cart from database for authenticated ADVERTISERS only
  const loadCartFromDatabase = useCallback(async () => {
    // CRITICAL: Only load cart for advertisers
    if (!user?.id || !isCartAllowed || hasLoadedFromDb.current) return;
    
    setIsLoadingFromDb(true);
    try {
      // Use raw query to avoid type issues with new table
      const { data, error } = await supabase
        .from("user_carts" as any)
        .select("items, active_dates, updated_at")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error loading cart from DB:", error);
        return;
      }

      if (data) {
        // Parse items from JSON - cast through unknown for type safety
        const record = data as unknown as { items: any[]; active_dates: any; updated_at?: string };
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

        // Decide fuente de verdad:
        // - Si hay carrito local (misma sesión/dispositivo) y es más nuevo, NO dejar que la BD lo sobreescriba.
        // - Si no hay carrito local, o la BD es más nueva, hidratar desde BD.
        const localUpdatedAt = readCartMetaUpdatedAt();
        const dbUpdatedAt = record.updated_at ? new Date(record.updated_at) : null;

        const localHasCart = latestItemsRef.current.length > 0 || Boolean(localStorage.getItem(CART_STORAGE_KEY));
        const dbIsNewer = !!(dbUpdatedAt && (!localUpdatedAt || dbUpdatedAt.getTime() > localUpdatedAt.getTime()));

        const shouldHydrateFromDb = !localHasCart || dbIsNewer;

        if (shouldHydrateFromDb) {
          setItems(parsedItems);
          setActiveDates(parsedDates);
          persistCartToStorage(parsedItems, parsedDates);
          latestItemsRef.current = parsedItems;
          latestDatesRef.current = parsedDates;
        }
      }
      
      hasLoadedFromDb.current = true;
      setIsHydrated(true);
    } catch (err) {
      console.error("Error loading cart:", err);
      setIsHydrated(true); // Marcar como hidratado aún en error para evitar bloqueo
    } finally {
      setIsLoadingFromDb(false);
    }
  }, [user?.id, isCartAllowed, persistCartToStorage, readCartMetaUpdatedAt, CART_STORAGE_KEY]);

  // Save cart to database (debounced) - ONLY for advertisers
  const saveCartToDatabase = useCallback(async (
    cartItems: FloatingCartItem[], 
    dates: DateRange | null
  ) => {
    // CRITICAL: Only save cart for advertisers
    if (!user?.id || !isCartAllowed) return;

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
      // Include last_activity_at for abandoned cart tracking
      const { error } = await supabase
        .from("user_carts" as any)
        .upsert({
          user_id: user.id,
          items: itemsForDb,
          active_dates: datesForDb,
          updated_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString(),
        } as any, {
          onConflict: "user_id",
        });

      if (error) {
        console.error("Error saving cart to DB:", error);
      }
    } catch (err) {
      console.error("Error saving cart:", err);
    }
  }, [user?.id, isCartAllowed]);

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

  // Load cart on mount - first from localStorage, then from DB (ONLY for advertisers)
  useEffect(() => {
    // CRITICAL: Don't load cart for non-advertisers
    if (!isCartAllowed) {
      setIsHydrated(true);
      return;
    }
    
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
        latestItemsRef.current = cartItems;
      }
      
      if (savedDates) {
        const dates = JSON.parse(savedDates);
        const parsedDates = {
          startDate: new Date(dates.startDate),
          endDate: new Date(dates.endDate),
        };
        setActiveDates(parsedDates);
        latestDatesRef.current = parsedDates;
      }
    } catch (err) {
      console.error("Error loading cart from storage:", err);
    }
    
    // Si no hay usuario autenticado, marcar como hidratado inmediatamente
    if (!user?.id) {
      setIsHydrated(true);
    }
  }, [user?.id, isCartAllowed, CART_STORAGE_KEY, DATES_STORAGE_KEY]);

  // Keep refs in sync (para evitar carreras en rehidratación y acciones rápidas)
  useEffect(() => {
    latestItemsRef.current = items;
  }, [items]);

  useEffect(() => {
    latestDatesRef.current = activeDates;
  }, [activeDates]);

  // Load from database when user is authenticated (ONLY for advertisers)
  useEffect(() => {
    if (user?.id && isCartAllowed) {
      loadCartFromDatabase();
    } else {
      hasLoadedFromDb.current = false;
      // Si no hay usuario o no es anunciante, marcar como hidratado
      setIsHydrated(true);
    }
  }, [user?.id, isCartAllowed, loadCartFromDatabase]);

  // Save to localStorage and schedule DB sync when items change
  // IMPORTANTE: Solo sincronizar DESPUÉS de la hidratación para evitar borrar datos de la BD
  useEffect(() => {
    // No sincronizar si no se ha hidratado todavía
    if (!isHydrated) return;
    
    if (items.length > 0) {
      // Persistencia local inmediata + marca de versión
      persistCartToStorage(items, activeDates);
      scheduleDatabaseSync(items, activeDates);
    } else {
      persistCartToStorage([], null);
      if (user?.id) {
        // Clear from DB too
        saveCartToDatabase([], null);
      }
    }
  }, [items, activeDates, scheduleDatabaseSync, saveCartToDatabase, user?.id, persistCartToStorage, isHydrated]);

  // Nota: la persistencia de fechas ya se maneja en persistCartToStorage para evitar estados inconsistentes.

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

  // Add item to cart with backend validation (ONLY for advertisers)
  const addToCart = useCallback(async (
    params: AddToCartParams,
    dates: DateRange
  ): Promise<{ success: boolean; error?: string }> => {
    // CRITICAL: Block cart operations for non-advertisers
    if (!isCartAllowed) {
      console.warn("Cart operations are only allowed for advertisers");
      return { success: false, error: "Operación no permitida" };
    }
    
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
  }, [items, checkAvailabilityBackend, isCartAllowed]);

  // Remove item from cart
  const removeFromCart = useCallback((itemId: string) => {
    // Evita “revivir” por debounce: persistimos local inmediato y dejamos que el sync escriba a BD.
    const nextItems = latestItemsRef.current.filter(item => item.id !== itemId);
    setItems(nextItems);
    persistCartToStorage(nextItems, latestDatesRef.current);
    toast.success("Pantalla eliminada del carrito");
  }, [persistCartToStorage]);

  // Clear entire cart
  const clearCart = useCallback(() => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }
    setItems([]);
    setActiveDates(null);
    persistCartToStorage([], null);
    
    // Clear from database
    if (user?.id) {
      saveCartToDatabase([], null);
    }
    
    toast.success("Carrito limpiado");
  }, [user?.id, saveCartToDatabase, persistCartToStorage]);

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

  // Transfer cart data to legacy CartContext format for BookingWizard (ONLY for advertisers)
  const transferToBookingWizard = useCallback(async (): Promise<boolean> => {
    // CRITICAL: Block transfer for non-advertisers
    if (!isCartAllowed) {
      console.warn("Cart transfer is only allowed for advertisers");
      return false;
    }
    
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

      const legacyCart = buildLegacyCartFromFloatingItems(stillValid);
      // Use namespaced key for legacy cart
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
  }, [items, checkAvailabilityBackend, isCartAllowed, LEGACY_CART_KEY]);

  // Clear conflict state when cart is cleared or items change
  useEffect(() => {
    if (items.every(item => item.isValid)) {
      setHasConflicts(false);
    }
  }, [items]);

  // Load items from a saved proposal
  const loadFromPropuesta = useCallback((
    propuestaItems: FloatingCartItem[],
    propuestaDates: DateRange | null
  ) => {
    setItems(propuestaItems);
    if (propuestaDates) {
      setActiveDates(propuestaDates);
    }

    // Save to localStorage (versionado)
    persistCartToStorage(propuestaItems, propuestaDates);
    
    toast.success("Propuesta cargada en el carrito", {
      description: `${propuestaItems.length} pantalla${propuestaItems.length !== 1 ? 's' : ''} agregada${propuestaItems.length !== 1 ? 's' : ''}`,
    });
  }, [persistCartToStorage]);

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
    loadFromPropuesta,
    itemCount: items.length,
    validItemCount: items.filter(i => i.isValid).length,
    total: items.filter(i => i.isValid).reduce((sum, item) => sum + item.precio, 0),
  };
}