import { lazy, Suspense, type ComponentType } from 'react';
import { createBrowserRouter } from 'react-router';
import { Layout } from './components/layout/Layout';
import { RequireAuth } from './components/auth/RequireAuth';
import { RouteErrorBoundary } from './components/ui/RouteErrorBoundary';
const Home = lazy(() => import('./pages/Home').then((m) => ({ default: m.Home })));
const Shop = lazy(() => import('./pages/Shop').then((m) => ({ default: m.Shop })));
const Product = lazy(() => import('./pages/Product').then((m) => ({ default: m.Product })));
const Cart = lazy(() => import('./pages/Cart').then((m) => ({ default: m.Cart })));
const Checkout = lazy(() => import('./pages/Checkout').then((m) => ({ default: m.Checkout })));
const Login = lazy(() => import('./pages/Login').then((m) => ({ default: m.Login })));
const Register = lazy(() => import('./pages/Register').then((m) => ({ default: m.Register })));
const Account = lazy(() => import('./pages/Account').then((m) => ({ default: m.Account })));
const Wishlist = lazy(() => import('./pages/Wishlist').then((m) => ({ default: m.Wishlist })));

function withSuspense(Component: ComponentType) {
  return function SuspendedRoute() {
    return (
      <Suspense fallback={<div className="mx-auto max-w-[1400px] px-4 py-12 text-gray-500">Chargement...</div>}>
        <Component />
      </Suspense>
    );
  };
}

const HomeRoute = withSuspense(Home);
const ShopRoute = withSuspense(Shop);
const ProductRoute = withSuspense(Product);
const CartRoute = withSuspense(Cart);
const CheckoutRoute = withSuspense(Checkout);
const LoginRoute = withSuspense(Login);
const RegisterRoute = withSuspense(Register);
const WishlistRoute = withSuspense(Wishlist);
const AccountPageRoute = withSuspense(Account);

function AccountRoute() {
  return (
    <RequireAuth>
      <AccountPageRoute />
    </RequireAuth>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, Component: HomeRoute },
      { path: 'shop', Component: ShopRoute },
      { path: 'shop/category/:categorySlug', Component: ShopRoute },
      { path: 'product/:slug', Component: ProductRoute },
      { path: 'cart', Component: CartRoute },
      { path: 'checkout', Component: CheckoutRoute },
      { path: 'login', Component: LoginRoute },
      { path: 'register', Component: RegisterRoute },
      { path: 'wishlist', Component: WishlistRoute },
      { path: 'account', Component: AccountRoute },
      { path: '*', Component: HomeRoute },
    ],
  },
]);
