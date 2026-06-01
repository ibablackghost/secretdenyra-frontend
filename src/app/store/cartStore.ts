import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { normalizeCartItems } from '../lib/cartCatalogSync';
import type { UIProduct } from '../features/catalog/types';
import { clearCheckoutSessionKeys } from '../lib/checkoutAccess';
import { addCartItem, getCart, removeCartItem, updateCartItem } from '../services/api/commerceApi';
import { getStoredAuthToken } from '../services/api/session';

export interface CartItem {
  productId: string;
  quantity: number;
  variantId?: string;
  id?: string;
  itemId?: string;
}

function lineKey(productId: string, variantId?: string) {
  return `${productId}::${variantId ?? ''}`;
}

interface CartStore {
  items: CartItem[];
  hydrateFromServer: () => Promise<void>;
  addItem: (productId: string, options?: { variantId?: string; quantity?: number }) => Promise<void>;
  removeItem: (productId: string, variantId?: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => Promise<void>;
  clearCart: () => Promise<void>;
  /** Aligne productId / variantId sur le catalogue (retourne le nombre de lignes supprimées). */
  reconcileWithCatalog: (products: UIProduct[]) => number;
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
          set({
            items: data.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              variantId: item.variantId,
              id: item.id ?? item.itemId,
              itemId: item.itemId ?? item.id,
            })),
          });
        } catch {
          // Keep local fallback if backend unavailable.
        }
      },
      addItem: async (productId, options) => {
        const variantId = options?.variantId;
        const qty = Math.max(1, options?.quantity ?? 1);
        set((state) => {
          const existing = state.items.find(
            (item) => item.productId === productId && (item.variantId ?? '') === (variantId ?? '')
          );
          if (existing) {
            return {
              items: state.items.map((item) =>
                lineKey(item.productId, item.variantId) === lineKey(productId, variantId)
                  ? { ...item, quantity: item.quantity + qty }
                  : item
              ),
            };
          }
          return { items: [...state.items, { productId, quantity: qty, variantId }] };
        });
        const token = getStoredAuthToken();
        if (!token) return;
        try {
          await addCartItem(token, { productId, quantity: qty, variantId });
          await get().hydrateFromServer();
        } catch {
          // Ignore sync errors to keep UX responsive.
        }
      },
      removeItem: async (productId, variantId) => {
        const before = get().items.find(
          (item) => item.productId === productId && (item.variantId ?? '') === (variantId ?? '')
        );
        set((state) => ({
          items: state.items.filter(
            (item) => !(item.productId === productId && (item.variantId ?? '') === (variantId ?? ''))
          ),
        }));
        const token = getStoredAuthToken();
        const lineId = before?.id ?? before?.itemId;
        if (!token || !lineId) return;
        try {
          await removeCartItem(token, lineId);
          await get().hydrateFromServer();
        } catch {}
      },
      updateQuantity: async (productId, quantity, variantId) => {
        set((state) => ({
          items: state.items.map((item) =>
            lineKey(item.productId, item.variantId) === lineKey(productId, variantId) ? { ...item, quantity } : item
          ),
        }));
        const token = getStoredAuthToken();
        const current = get().items.find(
          (item) => item.productId === productId && (item.variantId ?? '') === (variantId ?? '')
        );
        const lineId = current?.id ?? current?.itemId;
        if (!token || !lineId) return;
        try {
          await updateCartItem(token, lineId, { quantity });
          await get().hydrateFromServer();
        } catch {}
      },
      reconcileWithCatalog: (products) => {
        const before = get().items;
        if (before.length === 0) return 0;
        const { items, removedCount } = normalizeCartItems(before, products);
        const beforeKey = JSON.stringify(before.map((i) => [i.productId, i.variantId ?? '', i.quantity]));
        const afterKey = JSON.stringify(items.map((i) => [i.productId, i.variantId ?? '', i.quantity]));
        if (beforeKey !== afterKey) set({ items });
        return removedCount;
      },
      clearCart: async () => {
        const token = getStoredAuthToken();
        const snapshot = [...get().items];
        set({ items: [] });
        clearCheckoutSessionKeys();
        if (!token) return;
        try {
          await Promise.all(
            snapshot
              .filter((item) => Boolean(item.id ?? item.itemId))
              .map((item) => removeCartItem(token, (item.id ?? item.itemId)!))
          );
          await get().hydrateFromServer();
        } catch {}
      },
    }),
    { name: 'nyra-cart' }
  )
);
