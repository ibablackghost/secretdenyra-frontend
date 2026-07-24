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
