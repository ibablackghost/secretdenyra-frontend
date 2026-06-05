import type { UIProduct, UIProductVariant } from './types';

/** Prix unitaires exploitables (variantes actives, sinon prix produit). */
export function variantUnitPrices(product: UIProduct): number[] {
  const list = product.variants ?? [];
  const fromVariants = list
    .filter((v) => v.inStock !== false)
    .map((v) => v.price)
    .filter((p): p is number => typeof p === 'number' && Number.isFinite(p) && p > 0);
  if (fromVariants.length > 0) return fromVariants;
  if (typeof product.price === 'number' && Number.isFinite(product.price) && product.price > 0) {
    return [product.price];
  }
  return [];
}

/** Prix « à partir de » affiché en liste (min des variantes ou prix produit). */
export function getCatalogListPrice(product: UIProduct): number {
  const prices = variantUnitPrices(product);
  if (prices.length > 0) return Math.min(...prices);
  return product.price;
}

export function getCatalogPriceRange(products: UIProduct[]): { min: number; max: number } {
  if (products.length === 0) return { min: 0, max: 500_000 };
  let min = Infinity;
  let max = 0;
  for (const p of products) {
    const prices = variantUnitPrices(p);
    for (const price of prices.length > 0 ? prices : [p.price]) {
      if (!Number.isFinite(price)) continue;
      if (price < min) min = price;
      if (price > max) max = price;
    }
  }
  if (!Number.isFinite(min)) min = 0;
  const cap = Math.ceil((max || 500_000) / 10_000) * 10_000;
  return { min: min === Infinity ? 0 : min, max: Math.max(cap, 10_000) };
}

/** Slugs catégorie « Thé bio » (URL shop + variantes Strapi). */
export function isBioTeaProduct(product: Pick<UIProduct, 'category'>): boolean {
  const s = product.category.slug;
  return s === 'thes-bio' || s === 'nos-thes-bio' || s === 'the-bio';
}

export function findCatalogProduct(products: UIProduct[], storedRef: string): UIProduct | undefined {
  const ref = storedRef.trim();
  if (!ref) return undefined;
  return products.find(
    (p) =>
      p.id === ref ||
      p.slug === ref ||
      p.documentId === ref ||
      (p.strapiId != null && p.strapiId === ref)
  );
}

export function variantLineId(variant: UIProductVariant): string {
  return variant.documentId ?? variant.id;
}

/** Référence produit pour POST /api/checkout/init (documentId ou slug). */
export function checkoutProductRef(product: UIProduct): string {
  return product.documentId ?? product.slug ?? product.id;
}

/** Variante pour le checkout — documentId Strapi en priorité. */
export function checkoutVariantRef(product: UIProduct, variantId?: string): string | undefined {
  if (variantId == null || String(variantId).trim() === '') return undefined;
  const resolved = resolveVariant(product, variantId);
  if (!resolved) return undefined;
  return resolved.documentId ?? resolved.id;
}

export function getDefaultVariant(product: UIProduct): UIProductVariant | null {
  const list = product.variants ?? [];
  if (list.length === 0) return null;
  return list.find((v) => v.isDefault) ?? list[0] ?? null;
}

export function resolveVariant(product: UIProduct, variantId?: string | null): UIProductVariant | null {
  const list = product.variants ?? [];
  if (list.length === 0) return null;
  if (variantId != null && String(variantId).trim() !== '') {
    const needle = String(variantId).trim();
    const byDoc = list.find((v) => v.documentId != null && String(v.documentId).trim() === needle);
    if (byDoc) return byDoc;
    const byId = list.find((v) => String(v.id).trim() === needle);
    if (byId) return byId;
    const byStrapi = list.find((v) => v.strapiId != null && String(v.strapiId).trim() === needle);
    if (byStrapi) return byStrapi;
    const bySku = list.find((v) => v.sku && String(v.sku).trim() === needle);
    if (bySku) return bySku;
    const byLabel = list.find((v) =>
      [v.label, v.format, v.name, v.size].some((x) => (x != null && String(x).trim() !== '' && String(x).trim() === needle))
    );
    if (byLabel) return byLabel;
  }
  return getDefaultVariant(product);
}

export function unitPriceForLine(product: UIProduct, variantId?: string | null): number {
  const v = resolveVariant(product, variantId);
  return v?.price ?? product.price;
}

export function stockForLine(product: UIProduct, variantId?: string | null): { qty?: number; inStock: boolean } {
  const list = product.variants ?? [];
  // Backend : le stock est porté par les variantes. Sans variante, le parent n'est pas fiable → toujours "en stock" côté UI.
  if (list.length === 0) {
    return { qty: undefined, inStock: true };
  }
  const v = resolveVariant(product, variantId);
  const qty = v ? (v.stockQty ?? (typeof v.stock === 'number' ? v.stock : undefined)) : undefined;
  const inStock = v ? (v.inStock ?? true) && (qty === undefined || qty > 0) : false;
  return { qty, inStock };
}
