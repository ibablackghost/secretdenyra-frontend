import type { UIProduct } from '@/app/features/catalog/types';

export const HERBORISTERIE_CATEGORY_SLUG = 'herboristerie';

export function isHerboristerieProduct(product: Pick<UIProduct, 'category'>): boolean {
  return product.category.slug === HERBORISTERIE_CATEGORY_SLUG;
}

/** Prix herboristerie visibles uniquement pour les comptes professionnels validés. */
export function shouldHideHerboristeriePrice(
  product: Pick<UIProduct, 'category'>,
  isProfessional: boolean
): boolean {
  return isHerboristerieProduct(product) && !isProfessional;
}

export function canPurchaseHerboristerieProduct(
  product: Pick<UIProduct, 'category'>,
  isProfessional: boolean
): boolean {
  return !shouldHideHerboristeriePrice(product, isProfessional);
}
