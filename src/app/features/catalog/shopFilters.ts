import type { UIProduct, UIProductVariant } from './types';

export type ShopEffectFilter = {
  slug: string;
  label: string;
  color: string;
  tagSlugs: string[];
  keywords: RegExp;
};

export type ShopFormatOption = {
  key: '50g' | '250g';
  label: string;
};

export const SHOP_FORMAT_FILTER_OPTIONS: ShopFormatOption[] = [
  { key: '50g', label: 'Vrac 50g' },
  { key: '250g', label: 'Vrac 250g' },
];

/** Filtres « Effets recherchés » — tags Strapi + mots-clés nom / ingrédients. */
export const SHOP_EFFECT_FILTERS: ShopEffectFilter[] = [
  {
    slug: 'energie',
    label: 'Énergie',
    color: '#f4e79b',
    tagSlugs: ['energie'],
    keywords: /énergie|energie|ginseng|guarana|maté|mate/i,
  },
  {
    slug: 'sommeil',
    label: 'Sommeil',
    color: '#8bb587',
    tagSlugs: [],
    keywords: /sommeil|camomille|valérian|valerian|passiflor|tilleul/i,
  },
  {
    slug: 'digestion',
    label: 'Digestion',
    color: '#527d5e',
    tagSlugs: [],
    keywords: /digestion|digest|menthe|fenouil|anis|réglisse|reglisse|verveine/i,
  },
  {
    slug: 'detox',
    label: 'Détox',
    color: '#272824',
    tagSlugs: [],
    keywords: /détox|detox|pissenlit|gingembre|chardon/i,
  },
];

function normalizeFormatToken(raw: string): '50g' | '250g' | null {
  const text = raw.trim().toLowerCase().replace(/\s+/g, '');
  if (text === '50g' || text === 'vrac50g') return '50g';
  if (text === '250g' || text === 'vrac250g') return '250g';
  return null;
}

/** Clé de format normalisée pour une variante (50g ou 250g uniquement). */
export function variantFormatKey(variant: UIProductVariant): '50g' | '250g' | null {
  const parts = [variant.label, variant.format, variant.size, variant.name].filter(Boolean) as string[];
  for (const part of parts) {
    const key = normalizeFormatToken(part);
    if (key) return key;
  }
  if (variant.weightValue === 50 && variant.weightUnit === 'g') return '50g';
  if (variant.weightValue === 250 && variant.weightUnit === 'g') return '250g';
  return null;
}

/** Formats 50g / 250g pour un produit (variantes + indice dans le slug). */
export function productFormatKeys(product: UIProduct): Array<'50g' | '250g'> {
  const keys = new Set<'50g' | '250g'>();
  for (const variant of product.variants ?? []) {
    const key = variantFormatKey(variant);
    if (key) keys.add(key);
  }
  if (/\b50g\b/i.test(product.slug)) keys.add('50g');
  if (/\b250g\b/i.test(product.slug)) keys.add('250g');
  return [...keys];
}

export function productHasFormat(product: UIProduct, formatKey: string): boolean {
  return formatKey === '50g' || formatKey === '250g'
    ? productFormatKeys(product).includes(formatKey)
    : false;
}

/** Options format boutique : uniquement Vrac 50g et Vrac 250g. */
export function collectCatalogFormats(products: UIProduct[]): ShopFormatOption[] {
  const hasVracFormat = products.some(
    (product) => productHasFormat(product, '50g') || productHasFormat(product, '250g')
  );
  return hasVracFormat ? [...SHOP_FORMAT_FILTER_OPTIONS] : [];
}

export function productMatchesEffect(product: UIProduct, effectSlug: string): boolean {
  const def = SHOP_EFFECT_FILTERS.find((item) => item.slug === effectSlug);
  if (!def) return true;
  if (def.tagSlugs.some((slug) => product.tags.some((tag) => tag.slug === slug))) return true;
  const haystack = [product.name, product.ingredients, product.shortDescription ?? '', product.description ?? ''].join(
    ' '
  );
  return def.keywords.test(haystack);
}

export function countProductsForEffect(products: UIProduct[], effectSlug: string): number {
  return products.filter((product) => productMatchesEffect(product, effectSlug)).length;
}
