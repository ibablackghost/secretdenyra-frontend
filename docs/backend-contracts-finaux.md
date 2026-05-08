# Contrats Backend Finaux — Frontend Release Candidate

## Objectif

Figer les contrats API nécessaires au frontend RC pour un e-commerce fiable (catalogue, panier, checkout, analytics, compte).

---

## 1) Contrat catalogue

## Endpoint recommandé

- `GET /api/products/catalog`

## Réponse minimum

- `products[]`
  - `id` (string stable)
  - `slug` (unique)
  - `name`
  - `price` (number)
  - `compareAtPrice?`
  - `stockQty?`
  - `inStock` (boolean)
  - `image`
  - `gallery[]?`
  - `category` (`id`, `name`, `slug`)
  - `tags[]` (`id`, `name`, `slug`)
  - `variants[]?` (`id`, `size?`, `colorName?`, `colorHex?`, `price?`, `compareAtPrice?`, `stockQty?`, `inStock?`)
- `categories[]`
- `tags[]`
- `pagination` (`page`, `pageSize`, `totalItems`, `totalPages`)

## Règles

- tri + filtres appliqués côté serveur sur les mêmes clés que le frontend (`category`, `teaTag`, `q`, `sort`, `priceMax`)
- pagination stable (pas de doublons entre pages)

---

## 2) Contrat checkout

## Endpoints

- `POST /api/checkout/init`
- `PATCH /api/checkout/:sessionId`
- `GET /api/checkout/:sessionId/summary`
- `POST /api/checkout/:sessionId/confirm`

## Payload init attendu

- `customer` (`firstName`, `lastName`, `email`, `phone`)
- `shippingAddress` (`line1`, `line2?`, `city`, `region?`, `postalCode?`, `country`)
- `billingAddress` (même structure)
- `billingSameAsShipping` (boolean)
- `items[]` (`productId`, `quantity`)

## Réponse backend

- `checkout_session_id` (obligatoire)
- `items` recalculés (prix serveur)
- `subtotal`, `shippingFee`, `discounts`, `total`, `currency`
- `status`

## Règles

- backend = source de vérité prix/stock
- validation forte avant confirmation paiement
- erreurs structurées obligatoires:
  - `code` (ex: `OUT_OF_STOCK`, `PRICE_MISMATCH`, `PAYMENT_DECLINED`)
  - `message`
  - `details?`

---

## 3) Contrat compte utilisateur

## Endpoints

- `GET /api/me`
- `GET /api/me/orders`
- `GET /api/me/orders/:id`
- `GET /api/me/addresses`
- `POST /api/me/addresses`
- `PUT /api/me/addresses/:id`
- `DELETE /api/me/addresses/:id`
- `GET /api/me/wishlist`
- `GET /api/me/viewed-products`

## Exigences

- identité JWT fiable (aucune donnée croisée entre comptes)
- tri des commandes (plus récente -> plus ancienne)
- réponses compatibles avec les vues frontend dashboard/historique/adresses

---

## 4) Contrat analytics conversion

Le frontend envoie:

- `view_item`
- `add_to_cart`
- `remove_from_cart`
- `begin_checkout`
- `checkout_step_view`
- `checkout_step_complete`
- `checkout_payment_failed`
- `cart_abandoned`

## Champs attendus

- `currency` = `XOF`
- `value`
- `items[]` avec `item_id`, `item_name`, `item_category?`, `price?`, `quantity?`
- `checkout_session_id` (prochaine itération, fortement recommandé)

## Dédoublonnage

- frontend: TTL par fingerprint event
- backend/BI: seconde couche de dédup recommandée (fenêtre 30s-5min)

---

## 5) Contrat SEO / perf

## SEO

- slugs uniques catégorie/produit
- champs SEO optionnels (`metaTitle`, `metaDescription`, `ogImage`, `canonicalSlug`)
- endpoints `sitemap.xml` et `robots.txt` recommandés côté backend

## Perf

- pagination serveur obligatoire
- payloads compacts (pas de sur-population inutile)
- cache headers sur catalogue (`Cache-Control`, `ETag` recommandé)

---

## Go/No-Go Release Candidate (Front)

- [ ] Tous endpoints ci-dessus disponibles ou mockés contractuellement
- [ ] Erreurs API normalisées sur checkout/catalogue
- [ ] IDs/slug stables entre env
- [ ] `checkout_session_id` retourné à l’init
- [ ] Pipeline analytics validé avec dédup (front + BI)
- [ ] Recalcul serveur des montants confirmé
