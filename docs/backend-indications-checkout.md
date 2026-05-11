# Indications backend — Checkout (`init` + `confirm`)

Ce document sert à implémenter les routes manquantes qui provoquent un **404** lorsque l’utilisateur est **connecté** : le frontend appelle alors le tunnel checkout sur la même base URL que Strapi (`VITE_STRAPI_URL`).

---

## 1) Contexte

- **Invité** : le frontend peut finaliser une commande **sans** appeler ces APIs (stockage local).
- **Utilisateur connecté** : le frontend appelle obligatoirement **`POST /api/checkout/init`** puis **`POST /api/checkout/:id/confirm`** avec le **JWT** utilisateur.

Sans ces routes côté serveur, la prod renvoie **404** sur Railway.

---

## 2) URLs exactes attendues par le frontend

Préfixe : `{ORIGINE_BACKEND}` = valeur de `VITE_STRAPI_URL` (sans slash final), ex. `https://secretdenyra-backend-production.up.railway.app`.

| Méthode | Chemin | Rôle |
|--------|--------|------|
| `POST` | `/api/checkout/init` | Créer une session checkout + verrous prix/stock (ou équivalent). |
| `POST` | `/api/checkout/:checkoutId/confirm` | Finaliser après « paiement » (ou simulation) et **créer la commande** en base. |

Le frontend lit l’identifiant de session depuis la réponse de `init` (voir §4).

---

## 3) Authentification

- Header obligatoire pour les deux appels :  
  `Authorization: Bearer <jwt>`  
  (même JWT que `/api/auth/local` et `/api/me`.)

- Le backend doit associer la session checkout à **`users-permissions` user id** du JWT (pas à un autre compte).

---

## 4) Corps JSON — `POST /api/checkout/init`

Le frontend envoie exactement la structure suivante (voir types `CheckoutInitInput` dans `src/app/services/api/commerceApi.ts`) :

```json
{
  "customer": {
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "phone": "string"
  },
  "shippingAddress": {
    "line1": "string",
    "line2": "string",
    "city": "string",
    "region": "string",
    "postalCode": "string",
    "country": "string"
  },
  "billingAddress": { "line1": "", "line2": "", "city": "", "region": "", "postalCode": "", "country": "" },
  "billingSameAsShipping": true,
  "items": [
    { "productId": "string", "quantity": 1 }
  ]
}
```

**Règles métier recommandées**

- Recalculer **prix** et **frais de port** côté serveur (source de vérité).
- Vérifier **stock** pour chaque ligne ; refuser avec erreur structurée si rupture.
- Optionnel : aligner `items` avec le **panier serveur** (`GET /api/cart`) pour éviter les écarts.

---

## 5) Réponse JSON — `POST /api/checkout/init` (minimum pour que le front avance)

Le frontend accepte **au moins une** de ces clés pour l’identifiant de session :

- `checkout_session_id` **ou**
- `checkoutId`

Au moins l’une des deux doit être une **string non vide** ; cette valeur sera utilisée dans l’URL de `confirm` :  
`/api/checkout/<cette_valeur>/confirm`

Exemple minimal :

```json
{
  "checkout_session_id": "cs_xxx_or_internal_uuid",
  "subtotal": 0,
  "shippingFee": 0,
  "total": 0,
  "currency": "XOF"
}
```

---

## 6) Corps JSON — `POST /api/checkout/:checkoutId/confirm`

Le frontend envoie :

```json
{
  "paymentMethod": "card | mobile-money | cash-on-delivery",
  "paymentIntentId": "optionnel_si_stripe_plus_tard"
}
```

**Comportement attendu**

- Créer une **commande** liée à l’utilisateur (statut approprié : payé / en attente selon la méthode).
- Vider ou synchroniser le **panier** serveur si vous en avez un.
- Retourner un identifiant de commande exploitable par le front.

Réponse minimale acceptée par le frontend :

```json
{
  "order": { "id": "ORDER_ID_OR_DOCUMENT_ID" },
  "orderId": "ORDER_ID_OR_DOCUMENT_ID"
}
```

(Le front affiche `order.id`, sinon `orderId`, sinon l’id de session.)

---

## 7) Erreurs HTTP et format recommandé

| Code | Cas |
|------|-----|
| `400` | Validation (adresse, quantités, etc.) |
| `401` | JWT manquant ou invalide |
| `404` | Session checkout inconnue ou expirée |
| `409` | Stock insuffisant, prix modifié, conflit panier |
| `422` | Données métier refusées |

Corps d’erreur conseillé (pour debug et UX future) :

```json
{
  "error": {
    "code": "OUT_OF_STOCK | PRICE_MISMATCH | INVALID_ADDRESS | ...",
    "message": "Texte lisible",
    "details": {}
  }
}
```

---

## 8) Implémentation Strapi (pistes)

- **Route custom** (policy `isAuthenticated`) sous `/api/checkout/...` qui :
  - lit le JWT,
  - crée un enregistrement « CheckoutSession » ou réutilise Order en état `draft`,
  - à `confirm`, crée `Order` + `OrderItem`, met à jour stock.

- **CORS** : autoriser l’origine du frontend Vercel + méthodes `POST`, `OPTIONS`, headers `Authorization`, `Content-Type`.

---

## 9) Checklist rapide avant de dire « c’est bon »

- [ ] `POST /api/checkout/init` répond **200** avec `checkout_session_id` ou `checkoutId`.
- [ ] `POST /api/checkout/<id>/confirm` répond **200** avec `order.id` ou `orderId`.
- [ ] Un utilisateur A ne voit jamais les sessions/commandes de B.
- [ ] Après confirmation, `GET /api/me/orders` (ou équivalent) renvoie la nouvelle commande.

Pour le détail aligné avec le reste du projet, voir aussi `docs/backend-contracts-finaux.md` (section checkout).
