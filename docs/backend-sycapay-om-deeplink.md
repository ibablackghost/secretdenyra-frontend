# Backend — Orange Money : renvoyer le lien (pas seulement le QR)

**Problème constaté en prod (juil. 2026)**

`POST /api/checkout/:id/payment/sycapay` avec `codeService: "SN_PM_OM"` renvoie :

```json
{
  "redirectUrl": null,
  "deeplink": null,
  "qrCode": "<base64…>",
  "otpRequired": false
}
```

→ le front **ne peut pas rediriger** ; il n’a que le QR.

Sycapay renvoie pourtant (réponse brute) :

```json
{
  "errorCode": "201",
  "errorMessage": "Paiement en cours. Merci de rediriger le client vers le lien de paiement",
  "deepLinks": {
    "MAXIT": "https://sugu.orange-sonatel.com/mp/…",
    "OM": "https://orange-money-prod-flowlinks.web.app/om/…"
  },
  "qrCode": "…"
}
```

## Correctif backend attendu

Lors du mapping de la réponse Sycapay → réponse Nyra :

```ts
const omUrl =
  sycapay.deepLinks?.OM ??
  sycapay.deepLinks?.MAXIT ??
  null;

return {
  paymentId,
  idPartenaire,
  tokenTX,
  status: 'PENDING',
  codeService: 'SN_PM_OM',
  // IMPORTANT : ne pas laisser null si deepLinks.OM existe
  redirectUrl: omUrl,
  deeplink: omUrl,
  deepLinks: sycapay.deepLinks ?? null, // idéal aussi
  qrCode: sycapay.qrCode ?? null,       // optionnel / secours
  otpRequired: false,
};
```

## Test

1. `init` checkout
2. `POST .../payment/sycapay` `{ "codeService": "SN_PM_OM", "numeroBeneficiaire": "77…" }`
3. Attendu : `redirectUrl` (ou `deeplink`) = URL `https://orange-money-prod-flowlinks.web.app/...`
4. Front : `window.location.href = redirectUrl` (plus d’écran QR)

## Note front

Le front lit déjà `redirectUrl`, `deeplink`, `deepLinks.OM` / `MAXIT`.  
Sans ces champs remplis par le backend, **impossible** de rediriger.
