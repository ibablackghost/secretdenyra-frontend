import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getOrders } from '../services/api/commerceApi';
import { getStoredAuthToken } from '../services/api/session';

export type UserOrderItem = {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
};

export type OrderCustomer = {
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
};

export type OrderAddress = {
  address?: string;
  line1?: string;
  line2?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  country?: string;
};

export type UserOrder = {
  id: string;
  createdAt: string;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  paymentMethod: string;
  customer: OrderCustomer;
  shippingAddress: OrderAddress;
  billingAddress: OrderAddress;
  subtotal: number;
  shippingFee: number;
  total: number;
  items: UserOrderItem[];
};

type OrderStore = {
  orders: UserOrder[];
  hydrateFromServer: () => Promise<void>;
  addOrder: (order: Omit<UserOrder, 'id' | 'createdAt'>) => string;
  clear: () => Promise<void>;
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
      clear: async () => set({ orders: [] }),
    }),
    { name: 'nyra-orders' }
  )
);
