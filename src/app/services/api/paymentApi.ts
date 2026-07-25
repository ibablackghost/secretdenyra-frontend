import { requestJson } from './httpClient';
import type { CheckoutAccess } from '../../lib/checkoutAccess';
import { checkoutRequestHeaders } from '../../lib/checkoutAccess';
import type {
  InitSycapayPaymentInput,
  InitSycapayPaymentResponse,
  PaymentStatusResponse,
  PendingPaymentSummary,
} from '../payment/sycapayTypes';

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

/** Normalise la réponse Nyra / Sycapay (deepLinks.OM → champs plats). */
function normalizeSycapayPaymentResponse(raw: InitSycapayPaymentResponse): InitSycapayPaymentResponse {
  const deepLinks = raw.deepLinks;
  const omLink =
    (typeof deepLinks?.OM === 'string' && deepLinks.OM) ||
    (typeof deepLinks?.MAXIT === 'string' && deepLinks.MAXIT) ||
    null;

  return {
    ...raw,
    redirectUrl: raw.redirectUrl ?? raw.urlRedirection ?? omLink,
    deeplink: raw.deeplink ?? omLink,
    deepLinks: raw.deepLinks ?? (omLink ? { OM: omLink } : raw.deepLinks),
  };
}

export async function initSycapayCheckoutPayment(
  checkoutId: string,
  input: InitSycapayPaymentInput,
  access: CheckoutAccess = {}
) {
  const response = await requestJson<InitSycapayPaymentResponse>(
    url(`/api/checkout/${checkoutId}/payment/sycapay`),
    {
      method: 'POST',
      headers: checkoutRequestHeaders(access),
      body: input,
      timeoutMs: 65000,
    }
  );
  return normalizeSycapayPaymentResponse(response);
}

/** @deprecated Prefer initSycapayCheckoutPayment */
export async function initPaytechCheckoutPayment(checkoutId: string, access: CheckoutAccess = {}) {
  return requestJson<InitSycapayPaymentResponse>(url(`/api/checkout/${checkoutId}/payment/paytech`), {
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
