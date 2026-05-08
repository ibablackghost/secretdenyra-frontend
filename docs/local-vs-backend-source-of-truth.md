# Nyra Frontend — Local vs Backend (Source de verite)

## Objectif du document

Ce document decrit, de maniere exhaustive, ce que le frontend stocke/utilise en local et ce qu'il attend du backend Strapi pour fonctionner correctement.

Il sert de reference pour:

- equipe frontend (etats locaux, fallback, synchro);
- equipe backend (contrats API attendus);
- QA (verification coherence des donnees).

---

## 1) Regle generale

- **Source de verite metier**: backend Strapi.
- **Local frontend**: cache UX, persistance session/appareil, fallback temporaire.

En pratique:

- si utilisateur **non connecte**: certains stores restent locaux (panier, wishlist, etc.);
- si utilisateur **connecte**: le frontend tente une synchro backend et rehydrate les stores.

---

## 2) Inventaire complet des donnees locales (frontend)

## 2.1 Auth (`nyra-auth`)

Stocke localement (persist Zustand):

- `token` (JWT)
- `user` (profil courant simplifie)
- `isAuthenticated`
- `isLoadingMe`

Attendu backend:

- auth reelle via Strapi (`/api/auth/local`, `/api/auth/local/register`)
- profil via `/api/me`

Remarque:

- local ne doit pas etre considere source de verite profile long terme;
- `loadMe()` au demarrage sert a revalider/rehydrater depuis backend.

---

## 2.2 Panier (`nyra-cart`)

Stocke localement:

- `items[]` (`productId`, `quantity`, `itemId?`)

Comportement:

- local update immediate (UX rapide)
- puis tentative sync backend (si token dispo)
- rehydrate backend apres mutation si possible

Attendu backend:

- `GET /api/cart`
- `POST /api/cart/items`
- `PATCH /api/cart/items/:itemId`
- `DELETE /api/cart/items/:itemId`

Champs critiques attendus:

- `productId` stable
- `quantity`
- `itemId` (important pour update/delete)

---

## 2.3 Wishlist (`nyra-wishlist`)

Stocke localement:

- `ids[]` (ids/slug wishlist connus front)
- `count`

Comportement:

- `toggle/remove` modifient local immediate
- sync backend ensuite
- `hydrateFromServer()/loadWishlist()` pour re-aligner

Attendu backend (espace connecte):

- `GET /api/me/wishlist`
- `POST /api/me/wishlist/items`
- `DELETE /api/me/wishlist/items/:productId`

Formats backend supportes par le front:

- `items[]`
- `products[]`
- `productIds[]`
- `count`

Le frontend normalise en:

- `productIds` deduits de `items/products/productIds`
- `count` backend (ou fallback longueur ids)

---

## 2.4 Draft checkout (`nyra-checkout-draft`)

Stocke localement:

- `customer`
- `shipping`
- `billing`
- `billingSameAsShipping`

Role:

- brouillon UX multi-etapes
- reprise formulaire apres refresh

Attendu backend (source verite checkout):

- `POST /api/checkout/init`
- `PATCH /api/checkout/:checkoutId`
- `GET /api/checkout/:checkoutId/summary`
- `POST /api/checkout/:checkoutId/payment-intent`
- `POST /api/checkout/:checkoutId/confirm`

Champs critiques:

- `checkout_session_id`
- montants recalcules serveur (`subtotal`, `shippingFee`, `total`, `currency`)

---

## 2.5 Adresses (`nyra-addresses`)

Stocke localement:

- `addresses[]`

Comportement:

- CRUD local immediate
- tentative sync backend
- rehydrate backend apres operation

Attendu backend:

- `GET /api/me/addresses`
- `POST /api/me/addresses`
- `PATCH /api/me/addresses/:id`
- `DELETE /api/me/addresses/:id`
- `POST /api/me/addresses/:id/default`

Formats backend supportes (lecture):

- `items[]` ou `addresses[]`

---

## 2.6 Commandes (`nyra-orders`)

Stocke localement:

- `orders[]`

Comportement:

- lecture backend via hydrate
- fallback local possible (ex ajout commande local dans mode pre-integration)

Attendu backend:

- `GET /api/me/orders?page=1&pageSize=20`
- (eventuellement `GET /api/me/orders/:id` pour detail)

Formats backend supportes (lecture):

- `items[]` ou `orders[]`

Securite front appliquee:

- normalisation defensive en tableau pour eviter crash (`reduce/map/filter` sur undefined).

---

## 2.7 Produits vus (`nyra-viewed-products`)

