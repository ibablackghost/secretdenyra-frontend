import type { CatalogPayload, UICategory, UIProduct, UITag } from '../features/catalog/types';
import type { Locale } from '../store/localeStore';

/** Labels catégories / tags par slug (indépendants du texte Strapi FR). */
const SLUG_LABELS_EN: Record<string, string> = {
  'secret-de-nyra': 'Secret de Nyra',
  'thes-bio': 'Organic teas',
  'nos-thes-bio': 'Organic teas',
  'the-bio': 'Organic teas',
  tisanes: 'Herbal teas',
  tisane: 'Herbal teas',
  herboristerie: 'Herbalist',
  cafes: 'Coffees',
  café: 'Coffees',
  cafés: 'Coffees',
  cafe: 'Coffees',
  accessoires: 'Accessories',
  'the-noir': 'Black tea',
  'the-blanc': 'White tea',
  'the-vert': 'Green tea',
  infusion: 'Infusion',
  'bien-etre': 'Wellness',
  the: 'Tea',
  bio: 'Organic',
  vrac: 'Loose leaf',
  fruité: 'Fruity',
  fruite: 'Fruity',
  aromatise: 'Flavored',
  aromatisé: 'Flavored',
  plante: 'Plant',
  fleur: 'Flower',
  aromatique: 'Aromatic',
  'recolte-manuelle': 'Hand-harvested',
  energie: 'Energy',
  sommeil: 'Sleep',
  digestion: 'Digestion',
  detox: 'Detox',
  détox: 'Detox',
};

const EFFECT_LABELS: Record<Locale, Record<string, string>> = {
  fr: { energie: 'Énergie', sommeil: 'Sommeil', digestion: 'Digestion', detox: 'Détox' },
  en: { energie: 'Energy', sommeil: 'Sleep', digestion: 'Digestion', detox: 'Detox' },
};

const FORMAT_LABELS: Record<Locale, Record<string, string>> = {
  fr: { '50g': 'Vrac 50g', '250g': 'Vrac 250g' },
  en: { '50g': 'Loose 50g', '250g': 'Loose 250g' },
};

/** Remplacements FR → EN (phrases longues d’abord). */
const TEXT_REPLACEMENTS: Array<[RegExp, string]> = [
  [/Grossiste Thé Bio/gi, 'Organic Tea Wholesaler'],
  [/Thé Noir Nature/gi, 'Plain Black Tea'],
  [/Thé Noir Assam/gi, 'Assam Black Tea'],
  [/Thé Noir/gi, 'Black Tea'],
  [/Thé Vert/gi, 'Green Tea'],
  [/Thé Blanc/gi, 'White Tea'],
  [/Matcha Taishan Bio/gi, 'Taishan Organic Matcha'],
  [/En Vrac/gi, 'Loose Leaf'],
  [/au kilo/gi, 'by the kilo'],
  [/Herboristerie Bio/gi, 'Organic Herbalist'],
  [/Herboristerie/gi, 'Herbalist'],
  [/Tisanes?/gi, 'Herbal Tea'],
  [/Ingrédients\s*:/gi, 'Ingredients:'],
  [/Valeurs nutritives/gi, 'Nutritional values'],
  [/Valeurs nutritionnelles/gi, 'Nutrition facts'],
  [/Hydrate de carbone/gi, 'Carbohydrates'],
  [/dont saturation/gi, 'of which saturates'],
  [/Conditionnement/gi, 'Packaging'],
  [/Nom botanique\s*:/gi, 'Botanical name:'],
  [/Technique de récolte\s*:/gi, 'Harvest method:'],
  [/Époque de récolte\s*:/gi, 'Harvest season:'],
  [/Epoque de récolte\s*:/gi, 'Harvest season:'],
  [/Sachet de/gi, 'Bag of'],
  [/Forme\s*:/gi, 'Form:'],
  [/Couleur\s*:/gi, 'Color:'],
  [/Odeur\s*:/gi, 'Aroma:'],
  [/Saveur\s*:/gi, 'Flavor:'],
  [/légèrement amère/gi, 'slightly bitter'],
  [/Douce, herbacée, suave/gi, 'Soft, herbaceous, sweet'],
  [/Herbacée/gi, 'Herbaceous'],
  [/herbacée/gi, 'herbaceous'],
  [/Sommité fleurie/gi, 'Flowering tops'],
  [/Sommitè fleurie/gi, 'Flowering tops'],
  [/Manuelle/gi, 'Hand-picked'],
  [/\bÉté\b/gi, 'Summer'],
  [/\bEte\b/gi, 'Summer'],
  [/\bGraisse\b/gi, 'Fat'],
  [/\bÉnergie\b/gi, 'Energy'],
  [/\bEnergie\b/gi, 'Energy'],
  [/\bSucre\b/gi, 'Sugar'],
  [/\bBio\b/g, 'Organic'],
  [/\bVrac\b/gi, 'Loose leaf'],
  [/\bStandard\b/gi, 'Standard'],
];

