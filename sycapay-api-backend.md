# Intégration Sycapay — Spécification backend Nyra

Document pour l’équipe backend / produit.  
Source : `Sycapay-API-Documentation (3).pdf` (mai 2026).  
Remplace progressivement **PayTech / Intech** (`paytech-api-backend.md`).

**Support Sycapay :** contact@sycapay.com  
**Base URL :** `https://ops.sycapay.com/coresystem/part/api`

---

## Table des matières

1. [Contexte Nyra](#1-contexte-nyra)
2. [Architecture cible](#2-architecture-cible)
3. [Authentification (mTLS)](#3-authentification-mtls)
4. [Certificats (CSR)](#4-certificats-csr)
5. [API Sycapay — référence](#5-api-sycapay--référence)
6. [Webhooks](#6-webhooks)
7. [Erreurs](#7-erreurs)
8. [PayTech → Sycapay (écarts)](#8-paytech--sycapay-écarts)
9. [Plan d’étapes Nyra](#9-plan-détapes-nyra)
10. [Variables d’environnement](#10-variables-denvironnement)
11. [Checklist](#11-checklist)

---

## 1. Contexte Nyra

| Avant | Après |
|-------|--------|
| Prestataire **PayTech** (Intech Group) | Prestataire **Sycapay** |
| Auth : `API_KEY` / `API_SECRET` | Auth : **mTLS** (`ca.crt`, `client.crt`, `client.key`) + `loginApi` / `mdpApi` |
| Page PayTech hébergée : le client choisit Wave / OM / carte | **Choix opérateur côté Nyra** via `codeService` (`SN_PM_WAVE`, `SN_PM_OM`, …) |
| Routes Nyra `…/payment/paytech` + IPN PayTech | Routes Nyra `…/payment/sycapay` + webhook Sycapay |

Règles inchangées :

- Le **frontend ne parle jamais** directement à Sycapay.
- Les secrets / certificats restent **uniquement** côté Strapi (Railway / local).
- Le checkout invité (`X-Checkout-Token`) et `confirm` restent le même modèle métier.

---

## 2. Architecture cible

```
[Frontend Nyra]
      │  POST /api/checkout/:id/payment/sycapay
      │  (opérateur + numéro + X-Checkout-Token / JWT)
      ▼
[Backend Strapi Nyra]
      │  mTLS (cert client)
      │  POST …/initiationTransactionV1
      ▼
[Sycapay]
      │  redirectUrl / deeplink / qrCode / OTP selon opérateur
      ▼
[Client paie]
      │
      ├─► redirect url_success / url_failed (front)
      └─► webhook POST → /api/webhooks/sycapay  (backend)
```

Flux front recommandé (proche de PayTech) :

1. `POST /api/checkout/init`
2. Collecte **moyen de paiement** + **numéro** (requis par Sycapay)
3. `POST /api/checkout/:id/payment/sycapay`
4. Redirection / deeplink / QR / OTP selon la réponse
5. Page retour → poll `GET /api/payments/:id/status` → `POST …/confirm`

---

## 3. Authentification (mTLS)

Sycapay utilise l’**authentification mutuelle TLS**. Chaque requête HTTPS doit présenter le certificat client.

1. Obtenir auprès du support : `ca.crt`, `client.crt`, `client.key` (ou générer un CSR puis recevoir `client.crt`).
2. Configurer le client HTTP Node (`https.Agent` + `axios` / `fetch` natif) avec ces fichiers.
3. Sans certificat valide → **401**.

### Exemple cURL

```bash
curl https://ops.sycapay.com/coresystem/part/api/initiationTransactionV1 \
  -X POST \
  --cacert ca.crt --cert client.crt --key client.key \
  -H "Content-Type: application/json" \
  -d '{
    "loginApi": "SYCAPAY_TEST",
    "transaction": {
      "montant": 1000,
      "codeService": "SN_CASHIN_OM",
      "numeroBeneficiaire": "771234567",
      "idPartenaire": "TXN_123456"
    }
  }'
```

### Exemple Node.js

```javascript
import axios from 'axios';
import https from 'https';
import fs from 'fs';

const httpsAgent = new https.Agent({
  ca: fs.readFileSync('ca.crt'),
  cert: fs.readFileSync('client.crt'),
  key: fs.readFileSync('client.key'),
  rejectUnauthorized: true,
});

const response = await axios.post(
  'https://ops.sycapay.com/coresystem/part/api/initiationTransactionV1',
  {
    loginApi: 'SYCAPAY_TEST',
    transaction: {
      montant: 1000,
      codeService: 'SN_CASHIN_OM',
      numeroBeneficiaire: '771234567',
      idPartenaire: 'TXN_123456',
    },
  },
  { httpsAgent, headers: { 'Content-Type': 'application/json' } }
);
```

---

## 4. Certificats (CSR)

La clé privée **ne quitte jamais** l’infra Nyra.

### Génération

```bash
openssl genrsa -out client.key 4096
chmod 600 client.key
```

`client.cnf` (adapter `CN` = `loginApi`) :

```ini
[ req ]
default_bits       = 2048
default_md         = sha256
prompt             = no
distinguished_name = dn
req_extensions     = v3_req

[ v3_req ]
keyUsage         = critical, digitalSignature, keyEncipherment
extendedKeyUsage = clientAuth
basicConstraints = critical, CA:FALSE

[ dn ]
O  = SycaPay
CN = <LOGIN API>
```

```bash
openssl req -new -key client.key -config client.cnf -out client.csr
openssl req -in client.csr -noout -subject
```

Envoyer **uniquement** `client.csr` + code partenaire à `contact@sycapay.com`.  
Recevoir `client.crt` + `ca.crt`, puis vérifier :

```bash
openssl x509 -in client.crt -noout -subject -issuer -dates
openssl verify -CAfile ca.crt client.crt
```

Renouveler le CSR **≥ 30 jours** avant expiration.

---

## 5. API Sycapay — référence

### 5.1 Initier une transaction

`POST /initiationTransactionV1`

#### Corps

| Champ | Emplacement | Type | Obligatoire | Description |
|-------|-------------|------|-------------|-------------|
| `loginApi` | root | string | Oui | Identifiant API |
| `mdpApi` | root | string | Selon compte | Mot de passe API (doc §9 ; souvent requis hors exemples test) |
| `montant` | `transaction` | integer | Oui | Montant en XOF |
| `codeService` | `transaction` | string | Oui | Voir codes service |
| `numeroBeneficiaire` | `transaction` | string | Oui | Téléphone payeur / bénéficiaire |
| `idPartenaire` | `transaction` | string | Oui | Référence unique Nyra (idempotence) |
| `url_success` | `transaction` | string | Non | Redirect succès (surtout Wave) |
| `url_failed` | `transaction` | string | Non | Redirect échec |
| `nomMarchand` | `transaction` | string | Non | Nom affiché |
| `isSingleUse` | `transaction` | boolean | Non | Lien à usage unique |
| `latitude` / `longitude` | `transaction` | number | Non | GPS |
| `otp` | — | string | Non | Confirmation Wizall |
| `idPartenaireApi` | — | string | Non | Id applicatif alternatif |

#### Codes service (Sénégal)

| Code | Usage |
|------|--------|
| `SN_PM_WAVE` | **Paiement marchand** Wave |
| `SN_PM_OM` | **Paiement marchand** Orange Money |
| `SN_PM_YAS` | **Paiement marchand** YAS |
| `SN_PM_WIZALL` | **Paiement marchand** Wizall (OTP) |
| `SN_CASHIN_WAVE` | Cash-in Wave |
| `SN_CASHIN_OM` | Cash-in Orange Money |
| `SN_CASHIN_YAS` | Cash-in YAS / Free Money |
| `SN_CASHIN_WIZALL` | Cash-in Wizall |

> Pour le checkout e-commerce Nyra : utiliser les codes **`SN_PM_*`** (paiement marchand), pas les cash-in.

#### Wave — exemple

```json
{
  "loginApi": "SYCAPAY_TEST",
  "transaction": {
    "montant": 5000,
    "codeService": "SN_PM_WAVE",
    "numeroBeneficiaire": "771234567",
    "idPartenaire": "PAY_WAVE_001",
    "url_success": "https://secretdenyra-frontend.vercel.app/checkout/payment/return?result=success",
    "url_failed": "https://secretdenyra-frontend.vercel.app/checkout/payment/return?result=cancel"
  }
}
```

Réponse typique :

```json
{
  "code": "200",
  "message": "Transaction initialisée",
  "data": {
    "tokenTX": "TX_8f9a2c1d",
    "redirectUrl": "https://pay.wave.com/c/cos-…",
    "qrCode": null
  }
}
```

#### Orange Money — exemple

```json
{
  "loginApi": "SYCAPAY_TEST",
  "transaction": {
    "montant": 2500,
    "codeService": "SN_PM_OM",
    "numeroBeneficiaire": "770000000",
    "idPartenaire": "PAY_OM_001"
  }
}
```

Réponse typique : `tokenTX` + `deeplink` + `qrCode` (base64).

#### YAS

Mêmes paramètres que OM, avec `codeService: "SN_PM_YAS"`.

#### Wizall (OTP)

1. Init → `otpRequired: true` + `tokenTX`
2. Confirm :

`POST /confirmationTransactionV1`

```json
{
  "loginApi": "SYCAPAY_TEST",
  "tokenTX": "TX_wz_…",
  "otp": "123456"
}
```

---

### 5.2 Statut d’une transaction

`GET /status/<idPartenaire>`

- Cache + `ETag` / `If-None-Match` (304 si inchangé)
- `Cache-Control` : ~30 s en cours, ~60 s finalisé
- Rate limit : headers `X-RateLimit-Remaining`, `Retry-After` (429)

Exemple réponse :

```json
{
  "idPartenaire": "TXN-1776523263",
  "statut": "FINISHED",
  "tag": "SUCCESS",
  "dateValidation": "2026-04-18T14:41:06.499589"
}
```

| HTTP | Signification |
|------|----------------|
| 200 | Statut renvoyé |
| 304 | Pas de changement |
| 404 | `idPartenaire` inconnu |
| 429 | Trop d’appels |

---

### 5.3 Solde partenaire

`POST /balance`

```json
{ "loginApi": "SYCAPAY_TEST", "mdpApi": "********" }
```

Réponse : `errorCode`, `comptes[]` (`numero`, `solde`, `codePays`, `etat`, `typeCompte`), `lastCheckedAt`.  
Cache ~10 min.

Codes métier balance : `1110`–`1114` (mdp incorrect, manquant, login inconnu, partenaire désactivé…).

---

## 6. Webhooks

Configurer l’URL dans le **tableau de bord** Sycapay.

### Payload

```json
{
  "idPartenaire": "1567543354332142125129",
  "idPartenaireService": "CI251122.1336.A16800",
  "tag": "SUCCESS",
  "codeService": "SN_CASHIN_YAS",
  "reasonForFailure": "Vous avez atteint votre plafond journalier"
}
```

| `tag` | Action Nyra |
|-------|-------------|
| `SUCCESS` | Payment `SUCCESS` → finaliser commande (comme `sale_complete` PayTech) |
| `FAILED` | Payment `FAILED` / `CANCELED` |

### Auth webhook (au choix)

| Mode | Détail |
|------|--------|
| `NONE` | Tests uniquement |
| `BASIC` | `Authorization: Basic …` |
| `BEARER` | `Authorization: Bearer …` |
| `HMAC` | Signature corps brut dans `X-Sycapay-Signature` (SHA256 défaut, SHA512 option) — **recommandé prod** |

Vérif HMAC (Python, doc officielle) :

```python
import hmac, hashlib

def verify(body: bytes, header: str, secret: str) -> bool:
    algo, sent = header.split("=", 1)
    digest = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(sent, digest)
```

### Politique de reprise

| Constante | Défaut |
|-----------|--------|
| Timeout réponse | 30 s |
| Max retries | 3 |
| Backoff min / max | 1 s / 10 s |

Répondre **2xx**. Idempotence côté Nyra via `idPartenaireService` (ou `idPartenaire` + `tag`).

**Route cible Nyra :** `POST /api/webhooks/sycapay`

---

## 7. Erreurs

| Code HTTP | Signification |
|-----------|----------------|
| 400 | Requête invalide / paramètre manquant |
| 401 | Certificat client absent / invalide |
| 403 | Droits insuffisants |
| 404 | Transaction introuvable |
| 409 | `idPartenaire` déjà utilisé |
| 422 | Numéro / montant hors bornes |
| 429 | Rate limit |
| 500 | Erreur serveur Sycapay |
| 503 | Indisponible (maintenance / opérateur) |

Corps typique : `code` + `message`.

---

## 8. PayTech → Sycapay (écarts)

| Sujet | PayTech (actuel) | Sycapay (cible) |
|-------|------------------|-----------------|
| Auth sortante | Headers API key/secret | **mTLS** + login/mdp |
| Choix moyen | Sur page PayTech | **Côté Nyra** (`codeService`) |
| Téléphone | Non requis à l’init | **`numeroBeneficiaire` obligatoire** |
| Redirect | Toujours `redirectUrl` PayTech | Wave : `redirectUrl` ; OM/YAS : deeplink/QR ; Wizall : OTP |
| Webhook | `type_event` sale_complete / canceled | `tag` SUCCESS / FAILED |
| Statut | `get-status?token_payment=` | `GET /status/<idPartenaire>` |
| Ref commande | `ref_command` | `idPartenaire` |
| Token provider | `token` PayTech | `tokenTX` |

**Impact front majeur :** UI de sélection opérateur + saisie numéro (+ écran OTP Wizall).

---

## 9. Plan d’étapes Nyra

### Phase 0 — Onboarding Sycapay (bloquant)

- [ ] Compte partenaire + `loginApi` / `mdpApi` (sandbox puis prod)
- [ ] Générer CSR / recevoir `ca.crt`, `client.crt`, `client.key`
- [ ] Confirmer codes `SN_PM_*` activés pour le marchand
- [ ] Configurer URL webhook dashboard → Railway
- [ ] Choisir auth webhook (**HMAC** recommandé)

### Phase 1 — Spec & contrat API (docs)

- [x] Ce document (`sycapay-api-backend.md`)
- [ ] Mettre à jour `frontend-checkout-api.md` (routes + body payment)
- [ ] Mettre à jour `docs/backend-checkout-mini.md`
- [ ] Archiver / marquer obsolète PayTech dans les docs produit

### Phase 2 — Backend Strapi

- [ ] Service `sycapay` : agent HTTPS mTLS, init / status / confirmation OTP
- [ ] Stocker certificats via secrets Railway (fichiers ou variables base64) — **jamais** en git
- [ ] Entité Payment : `provider = sycapay`, champs `tokenTX`, `idPartenaire`, `codeService`
- [ ] Route `POST /api/checkout/:checkoutId/payment/sycapay`  
  Body proposé :
  ```json
  {
    "codeService": "SN_PM_WAVE",
    "numeroBeneficiaire": "771234567"
  }
  ```
  Réponse proposée :
  ```json
  {
    "paymentId": "uuid",
    "idPartenaire": "NYRA-…",
    "tokenTX": "TX_…",
    "redirectUrl": "…",
    "deeplink": "…",
    "qrCode": "…",
    "otpRequired": false
  }
  ```
- [ ] Route `POST /api/checkout/:checkoutId/payment/sycapay/confirm-otp` (Wizall)
- [ ] Webhook `POST /api/webhooks/sycapay` + vérif HMAC + idempotence
- [ ] Réutiliser / adapter `GET /api/payments/:id/status` (poll status Sycapay)
- [ ] `confirm` : accepter `paymentMethod: "sycapay"`
- [ ] Garder PayTech en dual-run optionnel jusqu’à bascule prod (feature flag)

### Phase 3 — Frontend

- [ ] Étape checkout : choisir Wave / OM / YAS / Wizall
- [ ] Champ téléphone obligatoire avant lancement paiement
- [ ] Brancher `payment/sycapay` au lieu de `payment/paytech`
- [ ] Gérer `redirectUrl` **ou** deeplink/QR **ou** OTP
- [ ] Page retour inchangée dans l’esprit : poll status → `confirm`
- [ ] Messages d’erreur (`422` numéro, `409` doublon, `503` opérateur…)

### Phase 4 — Tests

- [ ] Sandbox : chaque `SN_PM_*` + webhook SUCCESS / FAILED
- [ ] Invité (`X-Checkout-Token`) + utilisateur JWT
- [ ] Idempotence webhook (double livraison)
- [ ] Rate limit status (ETag / 429)
- [ ] Montants / variantes (garde-fous checkout existants)

### Phase 5 — Production

- [ ] Certificats **prod** + URLs success/failed/webhook prod
- [ ] Variables Railway
- [ ] Couper PayTech (routes + env) après période de supervision
- [ ] Monitoring : échecs init, webhooks non 2xx, paiements PENDING bloqués

---

## 10. Variables d’environnement

```env
# Sycapay
SYCAPAY_BASE_URL=https://ops.sycapay.com/coresystem/part/api
SYCAPAY_LOGIN_API=
SYCAPAY_MDP_API=
SYCAPAY_CA_CERT_PATH=/secrets/sycapay/ca.crt
SYCAPAY_CLIENT_CERT_PATH=/secrets/sycapay/client.crt
SYCAPAY_CLIENT_KEY_PATH=/secrets/sycapay/client.key
# ou équivalent base64 si fichiers non montés :
# SYCAPAY_CA_CERT_B64=
# SYCAPAY_CLIENT_CERT_B64=
# SYCAPAY_CLIENT_KEY_B64=

SYCAPAY_SUCCESS_URL=https://secretdenyra-frontend.vercel.app/checkout/payment/return?result=success
SYCAPAY_FAILED_URL=https://secretdenyra-frontend.vercel.app/checkout/payment/return?result=cancel
SYCAPAY_WEBHOOK_SECRET=
SYCAPAY_WEBHOOK_AUTH=HMAC
```

Anciennes vars `PAYTECH_*` : à retirer après bascule complète.

---

## 11. Checklist

### Backend

- [ ] mTLS OK vers `initiationTransactionV1`
- [ ] `idPartenaire` unique et stable (lié au Payment Nyra)
- [ ] Webhook HMAC + réponse 2xx
- [ ] Status + confirm commande alignés sur `tag=SUCCESS`
- [ ] Aucun secret / clé privée dans le repo

### Frontend

- [ ] Sélection opérateur + téléphone
- [ ] Gestion Wave / OM / YAS / Wizall
- [ ] Aucun appel direct à `ops.sycapay.com`

### Ops

- [ ] Certificats renouvelés avant expiration
- [ ] Webhook dashboard pointant vers Railway
- [ ] Runbook support (codes 401 cert, 111x balance, 429)

---

## Références

| Doc | Rôle |
|-----|------|
| `Sycapay-API-Documentation (3).pdf` | Source officielle |
| [`paytech-api-backend.md`](./paytech-api-backend.md) | Ancienne intégration (à déprécier) |
| [`frontend-checkout-api.md`](./frontend-checkout-api.md) | Contrat front (à mettre à jour Phase 1) |
| [`docs/backend-checkout-mini.md`](./docs/backend-checkout-mini.md) | Mini-référence routes |

**Prochaine décision produit :** ordre des opérateurs en v1 (Wave seul d’abord, ou Wave + OM), et format exact du body `payment/sycapay` — à figer avant le code Phase 2.
