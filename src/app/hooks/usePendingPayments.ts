import { useCallback, useEffect, useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import { selectAwaitingPayments, usePendingPaymentsStore } from '../store/pendingPaymentsStore';
import { getPaymentStatus } from '../services/api/paymentApi';
import { confirmCheckout } from '../services/api/commerceApi';
import { isPaymentTerminal, PAYMENT_METHOD_PAYTECH } from '../services/payment/paytechTypes';
import { useOrderStore } from '../store/orderStore';
import { usePurchasedProductsStore } from '../store/purchasedProductsStore';

export function usePendingPayments() {
  const token = useAuthStore((s) => s.token);
  const items = usePendingPaymentsStore((s) => s.items);
  const hydrateFromServer = usePendingPaymentsStore((s) => s.hydrateFromServer);
  const updateStatus = usePendingPaymentsStore((s) => s.updateStatus);
  const remove = usePendingPaymentsStore((s) => s.remove);
  const hydrateOrders = useOrderStore((s) => s.hydrateFromServer);
  const hydratePurchasedProducts = usePurchasedProductsStore((s) => s.hydrateFromServer);

  const awaiting = useMemo(() => selectAwaitingPayments(items), [items]);

  useEffect(() => {
    if (!token) return;
    void hydrateFromServer();
  }, [token, hydrateFromServer]);

  const refreshPayment = useCallback(
    async (paymentId: string) => {
      if (!token) return null;
      const current = items.find((item) => item.paymentId === paymentId);
      const result = await getPaymentStatus(token, paymentId);

      if (result.status === 'SUCCESS' && current?.checkoutId) {
        try {
          await confirmCheckout(current.checkoutId, { paymentMethod: PAYMENT_METHOD_PAYTECH }, { token });
          await Promise.all([hydrateOrders(), hydratePurchasedProducts()]);
        } catch {
          // Commande peut déjà être confirmée via IPN PayTech.
        }
      }

      if (isPaymentTerminal(result.status)) {
        remove(paymentId);
      } else {
        updateStatus(paymentId, result.status, {
          refCommand: result.refCommand,
          token: result.token,
        });
      }

      return result;
    },
    [token, items, updateStatus, remove, hydrateOrders, hydratePurchasedProducts]
  );

  const refreshAll = useCallback(async () => {
    await hydrateFromServer();
    await Promise.all(awaiting.map((item) => refreshPayment(item.paymentId)));
  }, [hydrateFromServer, awaiting, refreshPayment]);

  return {
    awaiting,
    count: awaiting.length,
    refreshPayment,
    refreshAll,
    hydrateFromServer,
  };
}
