import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CheckoutAddress, CheckoutCustomer } from './checkoutStore';
import { getOrders } from '../services/api/commerceApi';
import { getStoredAuthToken } from '../services/api/session';

export type UserOrderItem = {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
};

export type UserOrder = {
  id: string;
  createdAt: string;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  paymentMethod: string;
  customer: CheckoutCustomer;
  shippingAddress: CheckoutAddress;
  billingAddress: CheckoutAddress;
  subtotal: number;
  shippingFee: number;
  total: number;
  items: UserOrderItem[];
};

type OrderStore = {
  orders: UserOrder[];
  hydrateFromServer: () => Promise<void>;
  addOrder: (order: Omit<UserOrder, 'id' | 'createdAt'>) => string;
};

export const useOrderStore = create<OrderStore>()(
  persist(
    (set) => ({
      orders: [],
      hydrateFromServer: async () => {
        const token = getStoredAuthToken();
        if (!token) return;
        try {
          const data = await getOrders(token);
          const maybeItems = (data as { items?: unknown })?.items;
          const orders = Array.isArray(maybeItems)
            ? (maybeItems as UserOrder[])
            : Array.isArray(data)
              ? (data as UserOrder[])
              : [];
          set({ orders });
        } catch {}
      },
      addOrder: (order) => {
        const id = `ORD-${Date.now().toString().slice(-6)}`;
        const createdAt = new Date().toISOString();
        set((state) => ({ orders: [{ ...order, id, createdAt }, ...state.orders] }));
        return id;
      },
    }),
    { name: 'nyra-orders' }
  )
);