export function localizeCatalogText(text: string | null | undefined, locale: Locale): string {
  if (!text) return '';
  if (locale === 'fr') return text;
  let out = text;
  for (const [pattern, replacement] of TEXT_REPLACEMENTS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

export function localizeSlugLabel(slug: string, fallback: string, locale: Locale): string {
  if (locale === 'fr') return fallback;
  return SLUG_LABELS_EN[slug] ?? localizeCatalogText(fallback, locale);
}

export function localizeEffectLabel(slug: string, locale: Locale): string {
  return EFFECT_LABELS[locale][slug] ?? slug;
}

export function localizeFormatLabel(key: string, locale: Locale): string {
  return FORMAT_LABELS[locale][key] ?? key;
}

function localizeProduct(product: UIProduct, locale: Locale): UIProduct {
  if (locale === 'fr') return product;
  return {
    ...product,
    name: localizeCatalogText(product.name, locale),
    ingredients: localizeCatalogText(product.ingredients, locale),
    shortDescription: product.shortDescription
      ? localizeCatalogText(product.shortDescription, locale)
      : product.shortDescription,
    description: product.description ? localizeCatalogText(product.description, locale) : product.description,
    dosage: product.dosage ? localizeCatalogText(product.dosage, locale) : product.dosage,
    infusionTime: product.infusionTime ? localizeCatalogText(product.infusionTime, locale) : product.infusionTime,
    origin: product.origin ? localizeCatalogText(product.origin, locale) : product.origin,
    metaTitle: product.metaTitle ? localizeCatalogText(product.metaTitle, locale) : product.metaTitle,
    metaDescription: product.metaDescription
      ? localizeCatalogText(product.metaDescription, locale)
      : product.metaDescription,
    category: {
      ...product.category,
      name: localizeSlugLabel(product.category.slug, product.category.name, locale),
    },
    tags: product.tags.map((tag) => ({
      ...tag,
      name: localizeSlugLabel(tag.slug, tag.name, locale),
    })),
    variants: product.variants.map((variant) => ({
      ...variant,
      label: localizeCatalogText(variant.label, locale),
      name: variant.name ? localizeCatalogText(variant.name, locale) : variant.name,
      format: variant.format ? localizeCatalogText(variant.format, locale) : variant.format,
      size: variant.size ? localizeCatalogText(variant.size, locale) : variant.size,
    })),
  };
}

function localizeCategory(category: UICategory, locale: Locale): UICategory {
  if (locale === 'fr') return category;
  return { ...category, name: localizeSlugLabel(category.slug, category.name, locale) };
}

function localizeTag(tag: UITag, locale: Locale): UITag {
  if (locale === 'fr') return tag;
  return { ...tag, name: localizeSlugLabel(tag.slug, tag.name, locale) };
}

/** Applique la locale aux données catalogue Strapi (FR-only côté CMS). */
export function localizeCatalog(payload: CatalogPayload, locale: Locale): CatalogPayload {
  if (locale === 'fr') return payload;
  return {
    products: payload.products.map((p) => localizeProduct(p, locale)),
    categories: payload.categories.map((c) => localizeCategory(c, locale)),
    tags: payload.tags.map((t) => localizeTag(t, locale)),
  };
}
