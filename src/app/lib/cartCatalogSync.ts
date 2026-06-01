import type { CartItem } from '../store/cartStore';
import type { UIProduct } from '../features/catalog/types';
import { checkoutProductRef, checkoutVariantRef, findCatalogProduct } from '../features/catalog/productUtils';

function lineKey(productId: string, variantId?: string) {
  return `${productId}::${variantId ?? ''}`;
}

/** Aligne le panier local sur le catalogue (slug) et retire les lignes introuvables. */
export function normalizeCartItems(
  items: CartItem[],
  products: UIProduct[]
): { items: CartItem[]; removedCount: number } {
  if (products.length === 0) return { items, removedCount: 0 };

  const merged = new Map<string, CartItem>();

  for (const item of items) {
    const product = findCatalogProduct(products, item.productId);
    if (!product) continue;

    const productId = checkoutProductRef(product);
    const variantId = checkoutVariantRef(product, item.variantId);
    const key = lineKey(productId, variantId);
    const existing = merged.get(key);
    if (existing) {
      merged.set(key, { ...existing, quantity: existing.quantity + item.quantity });
    } else {
      merged.set(key, { ...item, productId, variantId });
    }
  }

  const normalized = Array.from(merged.values());
  const invalidCount = items.filter((item) => !findCatalogProduct(products, item.productId)).length;
  return { items: normalized, removedCount: invalidCount };
}
