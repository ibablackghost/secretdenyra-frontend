import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CheckoutAddress, CheckoutCustomer } from './checkoutStore';

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
  addOrder: (order: Omit<UserOrder, 'id' | 'createdAt'>) => string;
};

export const useOrderStore = create<OrderStore>()(
  persist(
    (set) => ({
      orders: [],
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
