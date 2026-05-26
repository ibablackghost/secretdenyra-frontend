# Backend Nyra — Corrections checkout & PayTech (prod Railway)

**Document pour l’équipe backend** (`nyra-cms` / Strapi 5).  
**Émetteur :** équipe frontend (mai 2026).  
**Référence front :** `frontend-checkout-api.md` (contrat API aligné avec le code Vite).

---

## Résumé exécutif

| Élément | État constaté en prod |
|--------|----------------------|
| Routes checkout (`init`, `payment/paytech`, etc.) | **OK** — déployées et répondent |
| `POST /api/checkout/init` (produit valide) | **200** |
| `POST /api/checkout/init` (produit invalide) | **404** + `PRODUCT_NOT_FOUND` (comportement attendu) |
| `POST .../payment/paytech` | **503** + `PAYMENT_TIMEOUT` — **PayTech refuse la création de paiement** |
| Frontend Vercel | Prêt — appelle uniquement le backend Railway |

**Conclusion :** le tunnel checkout backend est en place. Le blocage actuel des paiements est **côté compte / clés PayTech en production**, pas côté routes manquantes ni côté frontend.

---

## URLs de production (à utiliser telles quelles)

| Rôle | URL |
|------|-----|
| Backend API | `https://secretdenyra-backend-production.up.railway.app` |
| Frontend | `https://secretdenyra-frontend.vercel.app` |
| PayTech API (serveur uniquement) | `https://paytech.sn/api` |

Préfixe routes Nyra : **`/api`** (ex. `/api/checkout/init`).

---

## Problème n°1 — Paiement PayTech : HTTP 503 (priorité haute)

### Symptôme

Après un `init` réussi, l’appel :

```http
POST /api/checkout/{checkoutId}/payment/paytech
X-Checkout-Token: {guestToken}
```

renvoie **503** avec un body structuré (exemple réel prod, mai 2026) :

```json
{
  "code": "PAYMENT_TIMEOUT",
  "message": "Paiement temporairement indisponible.",
  "details": {
    "paytechReason": "paytech_rejected",
    "paytechMessage": "Veuillez nous contacter sur l'email de support@paytech.sn ou sur WhatsApp +221771255799/+221772457199 pour activer votre compte afin d'encaisser des paiements en production"
  },
  "requestId": "..."
}
```

### Cause probable

PayTech **rejette** l’appel `request-payment` en **production** : compte marchand non activé pour encaisser en prod, ou clés / `PAYTECH_ENV` incohérents (clés `test` avec `env=prod`, etc.).

Ce n’est **pas** un bug du frontend (le front n’appelle jamais `paytech.sn`).

### Actions backend

1. **Contacter PayTech** (support@paytech.sn / WhatsApp indiqués dans le message ci-dessus) pour **activer l’encaissement en production**.
2. Vérifier sur **Railway** (variables d’environnement du service backend, pas seulement `.env` local) :

```env
PAYTECH_API_KEY=<clé fournie par PayTech>
PAYTECH_API_SECRET=<secret fourni par PayTech>
PAYTECH_BASE_URL=https://paytech.sn/api
PAYTECH_ENV=prod
```

3. Mettre à jour les URLs de redirection et IPN (**ne pas** laisser les placeholders `api.nyra.sn` / `nyra.sn` si le domaine prod est Railway + Vercel) :

```env
PAYTECH_IPN_URL=https://secretdenyra-backend-production.up.railway.app/api/webhooks/paytech/ipn
PAYTECH_SUCCESS_URL=https://secretdenyra-frontend.vercel.app/checkout/payment/return?result=success
PAYTECH_CANCEL_URL=https://secretdenyra-frontend.vercel.app/checkout/payment/return?result=cancel
```

4. **Redéployer** Railway après modification des variables.
5. **Tester** depuis le serveur (ou script) :

```bash
# 1) Init
curl -s -X POST "https://secretdenyra-backend-production.up.railway.app/api/checkout/init" \
  -H "Content-Type: application/json" \
  -d '{"customer":{"firstName":"Test","lastName":"User","email":"test@example.com","phone":"770000000"},"shippingAddress":{"line1":"1 rue test","line2":"","city":"Dakar","region":"","postalCode":"","country":"SN"},"billingAddress":{"line1":"1 rue test","line2":"","city":"Dakar","region":"","postalCode":"","country":"SN"},"billingSameAsShipping":true,"items":[{"productId":"mauve-bio-en-vrac-250g","quantity":1}]}'

# 2) PayTech (remplacer CHECKOUT_ID et GUEST_TOKEN par la réponse init)
curl -s -X POST "https://secretdenyra-backend-production.up.railway.app/api/checkout/CHECKOUT_ID/payment/paytech" \
  -H "Content-Type: application/json" \
  -H "X-Checkout-Token: GUEST_TOKEN"
```

**Succès attendu :** HTTP **201** avec `redirectUrl`, `paymentId`, `refCommand`, `token`.

### Codes 503 à renvoyer (déjà documentés côté front)

| `code` | Signification | Action |
|--------|---------------|--------|
| `PAYMENT_INFO_INCOMPLETE` | `PAYTECH_*` manquantes sur Railway | Renseigner toutes les variables |
| `PAYMENT_TIMEOUT` | PayTech a refusé / timeout | Lire `details.paytechMessage`, activer compte ou corriger clés |

Conserver **`details.paytechMessage`** dans la réponse JSON (le frontend l’affiche à l’utilisateur).

