import { useLocation } from "react-router-dom";
import { FloatingCart } from "./FloatingCart";
import { useCartValidation } from "@/context/CartValidationContext";
import { usePropuestas } from "@/hooks/usePropuestas";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { SavePropuestaDialog } from "@/components/propuestas/SavePropuestaDialog";
import { PropuestasDrawer } from "@/components/propuestas/PropuestasDrawer";
import { useNavigate } from "react-router-dom";
import { FloatingCartItem } from "./FloatingCart";

// Routes where the floating cart should be visible
const CART_VISIBLE_ROUTES = [
  "/explorar",
  "/disponibilidad-anuncios",
  "/progreso-campaña",
];

// Routes where the cart should be hidden (wizard handles its own cart display)
const CART_HIDDEN_ROUTES = [
  "/booking-wizard",
  "/auth",
  "/owner-dashboard",
  "/owner-reservations",
  "/agente-dashboard",
  "/superadmin",
  "/superadmin-auth",
];

export function GlobalFloatingCart() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    items: cartItems,
    isValidating: cartValidating,
    isTransferring: cartTransferring,
    activeDates: cartDates,
    removeFromCart,
    clearCart,
    transferToBookingWizard,
    loadFromPropuesta,
  } = useCartValidation();

  const {
    propuestas,
    isLoading: propuestasLoading,
    isSaving: propuestaSaving,
    savePropuesta,
    deletePropuesta,
  } = usePropuestas();

  const [savePropuestaOpen, setSavePropuestaOpen] = useState(false);
  const [propuestasDrawerOpen, setPropuestasDrawerOpen] = useState(false);

  // Determine if cart should be visible
  const shouldShowCart = () => {
    // Always hide on explicitly hidden routes
    if (CART_HIDDEN_ROUTES.some(route => location.pathname.startsWith(route))) {
      return false;
    }

    // Show on allowed routes if cart has items or user is authenticated
    const onAllowedRoute = CART_VISIBLE_ROUTES.some(route => 
      location.pathname.startsWith(route)
    );

    // Cart is visible when:
    // 1. On an allowed route, AND
    // 2. Cart has items OR user is logged in (to show empty state)
    return onAllowedRoute && (cartItems.length > 0 || user);
  };

  const handleContinueReservation = async () => {
    const success = await transferToBookingWizard();
    if (success) {
      navigate("/booking-wizard");
    }
  };

  const handleSavePropuesta = async (nombre: string, descripcion: string): Promise<boolean> => {
    if (cartItems.length === 0) return false;

    return savePropuesta({
      nombre,
      descripcion,
      items: cartItems,
      activeDates: cartDates,
    });
  };

  const handleLoadPropuesta = (propuesta: any) => {
    if (!propuesta.items || propuesta.items.length === 0) return;

    // Parse items from propuesta - they should already be FloatingCartItem format
    const parsedItems: FloatingCartItem[] = propuesta.items.map((item: any) => ({
      ...item,
      fechaInicio: item.fechaInicio instanceof Date ? item.fechaInicio : new Date(item.fechaInicio),
      fechaFin: item.fechaFin instanceof Date ? item.fechaFin : new Date(item.fechaFin),
    }));

    // Parse dates
    const dates = propuesta.active_dates ? {
      startDate: new Date(propuesta.active_dates.startDate),
      endDate: new Date(propuesta.active_dates.endDate),
    } : null;

    loadFromPropuesta(parsedItems, dates);
    setPropuestasDrawerOpen(false);
  };

  if (!shouldShowCart()) {
    return null;
  }

  return (
    <>
      <FloatingCart
        items={cartItems}
        onRemoveItem={removeFromCart}
        onClearCart={clearCart}
        onContinueReservation={handleContinueReservation}
        onSavePropuesta={() => setSavePropuestaOpen(true)}
        onOpenPropuestas={() => setPropuestasDrawerOpen(true)}
        isValidating={cartValidating}
        activeDates={cartDates ? {
          startDate: cartDates.startDate,
          endDate: cartDates.endDate,
        } : undefined}
        propuestasCount={propuestas.length}
      />

      <SavePropuestaDialog
        open={savePropuestaOpen}
        onOpenChange={setSavePropuestaOpen}
        onSave={handleSavePropuesta}
        isSaving={propuestaSaving}
        itemCount={cartItems.length}
        total={cartItems.filter(i => i.isValid).reduce((sum, i) => sum + i.precio, 0)}
      />

      <PropuestasDrawer
        open={propuestasDrawerOpen}
        onOpenChange={setPropuestasDrawerOpen}
        propuestas={propuestas}
        isLoading={propuestasLoading}
        onLoadPropuesta={handleLoadPropuesta}
        onDeletePropuesta={deletePropuesta}
      />
    </>
  );
}