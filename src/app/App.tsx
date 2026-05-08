import { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { useAuthStore } from './store/authStore';
import { useWishlistStore } from './store/wishlistStore';
import { useCartStore } from './store/cartStore';
import { useAddressStore } from './store/addressStore';
import { useOrderStore } from './store/orderStore';
import { useViewedProductsStore } from './store/viewedProductsStore';

export default function App() {
  const token = useAuthStore((s) => s.token);
  const loadMe = useAuthStore((s) => s.loadMe);
  const hydrateWishlist = useWishlistStore((s) => s.hydrateFromServer);
  const hydrateCart = useCartStore((s) => s.hydrateFromServer);
  const hydrateAddresses = useAddressStore((s) => s.hydrateFromServer);
  const hydrateOrders = useOrderStore((s) => s.hydrateFromServer);
  const hydrateViewed = useViewedProductsStore((s) => s.hydrateFromServer);

  useEffect(() => {
    if (!token) return;
    void loadMe();
    void hydrateWishlist();
    void hydrateCart();
    void hydrateAddresses();
    void hydrateOrders();
    void hydrateViewed();
  }, [token, loadMe, hydrateWishlist, hydrateCart, hydrateAddresses, hydrateOrders, hydrateViewed]);

  return <RouterProvider router={router} />;
}