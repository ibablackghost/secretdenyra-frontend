import type { UIProduct } from '../features/catalog/types';
import { checkoutProductRef, checkoutVariantRef, findCatalogProduct } from '../features/catalog/productUtils';

export type CheckoutCartLine = {
  productId: string;
  quantity: number;
  variantId?: string;
};

export function toCheckoutLine(
  product: UIProduct,
  quantity: number,
  variantIdInCart?: string
): CheckoutCartLine | null {
  const variantCount = product.variants?.length ?? 0;
  const line: CheckoutCartLine = {
    productId: checkoutProductRef(product),
    quantity,
  };

  if (variantCount === 0) {
    return line;
  }

  if (variantCount > 1 && !variantIdInCart?.trim()) {
    return null;
  }

  const variantRef = checkoutVariantRef(product, variantIdInCart);
  if (!variantRef) {
    return null;
  }

  line.variantId = variantRef;
  return line;
}

export function buildCheckoutLinesFromCart(
  products: UIProduct[],
  cartItems: Array<{ productId: string; quantity: number; variantId?: string }>
): { lines: CheckoutCartLine[]; skipped: string[] } {
  const lines: CheckoutCartLine[] = [];
  const skipped: string[] = [];

  for (const item of cartItems) {
    const product = findCatalogProduct(products, item.productId);
    if (!product) {
      skipped.push(item.productId);
      continue;
    }
    const line = toCheckoutLine(product, item.quantity, item.variantId);
    if (!line) {
      skipped.push(product.name);
      continue;
    }
    lines.push(line);
  }

  return { lines, skipped };
}