---

## Problème n°2 — `POST /api/checkout/init` → HTTP 404 (souvent mal interprété)

### Symptôme côté navigateur

`POST .../api/checkout/init` → **404 (Not Found)**.

### Ce n’est en général PAS « route absente »

En prod, la route **existe**. Un 404 avec body :

```json
{
  "code": "PRODUCT_NOT_FOUND",
  "message": "Produit ou variante introuvable.",
  "requestId": "..."
}
```

signifie : **un `productId` du body n’existe pas** (ou produit non publié) sur le Strapi de production.

### `productId` acceptés (selon spec actuelle)

- `documentId` Strapi  
- `slug` produit  
- `id` numérique  

Les produits doivent être **publiés** sur l’environnement **prod** Railway.

### Distinction des 404 (à respecter dans les logs / support)

| `code` | Signification |
|--------|----------------|
| `NOT_FOUND` | URL ou route incorrecte (`/api/checkouts/init`, pas de `/api`, etc.) |
| `PRODUCT_NOT_FOUND` | Route OK, produit introuvable |
| `CHECKOUT_NOT_FOUND` | `checkoutId` inconnu (route paytech / confirm) |

---

## Checklist configuration backend (prod)

### Variables Railway — PayTech

- [ ] `PAYTECH_API_KEY` renseignée (prod)
- [ ] `PAYTECH_API_SECRET` renseignée (prod)
- [ ] `PAYTECH_BASE_URL=https://paytech.sn/api`
- [ ] `PAYTECH_ENV=prod` (ou `test` **uniquement** si clés de test)
- [ ] `PAYTECH_IPN_URL` → URL Railway webhook (voir ci-dessus)
- [ ] `PAYTECH_SUCCESS_URL` → page front `/checkout/payment/return?result=success`
- [ ] `PAYTECH_CANCEL_URL` → page front `/checkout/payment/return?result=cancel`
- [ ] Compte PayTech **activé pour encaisser en production** (validation support PayTech)

### CORS (`config/middlewares.ts`)

- [ ] `http://localhost:5173` et `http://127.0.0.1:5173` (dev)
- [ ] `https://secretdenyra-frontend.vercel.app` (prod)
- [ ] Header `X-Checkout-Token` autorisé (preflight)

### Routes checkout (déjà attendues par le front)

- [ ] `POST /api/checkout/init`
- [ ] `POST /api/checkout/:checkoutId/payment/paytech`
- [ ] `GET /api/payments/:paymentId/status`
- [ ] `POST /api/checkout/:checkoutId/confirm` (body : `{ "paymentMethod": "paytech", "paymentId": "..." }`)
- [ ] `GET /api/me/payments/pending` (JWT)
- [ ] `POST /api/webhooks/paytech/ipn` (IPN PayTech, réponse `200` + `IPN OK`)

### Webhook IPN

- [ ] Route accessible en HTTPS depuis Internet (PayTech → Railway)
- [ ] Vérification HMAC / SHA256 selon doc PayTech
- [ ] Mise à jour statut paiement + commande sur `sale_complete`

---

## Ce que le frontend fait (pour éviter les fausses pistes)

1. `VITE_STRAPI_URL=https://secretdenyra-backend-production.up.railway.app` (sans `/api` final).
2. Flux : `init` → `payment/paytech` → redirection `redirectUrl` → page `/checkout/payment/return` → poll `status` → `confirm`.
3. Invité : `guestToken` en session, header `X-Checkout-Token` sur paytech / status / confirm (**pas** sur `init`).
4. Envoi des `productId` = **slugs catalogue** publiés en prod.
5. Aucune clé PayTech dans le code front.

---

## Critères d’acceptation (backend « OK » pour la mise en prod paiement)

1. `POST /api/checkout/init` avec un slug produit publié → **200** + `checkoutId` + `guestToken` (invité).
2. `POST .../payment/paytech` avec `X-Checkout-Token` → **201** + `redirectUrl` HTTPS PayTech.
3. Après paiement test PayTech, IPN reçu → statut paiement **SUCCESS** en base.
4. `POST .../confirm` avec `paymentMethod: "paytech"` → **200** + `orderId`.
5. En cas d’échec PayTech, réponse JSON avec `code` + `details.paytechMessage` (pas de 503 vide).

---

## Références internes

| Document | Audience |
|----------|----------|
| `frontend-checkout-api.md` | Contrat API front ↔ backend (détail routes, erreurs) |
| `docs/paytech-api-backend.md` | Intégration PayTech côté serveur |
| `docs/backend-checkout-mini.md` | Liste minimale des routes |

---

## Confirmation (équipe frontend)

Les constats de ce document ont été **vérifiés par appels HTTP directs** sur `https://secretdenyra-backend-production.up.railway.app` en mai 2026 :

- `init` + produit valide → **200**
- `init` + produit invalide → **404** + `PRODUCT_NOT_FOUND`
- `payment/paytech` après `init` valide → **503** + `PAYMENT_TIMEOUT` + message PayTech demandant l’**activation du compte en production**

**Le frontend est aligné sur `frontend-checkout-api.md`.** La correction prioritaire backend est l’**activation PayTech prod** et la **configuration Railway `PAYTECH_*`**, pas le déploiement des routes checkout (déjà fonctionnelles).

*Contact frontend : transmettre ce fichier tel quel à l’équipe backend / DevOps Railway.*
