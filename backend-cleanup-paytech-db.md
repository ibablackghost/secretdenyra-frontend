# Backend / DB — Cleanup PayTech + images média

À faire **côté backend / Railway / Strapi**. Le front ne peut pas vider la base ni réparer les fichiers uploads perdus.

## 1. Purger les paiements PayTech en attente

Les vieux `PENDING` PayTech polluent encore `GET /api/me/payments/pending` (et le compte client) tant qu’ils sont en DB.

### Script (repo backend)

```bash
node scripts/cleanup-pending-payments.mjs
```

Objectif :

- supprimer / archiver les paiements `provider: paytech` (et éventuellement `intech`)
- ne garder que les `PENDING` **Sycapay** réellement reprisables
- après run : `GET /api/me/payments/pending` → `{ items: [], count: 0 }` pour les comptes de test

### Vérif SQL / admin (si pas de script)

Filtrer les paiements où :

- `provider` ∈ `paytech`, `intech`, ou vide legacy
- `status` = `PENDING`

Les supprimer ou les marquer `CANCELED` / `FAILLED` selon la politique métier.

## 2. Filtrer l’API pending

`GET /api/me/payments/pending` ne doit renvoyer **que** :

```json
{
  "items": [ /* provider === "sycapay" && status === "PENDING" */ ],
  "count": 0
}
```

Ne plus exposer de `redirectUrl` PayTech ni de libellés PayTech.

## 3. Images produits achetés (`GET /api/me/purchased-products`)

Le front affiche `product.image.url` (ou string) via `resolveMediaUrl` + `VITE_STRAPI_URL`.

Si l’UI montre encore « Image indisponible » :

### A. Variable Railway obligatoire

```env
PUBLIC_URL=https://secretdenyra-backend-production.up.railway.app
```

Sans ça, Strapi peut renvoyer `/uploads/...` relatif → le navigateur tape le mauvais host (ex. front) → 404.

### B. Médias persistants

Sur Railway, le disque local est **éphémère**. Si les fichiers `/uploads` ont disparu au redeploy :

1. Monter un volume / S3 / Cloudinary pour les médias
2. **Ré-uploader** les images produit dans Strapi admin (ex. Detox Tisane)

### C. Forme de réponse attendue

```json
{
  "product": {
    "name": "Detox Tisane",
    "image": {
      "url": "https://secretdenyra-backend-production.up.railway.app/uploads/....jpg",
      "alternativeText": "Detox Tisane"
    }
  }
}
```

`publicMedia` / helper backend doit **absolutiser** les URLs avec `PUBLIC_URL`.

## 4. Sycapay OM — deeplink (rappel)

Voir aussi [`docs/backend-sycapay-om-deeplink.md`](./docs/backend-sycapay-om-deeplink.md).

Pour Orange Money, mapper `deepLinks.OM` (réponse Sycapay brute) vers `redirectUrl` / `deeplink` dans la réponse Nyra. Sinon le front ne peut pas ouvrir l’app OM.

## 5. Checklist déploiement backend

- [ ] `PUBLIC_URL` set sur Railway
- [ ] Script cleanup pending PayTech exécuté en prod
- [ ] `pending` API = Sycapay only
- [ ] Images produits ré-uploadées ou volume média branché
- [ ] `purchased-products` renvoie des URLs absolues valides
- [ ] OM : `deepLinks.OM` forwardé
- [ ] Redéploy backend → tester compte client (bandeau pending + images)

## 6. Côté front (déjà traité / à déployer)

Voir [`frontend-cleanup-paytech-images.md`](./frontend-cleanup-paytech-images.md) :

- plus d’UI / init PayTech
- cache local pending migré (v2) → purge PayTech
- bandeau masqué si `count === 0`
- `MediaImage` + `resolveMediaUrl`
- compte = dashboard sidebar
