import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getPendingPayments } from '../services/api/paymentApi';
import { getStoredAuthToken } from '../services/api/session';
import {
  isPaymentAwaitingAction,
  type PaytechPaymentStatus,
  type PendingPaymentSummary,
} from '../services/payment/paytechTypes';

type PendingPaymentsStore = {
  items: PendingPaymentSummary[];
  upsert: (payment: PendingPaymentSummary) => void;
  updateStatus: (paymentId: string, status: PaytechPaymentStatus, patch?: Partial<PendingPaymentSummary>) => void;
  remove: (paymentId: string) => void;
  hydrateFromServer: () => Promise<void>;
  clear: () => void;
};

function mergePayments(local: PendingPaymentSummary[], remote: PendingPaymentSummary[]) {
  const map = new Map<string, PendingPaymentSummary>();
  for (const item of local) map.set(item.paymentId, item);
  for (const item of remote) {
    const existing = map.get(item.paymentId);
    map.set(item.paymentId, existing ? { ...existing, ...item } : item);
  }
  return Array.from(map.values())
    .filter((item) => isPaymentAwaitingAction(item.status))
    .sort((a, b) => {
      const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
      const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
      return tb - ta;
    });
}

export const usePendingPaymentsStore = create<PendingPaymentsStore>()(
  persist(
    (set, get) => ({
      items: [],
      upsert: (payment) =>
        set((state) => {
          const others = state.items.filter((item) => item.paymentId !== payment.paymentId);
          if (!isPaymentAwaitingAction(payment.status)) {
            return { items: others };
          }
          return { items: [payment, ...others] };
        }),
      updateStatus: (paymentId, status, patch) =>
        set((state) => {
          if (!isPaymentAwaitingAction(status)) {
            return { items: state.items.filter((item) => item.paymentId !== paymentId) };
          }
          return {
            items: state.items.map((item) =>
              item.paymentId === paymentId ? { ...item, ...patch, status } : item
            ),
          };
        }),
      remove: (paymentId) => set((state) => ({ items: state.items.filter((item) => item.paymentId !== paymentId) })),
      hydrateFromServer: async () => {
        const token = getStoredAuthToken();
        if (!token) return;
        try {
          const data = await getPendingPayments(token);
          const remote = Array.isArray(data.items) ? data.items : [];
          set({ items: mergePayments(get().items, remote) });
        } catch {
          // Route backend pas encore disponible : conserver le cache local.
        }
      },
      clear: () => set({ items: [] }),
    }),
    { name: 'nyra-pending-payments' }
  )
);

export function selectAwaitingPayments(items: PendingPaymentSummary[]) {
  return items.filter((item) => isPaymentAwaitingAction(item.status));
}