Stocke localement:

- `ids[]` (historique recent, max 24)

Comportement:

- push local immediate
- tentative push backend si connecte
- rehydrate backend possible

Attendu backend:

- `GET /api/me/viewed-products`
- `POST /api/me/viewed-products`

Formats backend supportes (lecture):

- `items[]` ou `products[]`

---

## 2.8 Toast UI (`toastStore`)

Stocke localement:

- file de notifications UI

Attendu backend:

- rien (strictement presentation UX)

---

## 3) Donnees non-stockees en local comme source metier

## Catalogue

Le catalogue est charge via API (services hooks), pas considere source metier locale.

Attendu backend:

- endpoint catalogue robuste + pagination + filtres + tri
- ids/slug produits stables

## SEO

- metas calculees front selon routes/produits
- source semantique (slug, title, etc.) attendue du backend/CMS

## Analytics

- emission events cote front (GA4/PostHog)
- backend attendu pour correlation forte (checkout_session_id, purchase serveur)

---

## 4) Ce que le frontend attend explicitement du backend (contrats)

## Auth / Profil

- `POST /api/auth/local`
- `POST /api/auth/local/register`
- `GET /api/me`
- `PATCH /api/me`

Attendus:

- JWT valide
- objet user/profil coherent
- erreurs structurees (`code`, `message`, `details`)

## Wishlist

- endpoints `/api/me/wishlist*`
- reponse contenant au moins une de ces structures:
  - `items[]` (avec `productId` ou `product.id/slug`)
  - `products[]`
  - `productIds[]`
  - `count`

## Cart

- `GET/POST/PATCH/DELETE /api/cart*`
- inclure `itemId` pour mutation fiable

## Checkout

- session checkout serveur et montants recalcules
- erreurs paiement explicites (`declined`, `timeout`, etc.)

## Account

- commandes: `items[]` ou `orders[]`
- adresses: `items[]` ou `addresses[]`
- produits vus: `items[]` ou `products[]`

---

## 5) Politique de fallback locale actuelle

Quand backend indisponible / token absent / endpoint en echec:

- le front conserve un comportement local pour ne pas bloquer l'UX;
- la synchro backend est "best effort" (try/catch silencieux dans plusieurs stores);
- resultat: UX fluide, mais possible divergence temporaire avec backend.

C'est voulu pour continuer a naviguer, mais a monitorer en prod.

---

## 6) Risques de divergence (a connaitre)

1. Mutation locale reussie mais sync backend echouee.
2. Formats backend variables selon endpoints/environnements.
3. Utilisation mix id/slug si contrat backend pas strict.
4. Refresh entre mutation locale et rehydrate serveur.

Mitigations deja appliquees:

- hydrations apres login et apres mutations critiques;
- normalisation defensive des reponses;
- `isWishlisted` robuste sur `id` et `slug`.

---

## 7) Ce qu'il reste a verrouiller cote backend pour du 100% fiable

1. Standardiser definitivement tous les payloads (pas de variantes `items/orders`, etc.).
2. Toujours renvoyer des ids stables (documentId/uuid) pour produits/items.
3. Fournir `checkout_session_id` sur init checkout et le conserver jusqu'a order.
4. Ajouter event serveur `purchase` (webhook paiement) pour verite conversion finale.
5. Retourner erreurs API homogenes avec codes exploitables front.

---

## 8) Recommandation finale d'architecture

Court terme (actuel):

- conserver fallback local pour experience fluide;
- continuer hydratation backend agressive au login et apres mutations.

Moyen terme (cible prod robuste):

- backend source de verite stricte;
- local = cache uniquement;
- contrat API versionne et stable;
- observabilite des ecarts sync (logs/metrics).

---

## 9) Checklist QA (local vs backend)

- [ ] Login -> `loadMe` ok -> compte affiche backend
- [ ] Wishlist add/remove coherent sur Product/Shop/Wishlist/Account/Header
- [ ] Refresh page: wishlist/panier restent coherents
- [ ] Logout: donnees sensibles nettoyees
- [ ] Account sans commandes: aucun crash, `totalSpent` = 0
- [ ] Checkout utilise montants backend (quand endpoints reels branches)
- [ ] Erreurs backend affichees proprement en UI

---

## Resume executif

Le frontend utilise encore des stores locaux pour la resilience UX, mais il est maintenant structure pour se synchroniser avec le backend sur les domaines critiques (auth, wishlist, cart, account).

Pour atteindre une coherence totale, le backend doit fournir des payloads stricts et stables sur tous les endpoints metier.
