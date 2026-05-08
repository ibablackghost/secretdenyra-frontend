import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserAddress = {
  id: string;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  region?: string;
  postalCode?: string;
  country: string;
  isDefault?: boolean;
};

type AddressStore = {
  addresses: UserAddress[];
  addAddress: (address: Omit<UserAddress, 'id'>) => void;
  updateAddress: (id: string, payload: Partial<UserAddress>) => void;
  removeAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
};

export const useAddressStore = create<AddressStore>()(
  persist(
    (set) => ({
      addresses: [],
      addAddress: (address) =>
        set((state) => {
          const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          const shouldBeDefault = state.addresses.length === 0 || Boolean(address.isDefault);
          const next = shouldBeDefault
            ? state.addresses.map((item) => ({ ...item, isDefault: false }))
            : state.addresses;
          return {
            addresses: [...next, { ...address, id, isDefault: shouldBeDefault }],
          };
        }),
      updateAddress: (id, payload) =>
        set((state) => ({
          addresses: state.addresses.map((item) => (item.id === id ? { ...item, ...payload } : item)),
        })),
      removeAddress: (id) =>
        set((state) => {
          const next = state.addresses.filter((item) => item.id !== id);
          if (!next.some((item) => item.isDefault) && next.length > 0) {
            next[0].isDefault = true;
          }
          return { addresses: next };
        }),
      setDefaultAddress: (id) =>
        set((state) => ({
          addresses: state.addresses.map((item) => ({ ...item, isDefault: item.id === id })),
        })),
    }),
    { name: 'nyra-addresses' }
  )
);
