import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { InventoryAsset } from '@/lib/mockInventory';
import { CartItem, CartItemModalidad, CartItemConfig, Cart } from '@/types/cart';
import { CampaignInfo } from '@/context/CampaignContext';
import { 
  totalTradicional, 
  totalDigitalSpot, 
  totalDigitalHora, 
  totalDigitalDia, 
  totalDigitalCPM 
} from '@/lib/pricing';

interface CartState {
  items: CartItem[];
  campaignInfo: CampaignInfo | null;
}

type CartAction = 
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_ITEM'; payload: CartItem }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: Cart }
  | { type: 'SET_CAMPAIGN_INFO'; payload: CampaignInfo | null };

interface CartContextType {
  cart: Cart;
  addItem: (asset: InventoryAsset, modalidad: CartItemModalidad, config: CartItemConfig) => void;
  removeItem: (itemId: string) => void;
  updateItem: (itemId: string, config: CartItemConfig) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Helper function to calculate price based on asset, modality and config
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
    
    case 'semanal':
      return totalTradicional({
        tipoPeriodo: 'semanal',
        precioMensual: asset.precio.mensual || 0,
        meses: config.meses || 1,
        catorcenas: config.catorcenas || 1,
        esRotativo: false
      });
    
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
      const existingItemIndex = state.items.findIndex(item => item.id === action.payload.id);
      
      if (existingItemIndex > -1) {
        // Replace existing item with new configuration
        const updatedItems = [...state.items];
        updatedItems[existingItemIndex] = action.payload;
        return { ...state, items: updatedItems };
      } else {
        // Add new item
        return { ...state, items: [...state.items, action.payload] };
      }
    }
    
    case 'REMOVE_ITEM': {
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload)
      };
    }
    
    case 'UPDATE_ITEM': {
      return {
        ...state,
        items: state.items.map(item => 
          item.id === action.payload.id ? action.payload : item
        )
      };
    }
    
    case 'UPDATE_QUANTITY': {
      return {
        ...state,
        items: state.items.map(item => {
          if (item.id === action.payload.id) {
            const newQuantity = action.payload.quantity;
            return {
              ...item,
              quantity: newQuantity,
              subtotal: item.precioUnitario * newQuantity
            };
          }
          return item;
        })
      };
    }
    
    case 'CLEAR_CART':
      return { items: [], campaignInfo: state.campaignInfo };
    
    case 'LOAD_CART':
      return { items: action.payload.items, campaignInfo: action.payload.campaignInfo || null };
    
    case 'SET_CAMPAIGN_INFO':
      return { ...state, campaignInfo: action.payload };
    
    default:
      return state;
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], campaignInfo: null });

  // Calculate cart totals
  const cart: Cart = {
    items: state.items,
    total: state.items.reduce((sum, item) => sum + item.subtotal, 0),
    itemCount: state.items.reduce((sum, item) => sum + item.quantity, 0),
    campaignInfo: state.campaignInfo
  };

  // Load cart and campaign info from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    const savedCampaign = localStorage.getItem('campaign_info');
    
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        dispatch({ type: 'LOAD_CART', payload: parsedCart });
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
    
    if (savedCampaign) {
      try {
        const parsedCampaign = JSON.parse(savedCampaign);
        dispatch({ type: 'SET_CAMPAIGN_INFO', payload: parsedCampaign });
      } catch (error) {
        console.error('Error loading campaign from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  // Sync campaign info from CampaignContext
  useEffect(() => {
    const handleStorageChange = () => {
      const savedCampaign = localStorage.getItem('campaign_info');
      if (savedCampaign) {
        try {
          const parsedCampaign = JSON.parse(savedCampaign);
          dispatch({ type: 'SET_CAMPAIGN_INFO', payload: parsedCampaign });
        } catch (error) {
          console.error('Error syncing campaign:', error);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const addItem = (asset: InventoryAsset, modalidad: CartItemModalidad, config: CartItemConfig) => {
    const itemId = `${asset.id}-${modalidad}-${JSON.stringify(config)}`;
    const precioUnitario = calculatePrice(asset, modalidad, config);
    const subtotal = precioUnitario; // For quantity 1
    
    const cartItem: CartItem = {
      id: itemId,
      asset,
      modalidad,
      config,
      precioUnitario,
      subtotal,
      quantity: 1
    };

    dispatch({ type: 'ADD_ITEM', payload: cartItem });
  };

  const removeItem = (itemId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: itemId });
  };

  const updateItem = (itemId: string, config: CartItemConfig) => {
    const existingItem = state.items.find(item => item.id === itemId);
    if (!existingItem) return;

    const precioUnitario = calculatePrice(existingItem.asset, existingItem.modalidad, config);
    const updatedItem: CartItem = {
      ...existingItem,
      config,
      precioUnitario,
      subtotal: precioUnitario * existingItem.quantity
    };

    dispatch({ type: 'UPDATE_ITEM', payload: updatedItem });
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
      updateItem,
      updateQuantity,
      clearCart
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCartContext() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCartContext must be used within a CartProvider');
  }
  return context;
}