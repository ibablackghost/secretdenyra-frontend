import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ViewedProductsStore = {
  ids: string[];
  push: (productId: string) => void;
  clear: () => void;
};

export const useViewedProductsStore = create<ViewedProductsStore>()(
  persist(
    (set) => ({
      ids: [],
      push: (productId) =>
        set((state) => {
          const withoutCurrent = state.ids.filter((id) => id !== productId);
          return { ids: [productId, ...withoutCurrent].slice(0, 24) };
        }),
      clear: () => set({ ids: [] }),
    }),
    { name: 'nyra-viewed-products' }
  )
);
