# Front — Nettoyage PayTech + images produits achetés

Backend a viré PayTech. Checklist front (compte client + médias).

## 1. Supprimer toute UI PayTech

Cherche et retire :

- textes / boutons `PayTech`, `Payer sur PayTech`
- appels `POST /api/checkout/:id/payment/paytech`
- `paymentMethod: "paytech"`
- composants legacy (`PaytechPaymentInfo`, `paytechTypes`)

### Remplacer par Sycapay

- Doc : [`frontend-checkout-sycapay.md`](./frontend-checkout-sycapay.md)
- Route : `POST /api/checkout/:checkoutId/payment/sycapay`
- Retour : `redirectUrl` / `deeplink` / `deepLinks` / OTP selon opérateur

## 2. Paiements en attente (`GET /api/me/payments/pending`)

Backend ne doit renvoyer que les `PENDING` **Sycapay**.

### UI

- Si `count === 0` → **ne pas afficher** le bandeau / section
- Si item Sycapay PENDING → **Reprendre** / **Vérifier**
- Cache local Zustand `nyra-pending-payments` version **2** : purge auto des vieux PayTech

Après cleanup DB → voir [`backend-cleanup-paytech-db.md`](./backend-cleanup-paytech-db.md).

## 3. Produits achetés — images

Endpoint : `GET /api/me/purchased-products`

```ts
// Front : MediaImage + resolveMediaUrl
resolveMediaUrl(product.image) // string | { url } | Strapi nested
```

Fallback catalogue si image API absente. Si toujours cassé → `PUBLIC_URL` + ré-upload (backend).

## 4. Compte utilisateur — dashboard

`/account` : layout **sidebar** (vue d’ensemble, profil, adresses, commandes, achetés, wishlist, vus, pro, paiements si > 0).

## 5. Checklist front

- [x] Plus aucune mention / bouton PayTech (UI)
- [x] Checkout uniquement Sycapay (Wave / OM)
- [x] Bandeau pending masqué si `count === 0`
- [x] Produits achetés : `resolveMediaUrl` + fallback
- [x] Dashboard compte avec sidebar
- [ ] Après cleanup backend : refresh compte → plus de cartes PayTech

## 6. Backend (toi / DB)

→ [`backend-cleanup-paytech-db.md`](./backend-cleanup-paytech-db.md)
