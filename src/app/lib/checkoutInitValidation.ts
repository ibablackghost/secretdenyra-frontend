import type { CheckoutInitResponse } from '../services/api/commerceApi';

type PricedLine = { name: string; unitPrice: number; quantity: number };

/** Vérifie que le serveur a bien appliqué les prix / variantes du panier (frontend-checkout-variantes.md). */
export function validateInitAgainstCart(
  init: CheckoutInitResponse & {
    subtotal?: number;
    items?: Array<{ unitPrice?: number; lineTotal?: number; quantity?: number }>;
  },
  cartLines: PricedLine[],
  expectedSubtotal: number
): string | null {
  const initItems = Array.isArray(init.items) ? init.items : [];

  if (initItems.length > 0 && initItems.length !== cartLines.length) {
    return 'Le serveur n’a pas validé tous les articles du panier. Rechargez la page et réessayez.';
  }

  for (let i = 0; i < cartLines.length; i++) {
    const cart = cartLines[i];
    const server = initItems[i];
    if (!server?.unitPrice) continue;
    if (server.unitPrice !== cart.unitPrice) {
      return `Le format ou le prix de « ${cart.name} » ne correspond pas côté serveur (${server.unitPrice} XOF affiché, ${cart.unitPrice} XOF attendu). Rechargez la fiche produit et réessayez.`;
    }
  }

  const serverSubtotal = typeof init.subtotal === 'number' ? init.subtotal : undefined;
  if (serverSubtotal != null && Math.abs(serverSubtotal - expectedSubtotal) > 50) {
    return `Le sous-total serveur (${serverSubtotal} XOF) ne correspond pas au panier (${expectedSubtotal} XOF). Vérifiez les formats choisis (250g / 50g).`;
  }

  return null;
}
