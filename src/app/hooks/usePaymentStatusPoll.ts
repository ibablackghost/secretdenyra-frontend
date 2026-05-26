import { useCallback, useEffect, useRef, useState } from 'react';
import { getPaymentStatus } from '../services/api/paymentApi';
import type { CheckoutAccess } from '../lib/checkoutAccess';
import { hasCheckoutAccess } from '../lib/checkoutAccess';
import { isPaymentTerminal, type PaytechPaymentStatus } from '../services/payment/paytechTypes';
import { ApiError } from '../services/api/apiError';

const DEFAULT_INTERVAL_MS = 5000;
const MAX_POLL_DURATION_MS = 15 * 60 * 1000;

type Options = {
  access: CheckoutAccess;
  paymentId: string | null;
  enabled?: boolean;
  intervalMs?: number;
  onTerminal?: (status: PaytechPaymentStatus, errorMessage: string | null) => void;
};

export function usePaymentStatusPoll({
  access,
  paymentId,
  enabled = true,
  intervalMs = DEFAULT_INTERVAL_MS,
  onTerminal,
}: Options) {
  const [status, setStatus] = useState<PaytechPaymentStatus | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const startedAtRef = useRef<number | null>(null);
  const onTerminalRef = useRef(onTerminal);
  onTerminalRef.current = onTerminal;

  const pollOnce = useCallback(async () => {
    if (!paymentId || !hasCheckoutAccess(access)) return null;
    const result = await getPaymentStatus(paymentId, access);
    setStatus(result.status);
    const errMsg = result.errorType?.message ?? null;
    if (errMsg) setErrorMessage(errMsg);
    return result;
  }, [paymentId, access]);

  useEffect(() => {
    if (!enabled || !paymentId || !hasCheckoutAccess(access)) {
      setIsPolling(false);
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    startedAtRef.current = Date.now();
    setIsPolling(true);
    setErrorMessage(null);

    const tick = async () => {
      if (cancelled) return;

      if (startedAtRef.current && Date.now() - startedAtRef.current > MAX_POLL_DURATION_MS) {
        setErrorMessage('Délai de paiement dépassé. Réessayez depuis votre compte ou le panier.');
        setIsPolling(false);
        return;
      }

      try {
        const result = await getPaymentStatus(paymentId, access);
        if (cancelled) return;
        setStatus(result.status);
        const errMsg = result.errorType?.message ?? null;
        if (errMsg) setErrorMessage(errMsg);
        const next = result.status;

        if (isPaymentTerminal(next)) {
          setIsPolling(false);
          onTerminalRef.current?.(next, errMsg);
          return;
        }

        timer = setTimeout(tick, intervalMs);
      } catch (err) {
        if (cancelled) return;
        const msg =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : 'Impossible de vérifier le statut du paiement.';
        setErrorMessage(msg);
        timer = setTimeout(tick, intervalMs);
      }
    };

    void tick();

    return () => {
      cancelled = true;
      setIsPolling(false);
      if (timer) clearTimeout(timer);
    };
  }, [enabled, paymentId, access, intervalMs]);

  return { status, errorMessage, isPolling, pollOnce };
}
