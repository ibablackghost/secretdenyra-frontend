# Plan quotidien - Frontend (React/Next)

Objectif: livrer un frontend e-commerce propre, testable, sans regression, en tenant compte de l'existant.

## Semaine 1 - Fondations UX + donnees

### Jour 1
- Audit des pages existantes (`/`, `/shop`, `/product/:slug`, `/cart`, `/wishlist`, `/account`).
- Mapper les composants reutilisables (layout, cards, boutons, formulaires).
- Definir les contrats de donnees front (Product, Category, CartItem, UserSummary).
- Sortie attendue: checklist "existant vs manquant" + plan de refactor minimal.

### Jour 2
- Structurer les dossiers cibles: `/features`, `/services`, `/hooks`, `/store`, `/utils`.
- Mettre en place une couche `services/api` centralisee (client HTTP + gestion erreurs).
- Ajouter gestion globale des etats: loading/error/empty standardises.
- Sortie attendue: architecture stable + conventions de nommage.

### Jour 3
- Catalogue: brancher recherche + filtres + tri sur URL query params.
- Ajouter pagination UI compatible pagination backend.
- Uniformiser les cartes produit (image, prix, badge promo, stock).
- Sortie attendue: page shop robuste, URL partageable.

### Jour 4
- Page produit: galerie, variantes (taille/couleur), quantite, etat stock.
- Ajouter bloc produits similaires.
- Ajouter skeletons de chargement et fallbacks media.
- Sortie attendue: fiche produit complete cote UX.

### Jour 5
- Panier: quantite, suppression, recalcul total, frais livraison estimatifs.
- Wishlist: synchro etat UI + CTA add/remove coherent.
- Toast notifications sur actions critiques.
- Sortie attendue: tunnel panier/wishlist fluide.

## Semaine 2 - Checkout + compte + qualite

### Jour 6
- Checkout etape 1: informations client + validation formulaire.
- Checkout etape 2: adresse livraison/facturation.
- Persistance locale temporaire du checkout.
- Sortie attendue: parcours multi-etapes stable.

### Jour 7
- Checkout etape 3: recap commande + methode paiement (pre-integration Stripe UI).
- Etats d'erreur visibles (paiement refuse, timeout, infos incompletes).
- Sortie attendue: UX prete pour integration paiement backend.

### Jour 8
- Compte utilisateur: dashboard (resume commandes, adresses).
- Historique commandes: liste + detail.
- Gestion adresses: CRUD UI avec validations.
- Sortie attendue: espace compte exploitable.

### Jour 9
- SEO front: meta title/description dynamiques, OG tags, canonical.
- URLs propres categories/produits.
- Preparer hooks pour sitemap/robots (si Next, metadata routes).
- Sortie attendue: base SEO operationnelle.

### Jour 10
- Performance: lazy loading images, splitting composants lourds, optimisation re-renders.
- Accessibilite: labels, focus states, navigation clavier, contrastes.
- Revue responsive mobile-first complete.
- Sortie attendue: qualite UX/perf pre-prod.

## Semaine 3 - Instrumentation + finition

### Jour 11
- Analytics front: events GA4/PostHog (view product, add cart, begin checkout).
- Normaliser le tracking via un module unique.
- Sortie attendue: tracking coherent des conversions.

### Jour 12
- Event abandon panier + entonnoir checkout.
- Verifier dedoublonnage des events.
- Sortie attendue: visibilite business sur pertes de conversion.

### Jour 13
- Recommandations produits (bloc "tu pourrais aimer").
- Etats vides premium (wishlist vide, panier vide, historique vide).
- Sortie attendue: UX plus engageante.

### Jour 14
- Stabilisation: corrections bugs, dette UI, nettoyage composants.
- Revue complete avec backend contracts finaux.
- Sortie attendue: release candidate frontend.

## Definition of Done (Frontend)
- Aucun blocant sur parcours: home -> catalogue -> produit -> panier -> checkout.
- Etats loading/error/empty couverts sur pages critiques.
- Lighthouse mobile acceptable (Perf/SEO/Best Practices).
- Accessibilite de base validee.
- Analytics clefs emis correctement.
