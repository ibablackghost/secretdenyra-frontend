# Documentation — Nyra (frontend Secret de Nyra)

Ce document décrit la stack, l’organisation du code, les commandes utiles et la configuration **npm / réseau** du dépôt `nyra-frontend`.

## Objectif du projet

Application **boutique e-commerce** (vitrine + panier côté client) pour la marque **Secret de Nyra**, basée sur un export design (Figma / bundle) et pensée pour être branchée ultérieurement sur un backend **Strapi** (voir `docs/strapi-integration.md`).

## Stack technique

| Élément | Choix |
|--------|--------|
| Runtime / build | [Vite](https://vitejs.dev/) 6 |
| UI | [React](https://react.dev/) 18 |
| Routage | [React Router](https://reactrouter.com/) 7 |
| État panier | [Zustand](https://zustand-demo.pmnd.rs/) |
| Icônes | [Lucide React](https://lucide.dev/) |
| Styles | [Tailwind CSS](https://tailwindcss.com/) v4 via `@tailwindcss/vite` |
| Langage | TypeScript |

Les dépendances ont été **allégées** par rapport au bundle d’origine : seules les bibliothèques réellement utilisées par les pages sont listées dans `package.json`.

## Structure des dossiers

```
nyra-frontend/
├── docs/                    # Documentation (ce fichier, Strapi, etc.)
├── src/
│   ├── main.tsx             # Monte React sur #root
│   ├── vite-env.d.ts        # Types Vite + module figma:asset
│   ├── app/
│   │   ├── App.tsx
│   │   ├── routes.tsx       # Définition des routes
│   │   ├── data.ts          # Données produits / catégories (mock → remplacer par API)
│   │   ├── pages/           # Home, Shop, Product, Cart
│   │   ├── store/           # cartStore (Zustand)
│   │   └── components/
│   │       └── layout/      # Header, Footer, Layout
│   ├── assets/              # Images résolues par le plugin figma:asset (vite.config.ts)
│   ├── imports/             # Hero et ressources export design
│   └── styles/              # index.css, tailwind.css, theme.css, fonts.css
├── index.html
├── vite.config.ts           # Alias @ → src/, plugin figma:asset → src/assets
├── tsconfig.json
├── package.json
└── .npmrc                   # Registry + TLS (voir section ci-dessous)
```

## Routes

| URL | Composant | Rôle |
|-----|-----------|------|
| `/` | `Home` | Accueil, hero, grilles produits |
| `/shop` | `Shop` | Liste, filtres, `?category=` |
| `/product/:id` | `Product` | Fiche produit ; `data.ts` utilise l’`id` (ex. `digestion`) |
| `/cart` | `Cart` | Panier (état local Zustand + persistance navigateur) |
| `/login` | `Login` | Connexion (données locales, démo) |
| `/register` | `Register` | Inscription |
| `/account` | `Account` | Profil (protégé : redirection vers `/login`) |
| `/wishlist` | `Wishlist` | Favoris (persistance navigateur) |
| `*` | `Home` | Comportement actuel : fallback accueil |

La recherche boutique utilise le paramètre d’URL **`?q=`** (barre sous le header + champ dans la page Shop). Les filtres sont synchronisés avec l’URL.

## Commandes npm

```bash
npm install    # Dépendances
npm run dev    # Serveur de dev (Vite)
npm start      # Équivalent à npm run dev
npm run build  # Build production → dossier dist/
npm run preview # Servir dist/ en local
```

## Images et assets

- Les imports du type `figma:asset/nomdefichier.png` sont mappés vers **`src/assets/`** par un plugin custom dans **`vite.config.ts`**.
- Certaines images proviennent de **`src/imports/`** (ex. hero Gemini).

## Configuration npm et TLS (entreprise)

### Symptômes

- `npm install` reste longtemps sur le **spinner** sans avancer.
- Message d’erreur : **`SELF_SIGNED_CERT_IN_CHAIN`**.

### Cause

Un **proxy**, un **pare-feu** ou un **antivirus** inspecte le HTTPS vers `registry.npmjs.org` et présente un certificat signé par une **autorité interne** non reconnue par Node.js.

### Solution appliquée dans ce projet

Le fichier **`.npmrc`** à la racine contient notamment :

- `strict-ssl=false` — permet à npm d’accepter la chaîne de certificats dans l’environnement actuel (**uniquement pour le développement** ; à réévaluer en production pour la machine de build).

Des paramètres `fetch-retries` / délais augmentent la tolérance aux réseaux lents.

### Solution recommandée en entreprise

1. Récupérer le fichier **PEM de la CA racine** fourni par l’IT.
2. Configurer npm globalement ou par projet :

   ```bash
   npm config set cafile "C:\chemin\vers\corp-root-ca.pem"
   ```

3. Retirer **`strict-ssl=false`** du `.npmrc` du projet une fois la CA prise en compte.

## Build et déploiement

- **`npm run build`** génère des assets statiques dans **`dist/`**.
- Hébergement typique : **Vercel**, **Netlify**, **Cloudflare Pages**, ou tout serveur statique ; configurer la **SPA** pour renvoyer `index.html` sur les routes client (fallback).

## Référence design

[Reproduce design and user flow (Figma)](https://www.figma.com/design/URRWXxOX7PVHmAPn6gv4Pq/Reproduce-design-and-user-flow)

## Évolution prévue

Remplacer le contenu statique de **`src/app/data.ts`** par des appels à l’API **Strapi** — voir **`docs/strapi-integration.md`**.
