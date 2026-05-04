# Implémentation Strapi — Nyra (frontend)

Ce document décrit comment mettre en place **Strapi** en backend headless pour alimenter le frontend **Nyra**, et comment brancher React dessus.

## Architecture cible

```
┌─────────────────┐     HTTPS (REST ou GraphQL)     ┌─────────────────┐
│  React (Vite)   │ ◄──────────────────────────────► │  Strapi + DB    │
│  nyra-frontend  │                                 │  Admin + API    │
└─────────────────┘                                 └─────────────────┘
```

Strapi reste une **application séparée** (autre dossier, autre déploiement). Le frontend consomme uniquement l’**API publique** (avec jetons si besoin).

## 1. Créer le projet Strapi

```bash
npx create-strapi-app@latest nyra-cms --quickstart
```

Ou avec une base PostgreSQL en production (recommandé) : suivre la doc officielle pour la variable `DATABASE_CLIENT`.

Une fois lancé :

- Admin : `http://localhost:1337/admin`
- API REST : `http://localhost:1337/api/...`

## 2. Modèle de contenu proposé

Adapter au métier réel ; proposition alignée sur le mock actuel (`src/app/data.ts`) :

### Collection Type — **Category**

| Champ | Type | Notes |
|-------|------|--------|
| `slug` | UID (basé sur `name`) | Ex. `the-noir`, `infusion` |
| `name` | Text | Libellé affiché |
| `image` | Media (single) | Image ronde/grille familles |

### Collection Type — **Product**

| Champ | Type | Notes |
|-------|------|--------|
| `slug` | UID | Identifiant URL stable (remplace `id` string actuel si besoin) |
| `name` | Text | Nom commercial |
| `ingredients` | Text (long) ou Rich text | Liste ingrédients |
| `price` | Number (integer) | Prix en **centimes XOF** ou unité minimale pour éviter les flottants |
| `rating` | Decimal | Note affichée |
| `reviews` | Integer | Nombre d’avis |
| `image` | Media (single) | Photo principale |
| `category` | Relation many-to-one → Category | Pour filtres boutique |

Champs optionnels utiles plus tard : `description`, `gallery` (media multiple), `stock`, `sku`, `publishedAt` géré par Strapi.

### Droits (Settings → Users & Permissions → Roles → Public)

Pour un catalogue public lecture seule :

- **Category** : `find`, `findOne` ✓  
- **Product** : `find`, `findOne` ✓  

Pour tout ce qui est commande / compte client : créer un rôle **Authenticated** et des endpoints ou plugins dédiés (ou app métier séparée).

## 3. CORS

Strapi doit autoriser l’origine du frontend.

**Fichier** `config/middlewares.ts` (Strapi 5 / structure selon version) : ajouter ou compléter la configuration `cors` avec :

- Développement : `http://localhost:5173` (Vite par défaut)
- Production : `https://ton-domaine.fr`

Référence : [Documentation Strapi — CORS](https://docs.strapi.io/).

## 4. Populate et format REST

Les relations et médias ne sont pas toujours inclus par défaut.

Exemple (REST v4+) pour une liste produits avec catégorie et image :

```http
GET /api/products?populate[category]=true&populate[image]=true
```

Ajuster selon la doc de ta version Strapi (`populate=*` possible en dev, à affiner en prod).

## 5. Variables d’environnement (frontend)

Créer **`.env`** (et **`.env.example`** sans secrets) à la racine de `nyra-frontend` :

```env
VITE_STRAPI_URL=http://localhost:1337
```

Utilisation dans le code :

```ts
const API = import.meta.env.VITE_STRAPI_URL;
```

En production, définir `VITE_STRAPI_URL` dans l’interface du CI / hébergeur.

## 6. Appels depuis React

Schéma recommandé :

1. **`src/lib/strapi.ts`** — fonction `fetchAPI(path: string)` qui préfixe `VITE_STRAPI_URL`, gère erreurs et éventuellement un token stocké en mémoire.
2. **`src/hooks/useProducts.ts`** (ou équivalent) — `useEffect` + `useState` ou **TanStack Query** pour cache et rechargement.
3. Remplacer progressivement **`data.ts`** :
   - soit en chargeant une fois au montage et en gardant la même forme que les objets actuels ;
   - soit en normalisant les réponses Strapi (`attributes`, `data`) dans une couche **`mapStrapiProduct()`**.

Exemple minimal de réponse Strapi v4 (schéma réel à valider dans ta version) :

```json
{
  "data": [
    {
      "id": 1,
      "attributes": {
        "name": "DIGESTION®",
        "slug": "digestion",
        "price": 24999,
        "ingredients": "…",
        "rating": 4.9,
        "reviews": 43,
        "category": { "data": { … } },
        "image": { "data": { "attributes": { "url": "/uploads/…" } } }
      }
    }
  ]
}
```

Construire l’URL complète de l’image : `${STRAPI_URL}${attributes.url}`.

## 7. Images Strapi vs bundle actuel

Aujourd’hui les images locales passent par **`figma:asset`** et **`src/assets`**. Avec Strapi :

- Les médias sont servis depuis Strapi (`/uploads/...`).
- Tu peux garder les assets locaux pour le hero tant qu’ils ne sont pas dans le CMS, ou créer un **Single Type** « Page d’accueil » avec champ média hero.

## 8. Auth JWT (phase ultérieure)

Si certaines routes nécessitent un utilisateur connecté :

1. Endpoint Strapi `/api/auth/local` (login).
2. Stocker le **JWT** (idéalement mémoire + refresh ou cookie HTTP-only selon architecture).
3. Envoyer `Authorization: Bearer <token>` sur les requêtes protégées.

Pour une boutique simple lecture seule + panier **uniquement local**, cette étape peut attendre.

## 9. Déploiement Strapi

- **Base** : PostgreSQL managée en production.
- **Fichiers** : stockage compatible S3 ou volume persistant selon hébergeur.
- **Variables** : `APP_KEYS`, `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, etc. générées une fois et conservées hors Git.

## 10. Checklist d’intégration frontend

- [ ] Types Strapi créés et données de démo saisies dans l’admin.
- [ ] Rôle **Public** configuré (`find` / `findOne`).
- [ ] CORS mis à jour avec l’URL du front.
- [ ] `.env` avec `VITE_STRAPI_URL`.
- [ ] Couche fetch + mapping Strapi → modèle utilisé par `Shop`, `Product`, `Home`.
- [ ] Tester filtres (`category.slug`) via query string ou filtres API Strapi.

Pour le détail du code React dans ce dépôt, compléter **`src/app/data.ts`** ou le remplacer par des hooks qui lisent Strapi tout en conservant les mêmes props aux composants pour limiter les régressions UI.
