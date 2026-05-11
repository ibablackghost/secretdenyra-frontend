# Checkout backend — mini-spec

**Base** : `{VITE_STRAPI_URL}` (ex. Railway), même origine que Strapi.

## À implémenter

| Méthode | Route |
|--------|--------|
| `POST` | `/api/checkout/init` |
| `POST` | `/api/checkout/:checkoutId/confirm` |

**Auth** : `Authorization: Bearer <jwt>` sur les deux.

## Init — body (résumé)

`customer`, `shippingAddress`, `billingAddress`, `billingSameAsShipping`, `items[]` avec `productId` + `quantity`.

## Init — réponse minimum

Au moins : `checkout_session_id` **ou** `checkoutId` (string utilisée dans l’URL `confirm`).

## Confirm — body

`{ "paymentMethod": "card" | "mobile-money" | "cash-on-delivery", "paymentIntentId?": "..." }`

## Confirm — réponse minimum

`order.id` ou `orderId`.

---

**Sans ces routes** → le front connecté obtient un **404** sur `/api/checkout/init`.

Détail : `docs/backend-indications-checkout.md`.
