# Nyra — frontend (Secret de Nyra)

Boutique e-commerce (Vite + React + React Router + Tailwind v4), à partir du bundle design.

## Structure

- `src/app/App.tsx` — point d’entrée de l’application (routeur).
- `src/app/routes.tsx` — routes : `/`, `/shop`, `/product/:id`, `/cart`.
- `src/app/pages/` — pages : accueil, boutique, fiche produit, panier.
- `src/app/data.ts` — produits et catégories (données locales ; à brancher sur Strapi plus tard).
- `src/app/store/cartStore.ts` — état panier (Zustand).
- `src/app/components/layout/` — en-tête, pied de page, layout commun.
- `src/assets/` — images référencées via les imports `figma:asset/...` (plugin Vite dans `vite.config.ts`).
- `src/imports/` — visuel hero et autres exports du design.

## Commandes

```bash
npm install
npm run dev
npm run build
```

## Si `npm install` tourne sans fin ou affiche `SELF_SIGNED_CERT_IN_CHAIN`

Souvent un **proxy ou un antivirus** inspecte le HTTPS et présente un certificat « maison » que Node refuse.

Le fichier **`.npmrc`** du projet contient `strict-ssl=false` pour contourner ça en développement. En entreprise, la solution propre est d’ajouter la **CA racine** au système ou via :

`npm config set cafile "C:\\chemin\\vers\\corp-ca.pem"`

puis de retirer `strict-ssl=false`.

---

Référence design : [Figma — Reproduce design and user flow](https://www.figma.com/design/URRWXxOX7PVHmAPn6gv4Pq/Reproduce-design-and-user-flow).
