import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CheckoutCustomer = {
  fullName: string;
  email: string;
  phone: string;
  /** Conservés pour commandes locales / migration persist. */
  firstName?: string;
  lastName?: string;
};

export type CheckoutAddress = {
  address: string;
  /** Champs legacy (persist) — non envoyés à l’API. */
  line1?: string;
  line2?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  country?: string;
};

type CheckoutStore = {
  customer: CheckoutCustomer;
  shipping: CheckoutAddress;
  billingSameAsShipping: boolean;
  updateCustomer: (payload: Partial<CheckoutCustomer>) => void;
  updateShipping: (payload: Partial<CheckoutAddress>) => void;
  clearCheckout: () => void;
};

const emptyCustomer: CheckoutCustomer = {
  fullName: '',
  email: '',
  phone: '',
};

const emptyShipping: CheckoutAddress = {
  address: '',
};

function migratePersistedState(persisted: unknown): CheckoutStore | unknown {
  if (!persisted || typeof persisted !== 'object') return persisted;
  const state = persisted as Partial<CheckoutStore> & {
    customer?: Record<string, string>;
    shipping?: Record<string, string>;
  };

  const customer = state.customer ?? {};
  const fullName =
    customer.fullName?.trim() ||
    [customer.firstName, customer.lastName].filter(Boolean).join(' ').trim() ||
    '';

  const shipping = state.shipping ?? {};
  const address =
    shipping.address?.trim() ||
    [shipping.line1, shipping.city, shipping.country].filter(Boolean).join(', ').trim() ||
    '';

  return {
    ...state,
    customer: {
      fullName,
      email: customer.email ?? '',
      phone: customer.phone ?? '',
      firstName: customer.firstName,
      lastName: customer.lastName,
    },
    shipping: { address },
    billingSameAsShipping: true,
  };
}

export const useCheckoutStore = create<CheckoutStore>()(
  persist(
    (set) => ({
      customer: emptyCustomer,
      shipping: emptyShipping,
      billingSameAsShipping: true,
      updateCustomer: (payload) => set((state) => ({ customer: { ...state.customer, ...payload } })),
      updateShipping: (payload) => set((state) => ({ shipping: { ...state.shipping, ...payload } })),
      clearCheckout: () =>
        set({
          customer: emptyCustomer,
          shipping: emptyShipping,
          billingSameAsShipping: true,
        }),
    }),
    {
      name: 'nyra-checkout-draft',
      version: 2,
      migrate: (persisted) => migratePersistedState(persisted) as CheckoutStore,
    }
  )
);
