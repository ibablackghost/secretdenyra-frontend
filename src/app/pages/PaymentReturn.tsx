import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { NyraButton } from '../components/form/NyraField';
import { useAuthStore } from '../store/authStore';
import { usePendingPayments } from '../hooks/usePendingPayments';
import { PaymentStatusPanel } from '../features/checkout/components/PaymentStatusPanel';
import { usePaymentStatusPoll } from '../hooks/usePaymentStatusPoll';
import {
  clearCheckoutSessionKeys,
  getCheckoutAccess,
  getStoredCheckoutId,
  LAST_PAYMENT_ID_KEY,
} from '../lib/checkoutAccess';
import { confirmCheckout } from '../services/api/commerceApi';
import { PAYMENT_METHOD_PAYTECH } from '../services/payment/paytechTypes';
import { useCartStore } from '../store/cartStore';
import { useToast } from '../hooks/useToast';

export const PaymentReturn = () => {
  const [params] = useSearchParams();
  const token = useAuthStore((s) => s.token);
  const clearCart = useCartStore((s) => s.clearCart);
  const { refreshPayment } = usePendingPayments();
  const { success } = useToast();
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [checkedOnce, setCheckedOnce] = useState(false);

  const result = params.get('result') ?? params.get('status');
  const access = getCheckoutAccess();
  const canPoll = Boolean(paymentId && (access.token || access.guestToken));

  useEffect(() => {
    const stored = sessionStorage.getItem(LAST_PAYMENT_ID_KEY);
    if (stored) setPaymentId(stored);
  }, []);

  const handlePaymentSuccess = useCallback(async () => {
    const checkoutId = getStoredCheckoutId();
    if (!checkoutId) return;
    try {
      await confirmCheckout(checkoutId, { paymentMethod: PAYMENT_METHOD_PAYTECH }, access);
      await clearCart();
      clearCheckoutSessionKeys();
      success('Paiement confirmé. Merci pour votre commande !');
    } catch {
      // Webhook backend peut avoir déjà confirmé la commande.
      clearCheckoutSessionKeys();
    }
  }, [access, clearCart, success]);

  const { status, errorMessage, isPolling } = usePaymentStatusPoll({
    access,
    paymentId,
    enabled: Boolean(canPoll && result !== 'cancel'),
    onTerminal: (terminalStatus) => {
      if (terminalStatus === 'SUCCESS') {
        void handlePaymentSuccess();
      }
    },
  });

  useEffect(() => {
    if (!paymentId || !canPoll || checkedOnce) return;
    setCheckedOnce(true);
    if (token) {
      void refreshPayment(paymentId);
    }
  }, [paymentId, canPoll, checkedOnce, token, refreshPayment]);

  const message = useMemo(() => {
    if (result === 'cancel' || result === 'canceled') {
      return 'Paiement annulé. Vous pouvez réessayer depuis le panier.';
    }
    if (result === 'success' || status === 'SUCCESS') {
      return 'Merci ! Votre paiement PayTech a été enregistré. Vous recevrez une confirmation par e-mail.';
    }
    return 'Retour depuis PayTech. Le statut de votre paiement est affiché ci-dessous.';
  }, [result, status]);

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <h1 className="text-center text-2xl font-bold text-[#1a1a1a]">Paiement PayTech</h1>
      <p className="mt-4 text-center text-gray-600">{message}</p>

      {paymentId && result !== 'cancel' && canPoll ? (
        <div className="mt-6">
          <PaymentStatusPanel status={status} isPolling={isPolling} errorMessage={errorMessage} />
        </div>
      ) : null}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {token ? (
          <Link to="/account#paiements-en-attente">
            <NyraButton type="button">Mon compte</NyraButton>
          </Link>
        ) : null}
        <Link to="/cart">
          <NyraButton type="button" variant="outline">
            Panier
          </NyraButton>
        </Link>
        <Link to="/">
          <NyraButton type="button" variant="outline">
            Accueil
          </NyraButton>
        </Link>
      </div>
    </div>
  );
};
