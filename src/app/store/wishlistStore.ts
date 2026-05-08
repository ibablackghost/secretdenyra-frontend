import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { addWishlistItem, getWishlist, removeWishlistItem } from '../services/api/commerceApi';
import { getStoredAuthToken } from '../services/api/session';

interface WishlistStore {
  ids: string[];
  count: number;
  hydrateFromServer: () => Promise<void>;
  loadWishlist: () => Promise<void>;
  toggle: (productId: string) => Promise<void>;
  remove: (productId: string) => Promise<void>;
  has: (productId: string) => boolean;
  isWishlisted: (product: { id?: string; slug?: string }) => boolean;
  clear: () => Promise<void>;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      ids: [],
      count: 0,
      hydrateFromServer: async () => {
        const token = getStoredAuthToken();
        if (!token) {
          set({ ids: [], count: 0 });
          return;
        }
        try {
          const data = await getWishlist(token);
          set({ ids: data.productIds, count: data.count });
        } catch {}
      },
      loadWishlist: async () => {
        await get().hydrateFromServer();
      },
      toggle: async (productId) => {
        const wasIn = get().ids.includes(productId);
        set((s) => ({
          ids: s.ids.includes(productId)
            ? s.ids.filter((id) => id !== productId)
            : [...s.ids, productId],
        }));
        const token = getStoredAuthToken();
        if (!token) return;
        try {
          if (wasIn) await removeWishlistItem(token, productId);
          else await addWishlistItem(token, productId);
          await get().hydrateFromServer();
        } catch {}
      },
      remove: async (productId) => {
        set((s) => ({
          ids: s.ids.filter((id) => id !== productId),
          count: Math.max(0, s.count - 1),
        }));
        const token = getStoredAuthToken();
        if (!token) return;
        try {
          await removeWishlistItem(token, productId);
          await get().hydrateFromServer();
        } catch {}
      },
      has: (productId) => get().ids.includes(productId),
      isWishlisted: (product) => {
        const ids = get().ids;
        return Boolean(
          (product.id && ids.includes(product.id)) ||
            (product.slug && ids.includes(product.slug))
        );
      },
      clear: async () => set({ ids: [], count: 0 }),
    }),
    { name: 'nyra-wishlist' }
  )
);
