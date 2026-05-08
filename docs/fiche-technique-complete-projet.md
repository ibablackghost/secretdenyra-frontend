# Fiche technique complete — Projet Nyra Frontend

## 1) Vision produit et perimetre

Nyra est un front e-commerce React/Vite connecte a Strapi, avec un tunnel d'achat multi-etapes, espace compte, SEO dynamique et instrumentation analytics.

Objectif release candidate actuel:

- experience achat fluide (catalogue -> panier -> checkout)
- base SEO/performance/accessibilite pre-prod
- tracking conversion exploitable (GA4/PostHog)
- contrats backend formalises pour verrouiller l'integration

---

## 2) Stack technique actuelle

## Frontend

- React 18
- React Router (routing + lazy loading routes)
- Zustand (state local persiste: panier, wishlist, checkout, etc.)
- Tailwind CSS
- Vite (build/dev)

## Services et architecture

- structure par domaines: `features`, `services`, `hooks`, `store`, `utils`
- client HTTP centralise + gestion erreurs standardisee
- etats asynchrones UI harmonises: loading/error/empty
- module analytics unique (GA4 + PostHog)

## Documentation de reference

- alignements backend journaliers (`docs/jour-*.md`)
- contrats backend finaux (`docs/backend-contracts-finaux.md`)
- statut RC frontend (`docs/release-candidate-frontend.md`)

---

## 3) Fonctionnalites deja en place

## Catalogue et produit

- pages Home/Shop/Product en place
- recherche, filtres, tri, pagination
- URL partageables via query params
- cartes produit uniformisees
- page produit enrichie (galerie, variantes, stock, similaires)

## Panier / Wishlist / Checkout

- panier: quantite, suppression, total, livraison estimative
- wishlist: add/remove coherents + synchro UI
- checkout en 3 etapes:
  - infos client
  - adresses
  - recap + choix paiement (pre-integration)
- erreurs visibles pour cas paiement (declined/timeout/incomplete)

## Compte utilisateur

- dashboard compte
- historique commandes (liste + detail)
- adresses CRUD
- wishlist + produits consultes

## SEO / UX / Qualite

- meta dynamiques, OG, canonical
- hooks sitemap/robots prepares
- focus states + navigation clavier de base
- responsive mobile-first renforce
- lazy loading + code splitting + memo sur composants critiques

## Analytics

- events conversion:
  - `view_item`
  - `add_to_cart`
  - `remove_from_cart`
  - `begin_checkout`
  - `checkout_step_view`
  - `checkout_step_complete`
  - `checkout_payment_failed`
  - `cart_abandoned`
- dedoublonnage frontend par fingerprint + TTL

---

## 4) Etat de maturite (lecture rapide)

- UX achat: **bonne base**
- architecture front: **propre et evolutive**
- tracking: **operationnel, a confirmer en prod**
- securite: **partiellement couverte (renforcement requis)**
- observabilite/tests E2E: **insuffisant pour scale**
- readiness production: **RC ok, hardening necessaire**

---

## 5) Ce qui reste a faire (priorise)

## P0 — Bloquants go-live

1. Brancher vrai paiement backend (Stripe/PSP), fin du mode simulation.
2. Ajouter event serveur `purchase` (webhook paiement) pour source de verite conversion.
3. Integrer `checkout_session_id` dans tous les events funnel.
4. Verrouiller erreurs API standardisees (`code`, `message`, `details`) sur checkout.
5. Mettre en place tests E2E critiques (parcours achat complet).

## P1 — Important court terme

1. Synchroniser panier/wishlist avec backend utilisateur connecte.
2. Finaliser gestion coupons/reductions et coherence montant front/back.
3. Ajouter observabilite technique (Sentry + dashboards erreurs/funnel).
4. Stabiliser strategie cache catalogue (ETag/Cache-Control).
5. Durcir permissions Strapi (roles, policies fines).

## P2 — Evolution produit

1. Avis clients verifies.
2. Recommandations produits.
3. Multi-langue / multi-devise.
4. Emailing transactionnel avance.
5. Backoffice analytics metier (cohortes, retention, LTV).

---

## 6) Propositions securite (detail technique)

## 6.1 Authentification / session

- tokens courts + refresh token rotation
- stockage token privilegie: cookie HttpOnly Secure SameSite=Lax/Strict (si possible)
- invalidation sessions a la deconnexion et rotation apres actions sensibles

