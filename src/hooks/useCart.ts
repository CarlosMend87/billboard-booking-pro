import { useState, useCallback, useMemo } from 'react';
import { CartItem, Cart, CartItemModalidad, CartItemConfig } from '@/types/cart';
import { InventoryAsset } from '@/lib/mockInventory';
import { 
  totalTradicional, 
  totalDigitalSpot, 
  totalDigitalHora, 
  totalDigitalDia, 
  totalDigitalCPM 
} from '@/lib/pricing';

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  const calculatePrice = useCallback((
    asset: InventoryAsset, 
    modalidad: CartItemModalidad, 
    config: CartItemConfig
  ): number => {
    switch (modalidad) {
      case 'mensual':
        return totalTradicional({
          tipoPeriodo: 'mensual',
          precioMensual: asset.precio.mensual || 0,
          meses: config.meses || 1,
          esRotativo: false
        });
      
      case 'catorcenal':
        return totalTradicional({
          tipoPeriodo: 'catorcenal',
          precioMensual: asset.precio.mensual || 0,
          catorcenas: config.catorcenas || 1,
          esRotativo: false
        });
      
      case 'rotativo':
        const basePrice = totalTradicional({
          tipoPeriodo: config.meses ? 'mensual' : 'catorcenal',
          precioMensual: asset.precio.mensual || 0,
          meses: config.meses || 1,
          catorcenas: config.catorcenas || 1,
          esRotativo: false
        });
        return basePrice * 0.5; // 50% discount for rotativo
      
      case 'spot':
        return totalDigitalSpot({
          tarifaSpot: asset.precio.spot || 0,
          spotsDia: config.spotsDia || 1,
          dias: config.dias || 1
        });
      
      case 'hora':
        return totalDigitalHora({
          tarifaHora: asset.precio.hora || 0,
          horas: config.horas || 1,
          dias: config.dias || 1
        });
      
      case 'dia':
        return totalDigitalDia({
          tarifaDia: asset.precio.dia || 0,
          dias: config.dias || 1
        });
      
      case 'cpm':
        return totalDigitalCPM({
          impresiones: config.impresiones || 1000,
          cpm: asset.precio.cpm || 0
        });
      
      default:
        return 0;
    }
  }, []);

  const addItem = useCallback((
    asset: InventoryAsset,
    modalidad: CartItemModalidad,
    config: CartItemConfig,
    quantity: number = 1
  ) => {
    const precioUnitario = calculatePrice(asset, modalidad, config);
    const subtotal = precioUnitario * quantity;
    
    const newItem: CartItem = {
      id: `${asset.id}-${modalidad}-${Date.now()}`,
      asset,
      modalidad,
      config,
      precioUnitario,
      subtotal,
      quantity
    };

    setItems(prev => [...prev, newItem]);
  }, [calculatePrice]);

  const removeItem = useCallback((itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }

    setItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, quantity, subtotal: item.precioUnitario * quantity }
        : item
    ));
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const cart: Cart = useMemo(() => ({
    items,
    total: items.reduce((sum, item) => sum + item.subtotal, 0),
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0)
  }), [items]);

  return {
    cart,
    addItem,
    removeItem,
    updateQuantity,
    clearCart
  };
}