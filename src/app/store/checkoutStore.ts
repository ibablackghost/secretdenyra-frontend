import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CheckoutCustomer = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

export type CheckoutAddress = {
  line1: string;
  line2: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
};

type CheckoutStore = {
  customer: CheckoutCustomer;
  shipping: CheckoutAddress;
  billing: CheckoutAddress;
  billingSameAsShipping: boolean;
  updateCustomer: (payload: Partial<CheckoutCustomer>) => void;
  updateShipping: (payload: Partial<CheckoutAddress>) => void;
  updateBilling: (payload: Partial<CheckoutAddress>) => void;
  setBillingSameAsShipping: (value: boolean) => void;
  clearCheckout: () => void;
};

const emptyAddress: CheckoutAddress = {
  line1: '',
  line2: '',
  city: '',
  region: '',
  postalCode: '',
  country: 'Sénégal',
};

const emptyCustomer: CheckoutCustomer = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
};

export const useCheckoutStore = create<CheckoutStore>()(
  persist(
    (set) => ({
      customer: emptyCustomer,
      shipping: emptyAddress,
      billing: emptyAddress,
      billingSameAsShipping: true,
      updateCustomer: (payload) => set((state) => ({ customer: { ...state.customer, ...payload } })),
      updateShipping: (payload) => set((state) => ({ shipping: { ...state.shipping, ...payload } })),
      updateBilling: (payload) => set((state) => ({ billing: { ...state.billing, ...payload } })),
      setBillingSameAsShipping: (value) => set({ billingSameAsShipping: value }),
      clearCheckout: () =>
        set({
          customer: emptyCustomer,
          shipping: emptyAddress,
          billing: emptyAddress,
          billingSameAsShipping: true,
        }),
    }),
    { name: 'nyra-checkout-draft' }
  )
);
