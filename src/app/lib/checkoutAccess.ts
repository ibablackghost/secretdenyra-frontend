import { getStoredAuthToken } from '../services/api/session';

export const LAST_PAYMENT_ID_KEY = 'nyra-last-payment-id';
export const GUEST_CHECKOUT_TOKEN_KEY = 'nyra-guest-checkout-token';
export const CHECKOUT_ID_KEY = 'nyra-checkout-id';

export type CheckoutAccess = {
  /** JWT utilisateur connecté */
  token?: string;
  /** Jeton invité renvoyé par POST /api/checkout/init */
  guestToken?: string;
};

export function getCheckoutAccess(): CheckoutAccess {
  const token = getStoredAuthToken() ?? undefined;
  const guestToken =
    typeof sessionStorage !== 'undefined'
      ? sessionStorage.getItem(GUEST_CHECKOUT_TOKEN_KEY) ?? undefined
      : undefined;
  return { token, guestToken };
}

export function saveGuestCheckoutToken(guestToken: string) {
  sessionStorage.setItem(GUEST_CHECKOUT_TOKEN_KEY, guestToken);
}

export function saveCheckoutSession(checkoutId: string, paymentId?: string) {
  sessionStorage.setItem(CHECKOUT_ID_KEY, checkoutId);
  if (paymentId) sessionStorage.setItem(LAST_PAYMENT_ID_KEY, paymentId);
}

export function getStoredCheckoutId(): string | undefined {
  return sessionStorage.getItem(CHECKOUT_ID_KEY) ?? undefined;
}

export function clearCheckoutSessionKeys() {
  sessionStorage.removeItem(GUEST_CHECKOUT_TOKEN_KEY);
  sessionStorage.removeItem(LAST_PAYMENT_ID_KEY);
  sessionStorage.removeItem(CHECKOUT_ID_KEY);
}

/** Init checkout : JWT optionnel uniquement (pas de X-Checkout-Token — voir frontend-checkout-api.md). */
export function initCheckoutRequestHeaders(access: CheckoutAccess): Record<string, string> {
  const headers: Record<string, string> = {};
  if (access.token) headers.Authorization = `Bearer ${access.token}`;
  return headers;
}

export function checkoutRequestHeaders(access: CheckoutAccess): Record<string, string> {
  const headers: Record<string, string> = {};
  if (access.token) headers.Authorization = `Bearer ${access.token}`;
  else if (access.guestToken) headers['X-Checkout-Token'] = access.guestToken;
  return headers;
}

export function hasCheckoutAccess(access: CheckoutAccess): boolean {
  return Boolean(access.token || access.guestToken);
}
