import type { FloatingCartItem } from "@/components/cart/FloatingCart";
import type { Cart } from "@/types/cart";

/**
 * Convierte el formato del FloatingCart (explorar) al formato legacy usado por CartContext/BookingWizard.
 * Nota: mantiene solo modalidad mensual (como hace el flujo actual) y conserva fechas.
 */
export function buildLegacyCartFromFloatingItems(items: FloatingCartItem[]): Cart {
  const legacyCartItems = items.map((item) => ({
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
      fechaInicio: item.fechaInicio.toISOString().split("T")[0],
      fechaFin: item.fechaFin.toISOString().split("T")[0],
    },
    precioUnitario: item.precio,
    subtotal: item.precio,
    quantity: 1,
  }));

  return {
    items: legacyCartItems,
    total: legacyCartItems.reduce((sum, i) => sum + i.subtotal, 0),
    itemCount: legacyCartItems.reduce((sum, i) => sum + i.quantity, 0),
    campaignInfo: null,
  };
}
