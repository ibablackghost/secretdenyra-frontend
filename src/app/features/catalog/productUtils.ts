import type { UIProduct, UIProductVariant } from './types';

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
    const byId = list.find((v) => String(v.id).trim() === needle);
    if (byId) return byId;
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
