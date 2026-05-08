import { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { useAuthStore } from './store/authStore';
import { useWishlistStore } from './store/wishlistStore';
import { useCartStore } from './store/cartStore';
import { useAddressStore } from './store/addressStore';
import { useOrderStore } from './store/orderStore';
import { useViewedProductsStore } from './store/viewedProductsStore';
import { usePurchasedProductsStore } from './store/purchasedProductsStore';

export default function App() {
  const token = useAuthStore((s) => s.token);
  const loadMe = useAuthStore((s) => s.loadMe);
  const hydrateWishlist = useWishlistStore((s) => s.hydrateFromServer);
  const clearWishlist = useWishlistStore((s) => s.clear);
  const hydrateCart = useCartStore((s) => s.hydrateFromServer);
  const clearCart = useCartStore((s) => s.clearCart);
  const hydrateAddresses = useAddressStore((s) => s.hydrateFromServer);
  const clearAddresses = useAddressStore((s) => s.clear);
  const hydrateOrders = useOrderStore((s) => s.hydrateFromServer);
  const clearOrders = useOrderStore((s) => s.clear);
  const hydrateViewed = useViewedProductsStore((s) => s.hydrateFromServer);
  const clearViewed = useViewedProductsStore((s) => s.clear);
  const hydratePurchasedProducts = usePurchasedProductsStore((s) => s.hydrateFromServer);
  const clearPurchasedProducts = usePurchasedProductsStore((s) => s.clear);

  useEffect(() => {
    if (!token) {
      void clearWishlist();
      void clearCart();
      void clearAddresses();
      void clearOrders();
      void clearViewed();
      void clearPurchasedProducts();
      return;
    }
    void loadMe();
    void hydrateWishlist();
    void hydrateCart();
    void hydrateAddresses();
    void hydrateOrders();
    void hydrateViewed();
    void hydratePurchasedProducts();
  }, [
    token,
    loadMe,
    hydrateWishlist,
    hydrateCart,
    hydrateAddresses,
    hydrateOrders,
    hydrateViewed,
    clearWishlist,
    clearCart,
    clearAddresses,
    clearOrders,
    clearViewed,
    hydratePurchasedProducts,
    clearPurchasedProducts,
  ]);

  return <RouterProvider router={router} />;
}

//dsaqdqsd