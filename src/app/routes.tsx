import { createBrowserRouter } from 'react-router';
import { Layout } from './components/layout/Layout';
import { RequireAuth } from './components/auth/RequireAuth';
import { Home } from './pages/Home';
import { Shop } from './pages/Shop';
import { Product } from './pages/Product';
import { Cart } from './pages/Cart';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Account } from './pages/Account';
import { Wishlist } from './pages/Wishlist';

function AccountRoute() {
  return (
    <RequireAuth>
      <Account />
    </RequireAuth>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: 'shop', Component: Shop },
      { path: 'product/:slug', Component: Product },
      { path: 'cart', Component: Cart },
      { path: 'login', Component: Login },
      { path: 'register', Component: Register },
      { path: 'wishlist', Component: Wishlist },
      { path: 'account', Component: AccountRoute },
      { path: '*', Component: Home },
    ],
  },
]);