## 6.2 API / backend

- validation schema stricte (Zod/Joi) sur toutes les entrees
- rate limiting par IP + par compte sur endpoints sensibles (`auth`, `checkout`, `coupon`)
- anti-rejeu sur paiement (idempotency keys)
- protection brute force login + lockout progressif

## 6.3 Strapi

- RBAC minimal (principe moindre privilege)
- bloquer creation/update non necessaires cote public
- audit des permissions media/upload
- desactiver endpoints admin non utilises en exposition publique

## 6.4 Frontend

- CSP stricte (scripts/images/connect-src maitrises)
- pas de secrets en client (`.env` public uniquement pour clefs non sensibles)
- sanitization stricte de contenu riche venant CMS
- proteger routes compte avec garde + verification token expiration

## 6.5 Paiement

- verification montant exclusivement serveur
- ne jamais faire confiance aux totaux front pour la creation commande
- signature webhook obligatoire + journalisation tentative fraude

## 6.6 Data / conformite

- consent analytics (CMP) avec mode degrade sans tracking marketing
- retention PII definie (duree + purge)
- chiffrement au repos et en transit
- procedure suppression compte / export donnees

---

## 7) Propositions optimisation (detail technique)

## 7.1 Performance frontend

- prefetch intelligent routes critiques (`product`, `checkout`)
- virtualisation si listes volumineuses
- compression images next-gen (WebP/AVIF) + tailles responsives
- `react-query`/cache data (ou equivalent) pour dedup requetes et stale-while-revalidate

## 7.2 Performance backend

- index DB sur colonnes de filtre/tri (`slug`, `category`, `price`, `createdAt`)
- pagination serveur stricte (jamais full scan)
- cache lecture catalogue (Redis ou cache HTTP)
- budget de latence API avec SLO (ex: p95 < 300ms catalogue)

## 7.3 Rendu et UX

- skeletons unifies sur toutes pages critiques
- reduction CLS (dimensions media explicites)
- audits Lighthouse periodiques (Home/Shop/Product/Checkout)

## 7.4 Observabilite

- tracing requetes front->back (`x-request-id` / `checkout_session_id`)
- metrics business:
  - add_to_cart_rate
  - checkout_start_rate
  - step conversion rates
  - payment_failure_rate
  - cart_abandon_rate
- alerting sur anomalies (chute conversion, hausse 5xx, timeout paiement)

---

## 8) Qualite et tests recommandes

## Unitaires (priorite)

- mapping catalogue API -> UI
- stores Zustand critiques (`cart`, `checkout`, `wishlist`)
- utils prix/SEO/search

## Integration

- flux checkout avec erreurs backend mockees
- gestion timeout/retry API
- dedoublonnage events analytics

## E2E (obligatoire pre-prod)

- visite produit -> ajout panier -> checkout -> paiement ok
- paiement refuse / timeout
- utilisateur connecte: compte + adresses + commandes
- test responsive mobile parcours achat

---

## 9) Checklist Go-Live recommandee

- [ ] paiement reel branche et teste en sandbox + preprod
- [ ] event `purchase` serveur actif et verifie
- [ ] monitoring erreurs + funnels actif
- [ ] permissions Strapi auditees
- [ ] sauvegarde DB + plan rollback deployment
- [ ] tests E2E P0 verts
- [ ] revue securite (headers, CSP, rate limit, JWT)
- [ ] revue perf (Lighthouse + p95 API)
- [ ] runbook incident (paiement/API/downstream)

---

## 10) Plan d'execution conseille (2 a 4 semaines)

## Semaine 1

- brancher checkout backend reel + `checkout_session_id`
- normaliser erreurs checkout
- tests E2E P0

## Semaine 2

- webhook `purchase` + reconciliation analytics
- observabilite (Sentry + dashboards KPI)
- durcissement securite Strapi/API

## Semaine 3-4

- optimisation cache/perf fine
- sync panier/wishlist backend
- hardening final + go-live progressif (canary si possible)

---

## Conclusion

Le frontend est sur une base solide de release candidate.
Le principal enjeu restant est l'alignement backend production (paiement reel, source de verite conversion, securite API).
Une fois ces points closes, le projet est pret pour une mise en production controlee avec suivi business fiable.
