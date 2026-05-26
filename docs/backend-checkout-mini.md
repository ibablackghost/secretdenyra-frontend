# Checkout backend — mini-spec

**Base** : `{VITE_STRAPI_URL}` (ex. Railway), même origine que Strapi.

## À implémenter

| Méthode | Route |
|--------|--------|
| `POST` | `/api/checkout/init` |
| `POST` | `/api/checkout/:checkoutId/payment/paytech` |
| `POST` | `/api/checkout/:checkoutId/confirm` |
| `GET` | `/api/payments/:paymentId/status` |
| `GET` | `/api/me/payments/pending` |
| `POST` | `/api/webhooks/paytech/ipn` |

**Auth** :
- Utilisateur connecté : `Authorization: Bearer <jwt>`
- Invité : pas de JWT ; `POST /api/checkout/init` renvoie `guestToken` → header `X-Checkout-Token` sur payment/status/confirm

## Init — body (résumé)

`customer`, `shippingAddress`, `billingAddress`, `billingSameAsShipping`, `items[]` avec `productId` + `quantity`.

## Init — réponse minimum

Au moins : `checkout_session_id` **ou** `checkoutId` ; pour invité : **`guestToken`** aussi.

## Confirm — body

`{ "paymentMethod": "paytech" }` — après IPN PayTech `sale_complete`.

## Confirm — réponse minimum

`order.id` ou `orderId`.

---

**Sans ces routes** → le front connecté obtient un **404** sur `/api/checkout/init`.

Détail : `docs/backend-indications-checkout.md`.
