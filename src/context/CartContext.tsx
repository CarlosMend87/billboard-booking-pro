import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { CartItem, Cart, CartItemModalidad, CartItemConfig } from '@/types/cart';
import { InventoryAsset } from '@/lib/mockInventory';
import { 
  totalTradicional, 
  totalDigitalSpot, 
  totalDigitalHora, 
  totalDigitalDia, 
  totalDigitalCPM 
} from '@/lib/pricing';

interface CartState {
  items: CartItem[];
}

type CartAction = 
  | { type: 'ADD_ITEM'; payload: { asset: InventoryAsset; modalidad: CartItemModalidad; config: CartItemConfig; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] };

const CartContext = createContext<{
  cart: Cart;
  addItem: (asset: InventoryAsset, modalidad: CartItemModalidad, config: CartItemConfig, quantity?: number) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
} | null>(null);

function calculatePrice(asset: InventoryAsset, modalidad: CartItemModalidad, config: CartItemConfig): number {
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
      return basePrice * 0.5;
    
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
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { asset, modalidad, config, quantity } = action.payload;
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

      return {
        ...state,
        items: [...state.items, newItem]
      };
    }
    
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload)
      };
    
    case 'UPDATE_QUANTITY': {
      const { id, quantity } = action.payload;
      if (quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(item => item.id !== id)
        };
      }
      
      return {
        ...state,
        items: state.items.map(item => 
          item.id === id 
            ? { ...item, quantity, subtotal: item.precioUnitario * quantity }
            : item
        )
      };
    }
    
    case 'CLEAR_CART':
      return { items: [] };
    
    case 'LOAD_CART':
      return { items: action.payload };
    
    default:
      return state;
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        dispatch({ type: 'LOAD_CART', payload: parsedCart });
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(state.items));
  }, [state.items]);

  const cart: Cart = {
    items: state.items,
    total: state.items.reduce((sum, item) => sum + item.subtotal, 0),
    itemCount: state.items.reduce((sum, item) => sum + item.quantity, 0)
  };

  const addItem = (asset: InventoryAsset, modalidad: CartItemModalidad, config: CartItemConfig, quantity: number = 1) => {
    dispatch({ type: 'ADD_ITEM', payload: { asset, modalidad, config, quantity } });
  };

  const removeItem = (itemId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: itemId });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id: itemId, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  return (
    <CartContext.Provider value={{
      cart,
      addItem,
      removeItem,
      updateQuantity,
      clearCart
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCartContext() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCartContext must be used within a CartProvider');
  }
  return context;
}