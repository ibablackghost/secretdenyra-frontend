# Prompt d'implementation e-commerce (en tenant compte de l'existant)

Copie/colle ce prompt dans ton agent IA pour obtenir un plan actionnable sans oublier ce qui existe deja.

---

## Prompt

```md
Tu es un lead tech e-commerce (Next.js/React + Strapi).

Contexte projet:
- Projet: Nyra frontend.
- Certaines fonctionnalites existent deja et doivent etre conservees.
- Tu dois IMPERATIVEMENT commencer par un audit de l'existant avant de proposer des devs.

Existant connu (a valider dans le code avant toute proposition):
- Pages/routes presentes: `/`, `/shop`, `/product/:slug`, `/cart`, `/login`, `/register`, `/wishlist`, `/account`.
- Auth protegee sur compte utilisateur.
- Store panier (Zustand) deja en place.
- Wishlist deja presente.
- Base de catalogue deja visible (liste + fiche produit).
- Stack actuelle front: React + React Router + Tailwind + TypeScript.
- Objectif cible global: e-commerce complet connecte a Strapi + paiement + SEO + perf + securite.

Ta mission:
1) Lire la codebase et produire un **audit factuel** (pas d'hypothese).
2) Pour chaque domaine ci-dessous, faire:
   - **Deja en place**
   - **Partiel**
   - **Manquant**
   - **Risque de regression**
   - **Actions concretes**
3) Donner un plan d'implementation **point par point** avec priorites P0/P1/P2.
4) Ne jamais proposer de redev ce qui existe deja sans justification.

Domaines a traiter point par point:
1. Pages essentielles (home, catalogue, produit, categories SEO, wishlist, panier, checkout)
2. Compte utilisateur (dashboard, commandes, adresses, retours/remboursements)
3. Paiement (Stripe/PayPal, webhooks, echecs, remboursements)
4. Gestion commandes (Order/OrderItem, snapshot prix, statuts)
5. Stock (quantite, variantes, rupture, reservation temporaire)
6. SEO (meta, sitemap, OG, URLs propres, canonical)
7. Performance (lazy load, pagination backend, cache API, images, responsive)
8. Securite (validation backend, permissions Strapi, JWT, rate limiting)
9. Admin/Backoffice (commandes, stock, coupons, analytics ventes)
10. Fonctionnalites avancees (reviews, recommandations, multi-langue/devise)
11. Collections Strapi (Product, Category, Tag, Variant, Review, Order, OrderItem, Coupon, Address, Wishlist, User)
12. Architecture frontend (/pages, /components, /features, /services, /hooks, /store, /utils)
13. UX (skeleton, toasts, empty states, mobile-first, accessibilite)
14. Analytics (GA4, PostHog, conversion, abandon panier)

Format de sortie obligatoire:

## 1) Audit de l'existant (preuve par fichiers)
- Liste des fonctionnalites detectees avec references de fichiers/composants.
- Liste des ecarts majeurs entre existant et cible.

## 2) Matrice gap analysis (point par point)
Pour chaque domaine:
- Statut: [En place | Partiel | Manquant]
- Existant reutilisable
- Ce qu'il manque exactement
- Priorite: [P0 | P1 | P2]
- Effort estime: [S | M | L]
- Risque principal

## 3) Plan d'implementation concret (ordre recommande)
Pour chaque item:
- Objectif
- Taches backend (Strapi/API/DB)
- Taches frontend (pages/components/store/services)
- Criteres d'acceptation testables
- Risques + mitigation
- Dependances

## 4) Backlog tickets pret a executer
Generer une liste de tickets numerotes:
- Titre
- Description
- Definition of Done
- Priorite
- Estimation

## 5) Plan de livraison
- Sprint 1 (P0 critique)
- Sprint 2 (P1)
- Sprint 3 (P2/optimisations)

Contraintes:
- Prendre en compte l'existant avant toute refonte.
- Eviter toute regression UX/fonctionnelle.
- Proposer des increments livrables rapidement.
- Si une info manque, poser les questions a la fin dans une section "Questions bloquees".
```

---

## Utilisation recommandee

- Etape 1: lancer ce prompt pour obtenir la vision complete.
- Etape 2: demander "execute seulement les tickets P0 du Sprint 1".
- Etape 3: valider avec tests/recette avant de passer a P1.
