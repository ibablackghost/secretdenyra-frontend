import { requestJson } from './httpClient';
import type { CheckoutAccess } from '../../lib/checkoutAccess';
import { checkoutRequestHeaders } from '../../lib/checkoutAccess';
import type {
  InitPaytechPaymentResponse,
  PaymentStatusResponse,
  PendingPaymentSummary,
} from '../payment/paytechTypes';

const STRAPI_URL = import.meta.env.VITE_STRAPI_URL;

function ensureBaseUrl() {
  if (!STRAPI_URL) {
    throw new Error('VITE_STRAPI_URL est manquant. Configurez votre backend Strapi.');
  }
  return STRAPI_URL;
}

function url(path: string) {
  return `${ensureBaseUrl()}${path}`;
}

export async function initPaytechCheckoutPayment(checkoutId: string, access: CheckoutAccess = {}) {
  return requestJson<InitPaytechPaymentResponse>(url(`/api/checkout/${checkoutId}/payment/paytech`), {
    method: 'POST',
    headers: checkoutRequestHeaders(access),
    timeoutMs: 65000,
  });
}

/** Statut paiement — JWT ou jeton invité (X-Checkout-Token). */
export async function getPaymentStatus(paymentId: string, access: CheckoutAccess = {}) {
  return requestJson<PaymentStatusResponse>(url(`/api/payments/${paymentId}/status`), {
    method: 'GET',
    headers: checkoutRequestHeaders(access),
    timeoutMs: 15000,
  });
}

export async function getPendingPayments(token: string) {
  return requestJson<{ items: PendingPaymentSummary[] }>(url('/api/me/payments/pending'), {
    method: 'GET',
    headers: checkoutRequestHeaders({ token }),
    timeoutMs: 15000,
  });
}
