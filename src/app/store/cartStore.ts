import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { addCartItem, getCart, removeCartItem, updateCartItem } from '../services/api/commerceApi';
import { getStoredAuthToken } from '../services/api/session';

export interface CartItem {
  productId: string;
  quantity: number;
  itemId?: string;
}

interface CartStore {
  items: CartItem[];
  hydrateFromServer: () => Promise<void>;
  addItem: (productId: string) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      hydrateFromServer: async () => {
        const token = getStoredAuthToken();
        if (!token) return;
        try {
          const data = await getCart(token);
          set({ items: data.items.map((item) => ({ productId: item.productId, quantity: item.quantity, itemId: item.itemId })) });
        } catch {
          // Keep local fallback if backend unavailable.
        }
      },
      addItem: async (productId) => {
        set((state) => {
          const existing = state.items.find((item) => item.productId === productId);
          if (existing) {
            return {
              items: state.items.map((item) =>
                item.productId === productId
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              ),
            };
          }
          return { items: [...state.items, { productId, quantity: 1 }] };
        });
        const token = getStoredAuthToken();
        if (!token) return;
        try {
          await addCartItem(token, { productId, quantity: 1 });
          await get().hydrateFromServer();
        } catch {
          // Ignore sync errors to keep UX responsive.
        }
      },
      removeItem: async (productId) => {
        const before = get().items.find((item) => item.productId === productId);
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        }));
        const token = getStoredAuthToken();
        if (!token || !before?.itemId) return;
        try {
          await removeCartItem(token, before.itemId);
          await get().hydrateFromServer();
        } catch {}
      },
      updateQuantity: async (productId, quantity) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId ? { ...item, quantity } : item
          ),
        }));
        const token = getStoredAuthToken();
        const current = get().items.find((item) => item.productId === productId);
        if (!token || !current?.itemId) return;
        try {
          await updateCartItem(token, current.itemId, { quantity });
          await get().hydrateFromServer();
        } catch {}
      },
      clearCart: async () => {
        const token = getStoredAuthToken();
        const snapshot = [...get().items];
        set({ items: [] });
        if (!token) return;
        try {
          await Promise.all(
            snapshot
              .filter((item) => Boolean(item.itemId))
              .map((item) => removeCartItem(token, item.itemId!))
          );
          await get().hydrateFromServer();
        } catch {}
      },
    }),
    { name: 'nyra-cart' }
  )
);