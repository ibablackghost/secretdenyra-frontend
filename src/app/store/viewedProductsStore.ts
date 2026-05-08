import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getViewedProducts, pushViewedProduct } from '../services/api/commerceApi';
import { getStoredAuthToken } from '../services/api/session';

type ViewedProductsStore = {
  ids: string[];
  hydrateFromServer: () => Promise<void>;
  push: (productId: string) => Promise<void>;
  clear: () => Promise<void>;
};

export const useViewedProductsStore = create<ViewedProductsStore>()(
  persist(
    (set, get) => ({
      ids: [],
      hydrateFromServer: async () => {
        const token = getStoredAuthToken();
        if (!token) return;
        try {
          const data = await getViewedProducts(token);
          set({ ids: data.productIds.slice(0, 24) });
        } catch {}
      },
      push: async (productId) => {
        set((state) => {
          const withoutCurrent = state.ids.filter((id) => id !== productId);
          return { ids: [productId, ...withoutCurrent].slice(0, 24) };
        });
        const token = getStoredAuthToken();
        if (!token) return;
        try {
          await pushViewedProduct(token, productId);
        } catch {}
      },
      clear: async () => set({ ids: [] }),
    }),
    { name: 'nyra-viewed-products' }
  )
);
