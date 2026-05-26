# Intégration PayTech — Spécification backend Nyra

Document pour l’équipe backend. Source : [Documentation PayTech](https://docs.intech.sn/doc_paytech.php).

## Architecture

```
[Frontend Nyra]  →  [Backend Nyra]  →  [https://paytech.sn/api]
                         ↑
              IPN POST (sale_complete / sale_canceled)
```

- Ne jamais exposer `PAYTECH_API_KEY` / `PAYTECH_API_SECRET` au frontend.
- Le frontend appelle uniquement les routes Nyra ci-dessous.

## Variables d’environnement

```env
PAYTECH_API_KEY=
PAYTECH_API_SECRET=
PAYTECH_BASE_URL=https://paytech.sn/api
PAYTECH_ENV=prod
PAYTECH_IPN_URL=https://api.nyra.sn/api/webhooks/paytech/ipn
PAYTECH_SUCCESS_URL=https://nyra.sn/checkout/payment/return?result=success
PAYTECH_CANCEL_URL=https://nyra.sn/checkout/payment/return?result=cancel
```

## Initier un paiement (côté backend)

`POST https://paytech.sn/api/payment/request-payment`

Headers : `API_KEY`, `API_SECRET`

Body (form ou JSON selon implémentation) :

| Paramètre | Obligatoire | Description |
|-----------|-------------|-------------|
| `item_name` | Oui | Nom commande |
| `item_price` | Oui | Montant (XOF) |
| `ref_command` | Oui | Référence unique |
| `command_name` | Oui | Description |
| `currency` | Non | Défaut `XOF` |
| `env` | Non | `test` ou `prod` |
| `ipn_url` | Non | Webhook HTTPS |
| `success_url` | Non | Redirection succès |
| `cancel_url` | Non | Redirection annulation |
| `custom_field` | Non | JSON encodé (ex. `checkoutId`, `userId`) |

Réponse succès : `redirect_url` / `redirectUrl` + `token`.

Le client choisit Wave, Orange Money, carte, etc. **sur la page PayTech** — pas de sélection côté Nyra.

## IPN (webhook)

`POST /api/webhooks/paytech/ipn`

Événements :

| `type_event` | Action backend |
|--------------|----------------|
| `sale_complete` | Confirmer commande, statut `SUCCESS` |
| `sale_canceled` | Statut `CANCELED` |

Vérification (doc PayTech) :

- **HMAC** (recommandé) : `HMAC-SHA256(item_price|ref_command|api_key, api_secret)` vs `hmac_compute`
- **SHA256** (classique) : hash des clés API

Répondre **HTTP 200** avec corps `IPN OK`.

## Statut paiement (secours)

`GET https://paytech.sn/api/payment/get-status?token_payment={token}`

Headers : `API_KEY`, `API_SECRET`

Limiter les appels ; privilégier l’IPN.

## Checkout invité (sans compte)

Le frontend permet de payer **sans être connecté**.

1. `POST /api/checkout/init` **sans** `Authorization` — body avec `customer`, adresses, `items`.
2. Réponse : `checkoutId` + **`guestToken`** (jeton opaque, durée limitée).
3. Appels suivants avec header **`X-Checkout-Token: {guestToken}`** :
   - `POST /api/checkout/:checkoutId/payment/paytech`
   - `GET /api/payments/:paymentId/status`
   - `POST /api/checkout/:checkoutId/confirm` (après IPN `sale_complete`)

Si l’utilisateur est connecté : `Authorization: Bearer {jwt}` (le `guestToken` est optionnel).

Associer la commande invité à l’e-mail / téléphone du body `customer` pour le suivi et l’IPN.

## Contrat API Nyra (frontend)

### `POST /api/checkout/init` (invité ou connecté)

Réponse minimum :

```json
{
  "checkoutId": "uuid",
  "guestToken": "opaque-token-pour-invite"
}
```

`guestToken` requis pour les invités ; peut être omis si JWT fourni.

### `POST /api/checkout/:checkoutId/payment/paytech`

Le backend calcule le montant, génère `ref_command`, appelle PayTech.

Réponse 201 :

```json
{
  "paymentId": "uuid-interne",
  "refCommand": "NYRA-...",
  "token": "40j515fgrkynl56hi",
  "status": "PENDING",
  "redirectUrl": "https://paytech.sn/payment/checkout/..."
}
```

### `GET /api/payments/:paymentId/status`

Auth : JWT **ou** `X-Checkout-Token` (invité).

```json
{
  "paymentId": "uuid",
  "status": "PENDING",
  "refCommand": "NYRA-...",
  "errorType": null
}
```

### `GET /api/me/payments/pending`

Liste des paiements `PENDING` pour le bandeau compte client.

### `POST /api/checkout/:checkoutId/confirm`

Body : `{ "paymentMethod": "paytech" }` — après `sale_complete` (webhook ou statut vérifié).

## Checklist backend

- [ ] Service PayTech (`request-payment`, timeout adapté)
- [ ] `POST /api/webhooks/paytech/ipn` + vérif HMAC ou SHA256
- [ ] `POST /api/checkout/:id/payment/paytech`
- [ ] `GET /api/payments/:id/status`
- [ ] `GET /api/me/payments/pending`
- [ ] Confirmation commande idempotente sur `sale_complete`
- [ ] Checkout invité : `guestToken` + header `X-Checkout-Token`
