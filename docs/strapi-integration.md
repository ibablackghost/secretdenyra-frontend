# Strapi — Backend Nyra & intégration frontend

Ce document sert de **plan de travail** pour passer d’un mock (`src/app/data.ts`) à un **backend Strapi réel** (API + médias + utilisateurs), puis brancher progressivement **nyra-frontend**.

> **Références officielles** : [Strapi Documentation](https://docs.strapi.io/) — les détails (syntaxe REST exacte, `documentId` en v5, etc.) peuvent varier selon la version ; vérifie la doc de **ta** version après `create-strapi-app`.

---

## 1. Rôle de Strapi dans le projet

| Responsabilité | Où ça vit après intégration |
|----------------|-----------------------------|
| Produits, catégories, images | **Strapi** (collections + Media Library) |
| Comptes clients, connexion | **Strapi Users & Permissions** (+ JWT) |
| Liste de souhaits par utilisateur | **Strapi** (collection liée à `User` + `Product`) ou champ custom étendu |
| Panier « persisté » multi-appareils | Souvent **Strapi** (`Cart` / `Order` draft) ou service dédié |
| Catalogue public (sans compte) | API **Public** (`find` / `findOne`) |

Le frontend React reste un **client** : il ne fait qu’appeler `https://ton-strapi/api/...` avec ou sans `Authorization: Bearer <jwt>`.

---

## 2. Prérequis & structure des dépôts

- **Node.js** LTS (voir version minimale sur la doc Strapi).
- Deux dossiers distincts (simple et clair) :

```
Desktop/
├── nyra-frontend/     # déjà existant — Vite + React
└── nyra-cms/          # à créer — Strapi
```

Tu peux plus tard les mettre dans un **monorepo** (`apps/web`, `apps/cms`) si besoin.

---

## 3. Créer le backend Strapi

### Développement rapide (SQLite)

```bash
cd Desktop
npx create-strapi-app@latest nyra-cms --quickstart
```

Choisis **Login with GitHub / email** pour l’admin, puis crée le premier utilisateur admin dans le navigateur.

- **Admin** : `http://localhost:1337/admin`
- **API** : `http://localhost:1337/api`

### Production / équipe (PostgreSQL recommandé)

Lors de la création du projet (ou après), configure `.env` dans `nyra-cms` :

```env
DATABASE_CLIENT=postgres
DATABASE_HOST=127.0.0.1
DATABASE_PORT=5432
DATABASE_NAME=nyra
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=secret
DATABASE_SSL=false
```

Adapte selon ton hébergeur (Railway, Render, VPS, etc.). Ne **commite jamais** `.env` avec des secrets.

---

## 4. Modélisation du contenu (Content-Type Builder)

Active **Draft & Publish** sur les types qui doivent passer par validation avant mise en ligne (produits, pages).

### 4.1 Collection **Category**

| Champ | Type Strapi | Notes |
|-------|-------------|--------|
| `name` | Text | Ex. « Thé noir » |
| `slug` | UID | Lié à `name` — utilise **le même slug** que dans les liens du front (`the-noir`, `infusion`, …) |
| `image` | Media (single image) | Pour la grille « familles de thé » |
| `sortOrder` | Number (integer) | Optionnel — ordre d’affichage |

**Publication** : publier chaque entrée une fois les champs remplis.

### 4.2 Collection **Product**

Aligné sur ce que consomme le front aujourd’hui (`id`, `name`, `ingredients`, `price`, `rating`, `reviews`, `image`, `category`, `bgClass`).

| Champ | Type Strapi | Notes |
|-------|-------------|--------|
| `name` | Text | Nom commercial |
| `slug` | UID | URL stable ; le front peut utiliser `/product/:slug` au lieu de l’id numérique Strapi |
| `ingredients` | Text (long) | Liste type « Menthe • Anis • … » |
| `price` | Number (integer) | Montant **en XOF** (entier), comme dans `data.ts` |
| `rating` | Decimal | Ex. 4.9 |
| `reviews` | Integer | Nombre d’avis affiché |
| `bgClass` | Enumeration ou Text | Classes Tailwind du fond carte : `bg-[#F2EDF3]`, etc. (ou une clé courte `lavender` mappée côté front) |
| `image` | Media (single image) | Visuel principal |
| `gallery` | Media (multiple) | Optionnel — carrousel fiche produit |
| `description` | Rich text | Optionnel — bloc description longue |
| `category` | Relation **many-to-one** → `Category` | Filtre boutique par famille |

**Index / SEO** : tu pourras ajouter `seoTitle`, `seoDescription` plus tard.

### 4.3 Single Type **Home** (optionnel mais utile)

Pour sortir du dur le hero et les textes marketing :

| Champ | Type |
|-------|------|
| `heroTitle` | Rich text ou Text |
| `heroSubtitle` | Text (long) |
| `heroImage` | Media (single) |
| `promoTitle`, `promoBody` | Text |

Une route front `/` charge ce single type en plus des produits mis en avant.

### 4.4 Wishlist (après auth Strapi)

Quand tu remplaces le mock `authStore` par Strapi :

**Option A — Collection `wishlist-item`**

| Champ | Type |
|-------|------|
| `user` | Relation many-to-one → User (plugin users-permissions) |
| `product` | Relation many-to-one → Product |

Contrainte métier : index unique `(user, product)` — à gérer via logique API custom ou validation côté Strapi (lifecycle).

**Permissions** : `create`, `delete`, `find` (filtrées par utilisateur connecté) pour le rôle **Authenticated** uniquement — pas en Public.

### 4.5 Profil client

Le modèle User par défaut a `username`, `email`. Tu peux étendre avec **plugin** ou collection **Customer Profile** liée à `User` (`phone`, `firstName`, `lastName`) selon les bonnes pratiques Strapi pour ta version.

---

## 5. Données initiales (seed)

1. Crée les **Category** dans l’admin (mêmes slugs que le front actuel : `the-noir`, `the-blanc`, `infusion`, `the-vert`, `bien-etre`).
2. Upload les images dans **Media Library** (ou réutilise tes PNG actuels).
3. Crée les **Product** et associe la catégorie + `slug` unique (`digestion`, `detox`, `sommeil`, `energie`, …).
4. Vérifie que chaque entrée est **Published**.

Pour automatiser plus tard : script `bootstrap` Strapi ou import CSV selon la doc.

---

## 6. CORS

Strapi doit accepter l’origine du frontend.

**Exemple** (`nyra-cms/config/middlewares.ts` — adapte au gabarit généré par ton CLI) :

```ts
export default [
  'strapi::logger',
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:', 'http://localhost:5173'],
          'img-src': ["'self'", 'data:', 'blob:', 'http://localhost:1337'],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  {
    name: 'strapi::cors',
    config: {
      origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    },
  },
  // ...
];
```

Ajoute ton domaine de production dans `origin`.

---

## 7. Permissions (Users & Permissions)

### Rôle **Public**

| Type | Autorisé |
|------|----------|
| `category` | `find`, `findOne` |
| `product` | `find`, `findOne` |
| `home` (single) | `find` |

Ne pas exposer `create` / `update` / `delete` en Public pour ces types.

### Rôle **Authenticated** (après login JWT)

| Type | Autorisé (exemple) |
|------|---------------------|
| `wishlist-item` | `find` (si scope utilisateur), `create`, `delete` |
| `users-permissions` `user` | `me`, `update` selon ta politique |

Tu affineras avec des **policies** Strapi pour que chaque utilisateur ne voie que **sa** wishlist.

---

## 8. API REST — exemples utiles

Les URLs exactes dépendent des **pluriels API** configurés pour tes types (`products`, `categories`, etc.).

### Liste produits + catégorie + image

```http
GET /api/products?populate[category]=true&populate[image]=true&publicationState=live
```

### Filtre par slug de catégorie (boutique)

```http
GET /api/products?filters[category][slug][$eq]=infusion&populate[image]=true
```

### Un produit par slug

```http
GET /api/products?filters[slug][$eq]=digestion&populate[category]=true&populate[image]=true
```

### Categories avec image

```http
GET /api/categories?populate[image]=true&sort=sortOrder:asc
```

**Images** : l’URL finale est en général  

`const url = `${STRAPI_URL}${image.attributes?.url ?? image.url}``  

(selon format v4 / v5 — inspecte la réponse une fois dans le navigateur ou Postman).

---

## 9. Authentification (remplacer le mock frontend)

Endpoints classiques Users & Permissions :

- `POST /api/auth/local/register` — création compte (si activé)
- `POST /api/auth/local` — `{ "identifier": "email", "password": "…" }`
- `GET /api/users/me` — avec header `Authorization: Bearer <jwt>`

**Frontend** :

1. Stocker le **JWT** (sessionStorage ou mémoire ; cookies HTTP-only si tu ajoutes une petite couche BFF plus tard).
2. Remplacer `useAuthStore` actuel par des appels Strapi + conservation du token.
3. Rediriger `/login` / `/register` vers ces endpoints.

---

## 10. Variables d’environnement — frontend

À la racine de **nyra-frontend** :

**.env.example** (versionnée, sans secrets) :

```env
VITE_STRAPI_URL=http://localhost:1337
```

**.env** (local, ignorée par Git) :

```env
VITE_STRAPI_URL=http://localhost:1337
```

Usage :

```ts
const STRAPI = import.meta.env.VITE_STRAPI_URL;
fetch(`${STRAPI}/api/products?populate[image]=true`);
```

---

## 11. Plan d’intégration dans le code React (par étapes)

### Étape A — Socle technique

1. Ajouter **`src/lib/strapi/client.ts`** : `getStrapiUrl()`, `fetchStrapi(path, options)`.
2. Ajouter **`src/lib/strapi/mappers.ts`** : `mapProduct(dto)` → même forme que l’objet attendu par `Shop` / `Product` (avec `image: string` = URL absolue).
3. Typage **`ProductViewModel`** aligné sur `data.ts` pour limiter les changements UI.

### Étape B — Produits & catégories (catalogue)

1. Hook **`useProducts(params)`** — query + `populate`, filtres `category.slug`, recherche :
   - soit filtres Strapi `filters[name][$containsi]=…`,
   - soit chargement liste + filtre client (comme aujourd’hui) pour démarrer vite.
2. Remplacer les imports directs de **`products`** / **`categories`** dans `Home`, `Shop`, `Product`, `Cart`, `Wishlist` par les données du hook ou un **React Query** `useQuery`.
3. Adapter **`routes`** : préférer **`/product/:slug`** pour coller au `slug` Strapi (migration douce : accepter anciens ids dans une redirection).

### Étape C — Auth Strapi

1. Nouveau **`authApi.ts`** (login, register, me).
2. Adapter **`Login`** / **`Register`** / **`Account`** pour les endpoints Strapi.
3. Supprimer la persistance locale des « faux » comptes ou la garder uniquement en fallback dev.

### Étape D — Wishlist serveur

1. CRUD sur **`wishlist-item`** avec JWT.
2. Remplacer **`wishlistStore`** persist par synchronisation API (+ cache local optionnel pour UX offline).

### Étape E — Hero / contenus éditoriaux

1. Charger **Single Type `home`** sur la page d’accueil.
2. Retirer progressivement les assets statiques `figma:asset` remplaçables par des médias Strapi.

---

## 12. Checklist « backend prêt »

**Strapi**

- [ ] Projet `nyra-cms` créé, admin accessible.
- [ ] PostgreSQL en prod (ou SQLite seulement pour proto).
- [ ] Types **Category**, **Product** créés et peuplés.
- [ ] Médias uploadés ; URLs accessibles depuis le navigateur.
- [ ] Draft & Publish compris pour la prod.
- [ ] Rôle **Public** : lecture catalogue uniquement.
- [ ] **CORS** : origins front dev + prod.

**Frontend**

- [ ] `.env` avec `VITE_STRAPI_URL`.
- [ ] Mapper API → modèle UI ; liste et fiche produit fonctionnelles.
- [ ] Filtre catégorie (`slug`) branché sur l’API ou query cohérente.
- [ ] Auth JWT + pages compte branchées (quand tu es prêt).
- [ ] Wishlist serveur (après auth).

---

## 13. Déploiement Strapi (rappel)

- Héberger **Strapi** et **PostgreSQL** sur un service qui permet persistance disque ou **S3** pour les uploads.
- Définir `APP_KEYS`, `JWT_SECRET`, `ADMIN_JWT_SECRET`, etc. une fois et les sauvegarder hors Git.
- Mettre à jour **CORS** et **`VITE_STRAPI_URL`** en production avec l’URL HTTPS publique du CMS.

---

En suivant ce fichier dans l’ordre (**modèle → données → permissions → CORS → hooks React**), tu construis un **vrai backend** Strapi et tu peux **commencer tout de suite** par l’étape **B** (produits / catégories) pendant que tu prépares auth et wishlist en parallèle.
