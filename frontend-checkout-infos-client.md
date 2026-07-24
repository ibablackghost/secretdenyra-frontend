# Nyra — Front : formulaire paiement (infos client)

Document pour l’équipe **frontend**.  
Formulaire affiché **au moment du paiement / checkout**, avant Sycapay.

Paiement Sycapay : [`frontend-checkout-sycapay.md`](./frontend-checkout-sycapay.md).

**Backend :** `POST /api/checkout/init`

---

## Formulaire — 4 champs seulement

| Champ UI | Obligatoire | API |
|----------|-------------|-----|
| Nom complet | Oui | `customer.fullName` |
| Téléphone | Oui | `customer.phone` |
| Adresse | Oui | `shippingAddress.address` |
| Email | **Non** | `customer.email` (optionnel) |

**À ne PAS afficher / envoyer :** code postal, ville, pays, line2, prénom/nom séparés, adresse de facturation séparée, etc.

### Téléphone — indicatif

| Pays | Indicatif | Exemple saisie UI | Valeur envoyée à l’API |
|------|-----------|-------------------|-------------------------|
| **Sénégal** | **+221** | `77 123 45 67` | `771234567` (chiffres seuls, **sans** `+221`) |

Règles :
- Afficher l’indicatif **+221** (fixe / préfixe UI)
- Envoyer uniquement le **numéro national** : 9 chiffres typiques (`77…`, `78…`, `76…`, `70…`)
- Ne pas envoyer `+221771234567` sauf si le backend le normalise déjà (il strippe le non-numérique, donc `+22177…` devient `22177…` → **à éviter**)
- Même numéro réutilisé pour Sycapay (`numeroBeneficiaire`)

---

## Body à envoyer

```json
{
  "customer": {
    "fullName": "Amadou Diallo",
    "phone": "771234567",
    "email": "amadou@example.com"
  },
  "shippingAddress": {
    "address": "Sacré-Cœur 3, villa 12, Dakar"
  },
  "billingSameAsShipping": true,
  "items": [
    {
      "productDocumentId": "…",
      "variantDocumentId": "…",
      "quantity": 1
    }
  ]
}
```

Sans email :

```json
{
  "customer": {
    "fullName": "Fatou Ndiaye",
    "phone": "778889999"
  },
  "shippingAddress": {
    "address": "Plateau, rue 12"
  },
  "billingSameAsShipping": true,
  "items": [{ "productDocumentId": "…", "quantity": 1 }]
}
```

`shippingAddress` peut aussi être une **string** :

```json
"shippingAddress": "Plateau, rue 12"
```

---

## Règles backend

- Nom + téléphone + adresse → obligatoires
- Email vide / absent → OK
- Email rempli mais invalide → `400 INVALID_CUSTOMER_INFO`
- Adresse vide → `400 INVALID_SHIPPING_ADDRESS`
- Pas de `postalCode`, `city`, `country` requis

Stockage normalisé :

```json
{
  "customer": {
    "fullName": "Amadou Diallo",
    "firstName": "Amadou",
    "lastName": "Diallo",
    "phone": "771234567",
    "email": null
  },
  "shippingAddress": {
    "address": "Sacré-Cœur 3, villa 12, Dakar"
  }
}
```

---

## Après `init` OK

1. Stocker `checkoutId` + `guestToken` (`sessionStorage`)
2. Enchaîner sur le paiement Sycapay → [`frontend-checkout-sycapay.md`](./frontend-checkout-sycapay.md)

---

## Checklist front

- [ ] Un seul formulaire : nom complet, téléphone, adresse, email (facultatif)
- [ ] Aucun champ code postal / ville / pays
- [ ] Label email = facultatif
- [ ] Puis choix opérateur Sycapay
