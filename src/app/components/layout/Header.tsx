import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { ShoppingBag, User, Globe, Heart, Menu, Search, X } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { useWishlistStore } from '../../store/wishlistStore';
import { HeaderSearchPanel } from './HeaderSearchPanel';
import { PendingPaymentsHeaderHint } from '../../features/account/components/PendingPaymentsBanner';
import { selectAwaitingPayments, usePendingPaymentsStore } from '../../store/pendingPaymentsStore';
import imgLogo from 'figma:asset/04c30533fe5a9a60b6e7341851231c595d46cb74.png';

export const Header = () => {
  const location = useLocation();
  const cartItems = useCartStore((state) => state.items);
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const user = useAuthStore((s) => s.user);
  const wishCount = useWishlistStore((s) => s.count);
  const pendingPaymentItems = usePendingPaymentsStore((s) => s.items);
  const hydratePendingPayments = usePendingPaymentsStore((s) => s.hydrateFromServer);
  const pendingPaymentsCount = selectAwaitingPayments(pendingPaymentItems).length;

  const { accountLabel, accountInitials } = useMemo(() => {
    if (!user) return { accountLabel: null as string | null, accountInitials: null as string | null };
    const first = (user.firstName || '').trim();
    const last = (user.lastName || '').trim();
    let initials = `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
    if (!initials) {
      const local = (user.email || '').split('@')[0] || '';
      initials = local.slice(0, 2).toUpperCase() || 'NY';
    }
    const label = first || (user.email || '').split('@')[0] || 'Mon compte';
    return { accountLabel: label, accountInitials: initials };
  }, [user]);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!user) return;
    void hydratePendingPayments();
  }, [user, hydratePendingPayments]);

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 shadow-sm">
      <div className="bg-[#333] text-white text-xs font-medium py-2 px-4 flex justify-between items-center">
        <div className="hidden md:flex gap-4 items-center text-white/90">
          {user ? (
            <>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-medium">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" aria-hidden />
                Connecté
              </span>
              <PendingPaymentsHeaderHint count={pendingPaymentsCount} />
            </>
          ) : null}
        </div>
        <div className="text-center w-full md:w-auto">
          Livraison gratuite pour les commandes de plus de 45000 XOF
        </div>
        <div className="hidden md:flex gap-4 items-center">
          <span className="flex items-center gap-1 cursor-pointer hover:opacity-80">
            EN <Globe className="w-3 h-3" />
          </span>
          <span className="flex items-center gap-1 cursor-pointer hover:opacity-80">
            XOF <Globe className="w-3 h-3" />
          </span>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-3 lg:py-4 flex items-center justify-between gap-4 lg:flex-wrap">
        <Link to="/" className="flex shrink-0 items-center">
          <img src={imgLogo} alt="Secret de Nyra" className="h-9 sm:h-10 lg:h-12 object-contain" />
        </Link>

        <nav className="hidden lg:flex flex-1 items-center justify-center gap-8 font-['Mulish',sans-serif] text-sm font-medium text-black">
          <Link to="/shop/category/secret-de-nyra" className="hover:text-[#a4a374] transition-colors">
            Secret de Nyra
          </Link>
          <Link to="/shop/category/thes-bio" className="hover:text-[#a4a374] transition-colors">
            Thé bio
          </Link>
          <Link to="/shop/category/tisanes" className="hover:text-[#a4a374] transition-colors">
            Tisanes
          </Link>
          <Link to="/shop/category/herboristerie" className="hover:text-[#a4a374] transition-colors">
            Herboristerie
          </Link>
          <Link to="/shop/category/cafes" className="hover:text-[#a4a374] transition-colors">
            Cafés
          </Link>
          <Link to="/shop/category/accessoires" className="hover:text-[#a4a374] transition-colors">
            Accessoires
          </Link>
          <Link to="/shop" className="hover:text-[#a4a374] transition-colors uppercase tracking-wider">
            VOTRE MARQUE
          </Link>
        </nav>

        <div className="flex shrink-0 items-center gap-0.5 text-gray-700 sm:gap-1 lg:gap-2">
          <Link
            to={user ? '/account' : '/login'}
            className="flex p-2 hover:bg-gray-50 rounded-full transition-colors lg:items-center lg:gap-2 lg:py-1 lg:pl-1 lg:pr-2"
            title={user ? 'Mon compte' : 'Connexion'}
            aria-label={user ? `Mon compte (${accountLabel})` : 'Connexion'}
          >
            {user && accountInitials ? (
              <>
                <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white lg:border-0 lg:bg-[#a4a374] lg:text-[11px] lg:font-bold lg:uppercase lg:text-white lg:shadow-sm lg:ring-2 lg:ring-white">
                  <User className="h-5 w-5 text-gray-600 lg:hidden" aria-hidden />
                  <span className="hidden lg:inline">{accountInitials}</span>
                  <span className="absolute -bottom-0.5 -right-0.5 hidden h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500 lg:block" aria-hidden />
                </span>
                <span className="hidden max-w-[10rem] truncate text-sm font-medium text-[#1a1a1a] lg:inline">
                  {accountLabel}
                </span>
              </>
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white">
                <User className="w-5 h-5 text-gray-600" />
              </span>
            )}
          </Link>
          <button
            type="button"
            className="flex p-2 hover:bg-gray-50 rounded-full transition-colors"
            aria-label="Rechercher"
            aria-expanded={searchOpen}
            onClick={() => setSearchOpen(true)}
          >
            <Search className="w-5 h-5" />
          </button>
          <button
            type="button"
            className="flex p-2 hover:bg-gray-50 rounded-full transition-colors lg:hidden"
            aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Link to="/wishlist" className="relative hidden p-2 hover:bg-gray-50 rounded-full transition-colors lg:flex">
            <Heart className="w-5 h-5" />
            {wishCount > 0 && (
              <span className="absolute top-0 right-0 bg-[#a4a374] text-white text-[10px] font-bold min-w-[16px] h-4 px-0.5 flex items-center justify-center rounded-full">
                {wishCount > 99 ? '99+' : wishCount}
              </span>
            )}
          </Link>
          <Link to="/cart" className="relative hidden p-2 hover:bg-gray-50 rounded-full transition-colors lg:flex">
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 bg-[#a4a374] text-white text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      <HeaderSearchPanel open={searchOpen} onClose={() => setSearchOpen(false)} />

      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white nyra-menu-enter">
          <nav className="max-w-[1400px] mx-auto px-4 py-4 flex flex-col gap-1 font-['Mulish',sans-serif]">
            <Link to="/shop/category/secret-de-nyra" className="px-3 py-2 rounded-md hover:bg-gray-50 transition-colors">
              Secret de Nyra
            </Link>
            <Link to="/shop/category/thes-bio" className="px-3 py-2 rounded-md hover:bg-gray-50 transition-colors">
              Thé bio
            </Link>
            <Link to="/shop/category/tisanes" className="px-3 py-2 rounded-md hover:bg-gray-50 transition-colors">
              Tisanes
            </Link>
            <Link to="/shop/category/herboristerie" className="px-3 py-2 rounded-md hover:bg-gray-50 transition-colors">
              Herboristerie
            </Link>
            <Link to="/shop/category/cafes" className="px-3 py-2 rounded-md hover:bg-gray-50 transition-colors">
              Cafés
            </Link>
            <Link to="/shop/category/accessoires" className="px-3 py-2 rounded-md hover:bg-gray-50 transition-colors">
              Accessoires
            </Link>
            <Link to="/shop" className="px-3 py-2 rounded-md hover:bg-gray-50 transition-colors uppercase tracking-wider">
              VOTRE MARQUE
            </Link>
            <div className="mt-3 flex gap-4 border-t border-gray-100 pt-3">
              <Link to="/wishlist" className="relative flex items-center gap-2 text-sm font-medium text-[#1a1a1a] hover:text-[#a4a374]">
                <Heart className="h-5 w-5" />
                Favoris
                {wishCount > 0 ? (
                  <span className="rounded-full bg-[#a4a374] px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {wishCount > 99 ? '99+' : wishCount}
                  </span>
                ) : null}
              </Link>
              <Link to="/cart" className="relative flex items-center gap-2 text-sm font-medium text-[#1a1a1a] hover:text-[#a4a374]">
                <ShoppingBag className="h-5 w-5" />
                Panier
                {cartCount > 0 ? (
                  <span className="rounded-full bg-[#a4a374] px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                ) : null}
              </Link>
            </div>
            {user ? (
              <Link
                to="/account"
                className="mt-2 flex items-center gap-3 border-t border-gray-100 px-3 py-3 text-sm font-medium text-[#1a1a1a] hover:bg-gray-50 rounded-md"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#a4a374] text-xs font-bold uppercase text-white">
                  {accountInitials}
                </span>
                <span className="flex flex-col items-start gap-0.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Connecté</span>
                  <span className="line-clamp-1">Mon compte · {accountLabel}</span>
                </span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="mt-2 border-t border-gray-100 px-3 py-3 text-sm font-medium text-[#a4a374] hover:underline"
              >
                Se connecter
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};
