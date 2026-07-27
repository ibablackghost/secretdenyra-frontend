import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getPendingPayments } from '../services/api/paymentApi';
import { getStoredAuthToken } from '../services/api/session';
import {
  isPaymentAwaitingAction,
  type PaymentStatus,
  type PendingPaymentSummary,
} from '../services/payment/sycapayTypes';

type PendingPaymentsStore = {
  items: PendingPaymentSummary[];
  upsert: (payment: PendingPaymentSummary) => void;
  updateStatus: (paymentId: string, status: PaymentStatus, patch?: Partial<PendingPaymentSummary>) => void;
  remove: (paymentId: string) => void;
  hydrateFromServer: () => Promise<void>;
  clear: () => void;
};

function isSycapayPending(item: PendingPaymentSummary) {
  if (!isPaymentAwaitingAction(item.status)) return false;
  const provider = (item.provider ?? 'sycapay').toLowerCase();
  return provider !== 'paytech' && provider !== 'intech';
}

export const usePendingPaymentsStore = create<PendingPaymentsStore>()(
  persist(
    (set) => ({
      items: [],
      upsert: (payment) =>
        set((state) => {
          const others = state.items.filter((item) => item.paymentId !== payment.paymentId);
          const withProvider = { ...payment, provider: payment.provider ?? 'sycapay' };
          if (!isSycapayPending(withProvider)) {
            return { items: others.filter(isSycapayPending) };
          }
          return { items: [withProvider, ...others].filter(isSycapayPending) };
        }),
      updateStatus: (paymentId, status, patch) =>
        set((state) => {
          if (!isPaymentAwaitingAction(status)) {
            return { items: state.items.filter((item) => item.paymentId !== paymentId) };
          }
          return {
            items: state.items
              .map((item) => (item.paymentId === paymentId ? { ...item, ...patch, status } : item))
              .filter(isSycapayPending),
          };
        }),
      remove: (paymentId) => set((state) => ({ items: state.items.filter((item) => item.paymentId !== paymentId) })),
      hydrateFromServer: async () => {
        const token = getStoredAuthToken();
        if (!token) return;
        try {
          const data = await getPendingPayments(token);
          const remote = (Array.isArray(data.items) ? data.items : [])
            .map((item) => ({ ...item, provider: item.provider ?? 'sycapay' }))
            .filter(isSycapayPending);
          // Source de vérité serveur : on ne garde plus le cache PayTech local.
          set({ items: remote });
        } catch {
          // Si l’API échoue, purge au moins les vieux PayTech du cache.
          set((state) => ({ items: state.items.filter(isSycapayPending) }));
        }
      },
      clear: () => set({ items: [] }),
    }),
    {
      name: 'nyra-pending-payments',
      version: 2,
      migrate: () => ({ items: [] }),
    }
  )
);

export function selectAwaitingPayments(items: PendingPaymentSummary[]) {
  return items.filter(isSycapayPending);
}
