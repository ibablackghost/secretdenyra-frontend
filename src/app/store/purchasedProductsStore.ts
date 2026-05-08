import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getPurchasedProducts, type RemotePurchasedProductItem } from '../services/api/commerceApi';
import { getStoredAuthToken } from '../services/api/session';

type PurchasedProductsState = {
  items: RemotePurchasedProductItem[];
  count: number;
  hydrateFromServer: () => Promise<void>;
  clear: () => Promise<void>;
};

export const usePurchasedProductsStore = create<PurchasedProductsState>()(
  persist(
    (set) => ({
      items: [],
      count: 0,
      hydrateFromServer: async () => {
        const token = getStoredAuthToken();
        if (!token) return;
        try {
          const data = await getPurchasedProducts(token);
          set({ items: data.items, count: data.count });
        } catch {
          set({ items: [], count: 0 });
        }
      },
      clear: async () => set({ items: [], count: 0 }),
    }),
    { name: 'nyra-purchased-products' }
  )
);
