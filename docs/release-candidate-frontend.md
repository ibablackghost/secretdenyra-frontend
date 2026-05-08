# Release Candidate Frontend — Stabilisation

## Portée stabilisation

- corrections bugs critiques parcours achat
- réduction dette UI (états standardisés, cohérence interactions)
- nettoyage composants clés (catalogue, panier, checkout, tracking)
- validation finale avec contrats backend consolidés

---

## Correctifs appliqués (session en cours)

1. **Tracking conversion centralisé**
   - module unique analytics GA4/PostHog (`tracking.ts`)
   - events normalisés: `view_item`, `add_to_cart`, `begin_checkout`

2. **Funnel + pertes de conversion**
   - ajout `cart_abandoned`, `checkout_step_view`, `checkout_step_complete`, `checkout_payment_failed`
   - ajout `remove_from_cart` pour lecture fine des sorties panier

3. **Dédoublonnage events**
   - anti-doublon TTL par fingerprint
   - robustesse renforcée en mode stockage restreint (pas de crash si `sessionStorage` indisponible)

4. **UX checkout/panier**
   - instrumentation cohérente lors transitions panier -> checkout
   - suivi étape par étape checkout pour diagnostiquer les frictions

---

## Vérifications techniques

- Build production: `npm run build` ✅
- Lints sur fichiers modifiés: ✅
- Tracking non bloquant pour UX en cas d’indisponibilité analytics: ✅

---

## Risques résiduels (à suivre)

- Pas encore d’event serveur `purchase` (source de vérité finale)
- `checkout_session_id` pas encore injecté dans tous les events frontend
- validation business des KPI funnel à faire sur données réelles (7-14 jours)

---

## Contrats backend de référence

- document final: `docs/backend-contracts-finaux.md`
- compléments analytics: `docs/jour-11-alignment-frontend-backend.md`, `docs/jour-12-alignment-frontend-backend.md`

---

## Statut RC Frontend

**READY FOR RC** sous réserve des points backend suivants:

- `checkout_session_id` disponible à l’init checkout
- erreurs checkout structurées (`code`, `message`, `details`)
- validation réconciliation analytics vs commandes confirmées
