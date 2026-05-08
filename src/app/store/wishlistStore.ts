import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { addWishlistItem, getWishlist, removeWishlistItem } from '../services/api/commerceApi';
import { getStoredAuthToken } from '../services/api/session';

interface WishlistStore {
  ids: string[];
  hydrateFromServer: () => Promise<void>;
  toggle: (productId: string) => Promise<void>;
  remove: (productId: string) => Promise<void>;
  has: (productId: string) => boolean;
  clear: () => Promise<void>;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      ids: [],
      hydrateFromServer: async () => {
        const token = getStoredAuthToken();
        if (!token) return;
        try {
          const data = await getWishlist(token);
          set({ ids: data.items.map((item) => item.productId) });
        } catch {}
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
        set((s) => ({ ids: s.ids.filter((id) => id !== productId) }));
        const token = getStoredAuthToken();
        if (!token) return;
        try {
          await removeWishlistItem(token, productId);
          await get().hydrateFromServer();
        } catch {}
      },
      has: (productId) => get().ids.includes(productId),
      clear: async () => set({ ids: [] }),
    }),
    { name: 'nyra-wishlist' }
  )
);
