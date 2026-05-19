import { useAuthStore } from '@/app/store/authStore';
import {
  canPurchaseHerboristerieProduct,
  isHerboristerieProduct,
  shouldHideHerboristeriePrice,
} from '@/app/lib/herboristerieAccess';
import type { UIProduct } from '@/app/features/catalog/types';

export function useHerboristeriePriceAccess() {
  const isProfessional = useAuthStore((s) => s.user?.isProfessional === true);

  return {
    isProfessional,
    canViewHerboristeriePrices: isProfessional,
    isHerboristerieProduct,
    shouldHidePrice: (product: Pick<UIProduct, 'category'>) =>
      shouldHideHerboristeriePrice(product, isProfessional),
    canPurchaseProduct: (product: Pick<UIProduct, 'category'>) =>
      canPurchaseHerboristerieProduct(product, isProfessional),
  };
}
