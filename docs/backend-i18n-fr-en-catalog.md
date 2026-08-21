# Prompt backend — i18n FR / EN catalogue Strapi (Nyra)

## Contexte

Le frontend Secret de Nyra a un switch **FR | EN**.

Aujourd’hui :
- l’UI (header, boutique, filtres…) bascule en anglais côté front
- **les données catalogue Strapi restent en français**
- `GET /api/products?locale=en` renvoie encore les mêmes contenus FR (pas de locales EN en base)

Le front applique un **fallback de traduction approximative** (titres / tags / phrases courantes). Ce n’est **pas** acceptable en prod pour un vrai EN.

## Objectif

Activer l’**internationalisation Strapi** (plugin i18n) pour que le front puisse charger le catalogue dans la langue choisie :

- `locale=fr` → contenus français (source actuelle)
- `locale=en` → contenus anglais réels (saisis / importés dans Strapi)

## Périmètre contenu à localiser

Pour chaque **Product** (et relations affichées) :

| Champ | Obligatoire EN |
|---|---|
| `name` | Oui |
| `shortDescription` | Oui |
| `description` | Oui |
| `ingredients` | Oui |
| `metaTitle` | Oui |
| `metaDescription` | Oui |
| `dosage` | Si rempli en FR |
| `infusionTime` | Si rempli en FR |
| `temperature` | Si rempli en FR |
| `origin` | Si rempli en FR |
| `botanicalName` | Peut rester latin (identique FR/EN) |

Relations à localiser aussi :

| Content-type | Champs |
|---|---|
| **Category** | `name`, `metaTitle`, `metaDescription` |
| **Tag** | `name` |
| **Product variant** | `label`, `name`, `format`, `size` (si texte libre) |

Slugs (`slug`) :
- **garder les mêmes slugs** entre FR et EN (recommandé pour le front actuel : URLs `/product/:slug` stables)
- OU documenter clairement si les slugs EN divergent (le front devra alors mapper)

## Comportement API attendu

### 1) Query locale

Tous les endpoints catalogue doivent accepter `locale` :

```http
GET /api/products?locale=en&pagination[page]=1&pagination[pageSize]=100
  &populate[category]=true
  &populate[image]=true
  &populate[gallery]=true
  &populate[tags]=true
  &populate[variants]=true

GET /api/categories?locale=en
```

Idem pour FR : `locale=fr` (ou défaut = `fr`).

### 2) Réponse

- `locale=en` → `name`, descriptions, tags, category.name en **anglais**
- si une entrée EN n’existe pas encore → **ne pas renvoyer silencieusement le FR** sans le signaler  
  Options acceptables (choisir une et documenter) :
  1. **Fallback FR** + header `X-Content-Locale: fr` / champ `locale` dans la payload
  2. **404 / entrée absente** pour les non-traduits
  3. Retourner l’entrée avec `locale: "fr"` explicite dans chaque item

Préférence front : **option 1 (fallback FR)** pendant la migration, puis 100 % EN.

### 3) Locales activées

Configurer Strapi i18n :

- Default locale : `fr`
- Locales disponibles : `fr`, `en`
- Content-types i18n-enabled : `product`, `category`, `tag` (+ composants variants si besoin)

## Tâches backend (checklist)

- [ ] Installer / activer `@strapi/plugin-i18n` (Strapi v4/v5 selon stack actuelle)
- [ ] Activer i18n sur `product`, `category`, `tag`
- [ ] Migrer le contenu FR existant comme locale `fr`
- [ ] Créer les entrées liées `en` (copie liée / localization) pour **tous** les produits en ligne
- [ ] Remplir les champs EN (au minimum `name`, `shortDescription`, `description`, `ingredients`, `meta*`)
- [ ] Traduire catégories + tags
- [ ] Vérifier `populate` + pagination multi-pages avec `locale`
- [ ] CORS / permissions publiques inchangées pour lecture catalogue
- [ ] Documenter le contrat API (exemples curl FR vs EN)
- [ ] Déployer Railway + smoke test prod

## Exemples de validation

### FR

```bash
curl "https://secretdenyra-backend-production.up.railway.app/api/products?locale=fr&pagination[pageSize]=1&populate[category]=true&populate[tags]=true"
```

Attendu : `"name": "Thé Noir Nature Bio En Vrac"` (ex.)

### EN

```bash
curl "https://secretdenyra-backend-production.up.railway.app/api/products?locale=en&pagination[pageSize]=1&populate[category]=true&populate[tags]=true"
```

Attendu : `"name": "Organic Plain Black Tea Loose Leaf"` (ex. vrai EN, **pas** le FR)

### Catégories

```bash
curl ".../api/categories?locale=en"
```

Attendu : `"name": "Organic teas"` pour `thes-bio` (et non `"Thés bio"`)

## Contrat front (déjà prévu)

Une fois l’API OK, le front appellera :

```ts
fetchCatalog(signal, locale) // locale = 'fr' | 'en'
// → /api/products?locale=${locale}&...
// → /api/categories?locale=${locale}
```

Le switch FR/EN du site basculera alors sur **vraies données CMS**, et le fallback heuristique front pourra être retiré.

## Critères d’acceptance

1. `locale=en` renvoie des champs texte **différents** de `locale=fr` pour au moins 95 % des produits publiés
2. Catégories + tags EN cohérents
3. Images / prix / stock / variants IDs inchangés (seuls les labels texte changent)
4. Pas de régression panier / checkout (IDs `documentId` / `slug` stables)
5. Doc backend livrée avec exemples de réponses FR/EN

## Hors scope

- Traduction panier / checkout / emails (peut venir après)
- Traduction automatique IA non relue (si utilisée, revue humaine obligatoire avant prod)

## Priorité

**Haute** — sans ça, le mode EN du site affiche un mélange UI EN + contenus FR (ou traductions front approximatives).
