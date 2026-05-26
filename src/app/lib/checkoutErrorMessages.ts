import { ApiError, getApiErrorCode, toErrorMessage } from '../services/api/apiError';

const CHECKOUT_ERROR_MESSAGES: Record<string, string> = {
  PRODUCT_NOT_FOUND:
    'Un produit du panier n’existe plus sur la boutique (identifiant invalide ou article retiré). Videz le panier et rajoutez vos articles.',
  NOT_FOUND: 'Route checkout introuvable. Vérifiez VITE_STRAPI_URL (URL backend sans /api à la fin).',
  CHECKOUT_NOT_FOUND: 'Session de paiement introuvable. Recommencez depuis le panier.',
  CHECKOUT_EXPIRED: 'Votre session de paiement a expiré. Recommencez la commande.',
  CART_EMPTY: 'Votre panier est vide.',
  OUT_OF_STOCK: 'Stock insuffisant pour au moins un article.',
  INVALID_CUSTOMER_INFO: 'Vérifiez vos informations client (prénom, nom, téléphone, e-mail).',
  INVALID_SHIPPING_ADDRESS: 'Vérifiez l’adresse de livraison (adresse, ville, pays).',
  INVALID_BILLING_ADDRESS: 'Vérifiez l’adresse de facturation.',
  UNAUTHORIZED: 'Session de paiement invalide. Recommencez depuis le panier.',
  PAYMENT_INFO_INCOMPLETE:
    'Paiement temporairement indisponible (configuration PayTech côté serveur). Réessayez plus tard.',
  PAYMENT_DECLINED: 'Le paiement a été refusé.',
  PAYMENT_TIMEOUT: 'Paiement temporairement indisponible.',
};

function readPaytechMessage(error: ApiError): string | undefined {
  const root = error.details;
  if (!root || typeof root !== 'object') return undefined;
  const record = root as Record<string, unknown>;
  const nested = record.details;
  if (nested && typeof nested === 'object') {
    const msg = (nested as Record<string, unknown>).paytechMessage;
    if (typeof msg === 'string' && msg.trim()) return msg.trim();
  }
  const direct = record.paytechMessage;
  if (typeof direct === 'string' && direct.trim()) return direct.trim();
  return undefined;
}

function readBackendMessage(error: ApiError): string | undefined {
  const root = error.details;
  if (!root || typeof root !== 'object') return undefined;
  const msg = (root as Record<string, unknown>).message;
  return typeof msg === 'string' && msg.trim() ? msg.trim() : undefined;
}

/** Messages utilisateur pour init / paytech / confirm (voir frontend-checkout-api.md). */
export function checkoutErrorMessage(error: unknown, fallback = 'Impossible de finaliser la commande.'): string {
  if (!(error instanceof ApiError)) return toErrorMessage(error, fallback);

  const code = getApiErrorCode(error);
  if (code === 'PAYMENT_TIMEOUT') {
    const paytech = readPaytechMessage(error);
    if (paytech) return `Paiement indisponible : ${paytech}`;
  }
  if (code && CHECKOUT_ERROR_MESSAGES[code]) return CHECKOUT_ERROR_MESSAGES[code];

  const backendMsg = readBackendMessage(error);
  if (backendMsg) return backendMsg;

  return toErrorMessage(error, fallback);
}
