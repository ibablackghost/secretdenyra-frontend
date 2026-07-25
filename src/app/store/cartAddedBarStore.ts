import { create } from 'zustand';

const VISIBLE_MS = 7000;

type CartAddedBarStore = {
  visible: boolean;
  productName: string | null;
  show: (productName?: string) => void;
  hide: () => void;
};

let hideTimer: ReturnType<typeof setTimeout> | null = null;

export const useCartAddedBarStore = create<CartAddedBarStore>((set) => ({
  visible: false,
  productName: null,
  show: (productName) => {
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
    set({ visible: true, productName: productName?.trim() || null });
    hideTimer = setTimeout(() => {
      set({ visible: false, productName: null });
      hideTimer = null;
    }, VISIBLE_MS);
  },
  hide: () => {
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
    set({ visible: false, productName: null });
  },
}));
