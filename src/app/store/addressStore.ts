import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  createAddress,
  deleteAddress,
  getAddresses,
  patchAddress,
  setDefaultAddressRemote,
} from '../services/api/commerceApi';
import { getStoredAuthToken } from '../services/api/session';

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
  hydrateFromServer: () => Promise<void>;
  addAddress: (address: Omit<UserAddress, 'id'>) => Promise<void>;
  updateAddress: (id: string, payload: Partial<UserAddress>) => Promise<void>;
  removeAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;
  clear: () => Promise<void>;
};

export const useAddressStore = create<AddressStore>()(
  persist(
    (set, get) => ({
      addresses: [],
      hydrateFromServer: async () => {
        const token = getStoredAuthToken();
        if (!token) return;
        try {
          const data = await getAddresses(token);
          set({ addresses: data.items });
        } catch {}
      },
      addAddress: async (address) => {
        set((state) => {
          const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          const shouldBeDefault = state.addresses.length === 0 || Boolean(address.isDefault);
          const next = shouldBeDefault
            ? state.addresses.map((item) => ({ ...item, isDefault: false }))
            : state.addresses;
          return {
            addresses: [...next, { ...address, id, isDefault: shouldBeDefault }],
          };
        });
        const token = getStoredAuthToken();
        if (!token) return;
        try {
          await createAddress(token, address);
          await get().hydrateFromServer();
        } catch {}
      },
      updateAddress: async (id, payload) => {
        set((state) => ({
          addresses: state.addresses.map((item) => (item.id === id ? { ...item, ...payload } : item)),
        }));
        const token = getStoredAuthToken();
        if (!token) return;
        try {
          await patchAddress(token, id, payload);
          await get().hydrateFromServer();
        } catch {}
      },
      removeAddress: async (id) => {
        set((state) => {
          const next = state.addresses.filter((item) => item.id !== id);
          if (!next.some((item) => item.isDefault) && next.length > 0) {
            next[0].isDefault = true;
          }
          return { addresses: next };
        });
        const token = getStoredAuthToken();
        if (!token) return;
        try {
          await deleteAddress(token, id);
          await get().hydrateFromServer();
        } catch {}
      },
      setDefaultAddress: async (id) => {
        set((state) => ({
          addresses: state.addresses.map((item) => ({ ...item, isDefault: item.id === id })),
        }));
        const token = getStoredAuthToken();
        if (!token) return;
        try {
          await setDefaultAddressRemote(token, id);
          await get().hydrateFromServer();
        } catch {}
      },
      clear: async () => set({ addresses: [] }),
    }),
    { name: 'nyra-addresses' }
  )
);
