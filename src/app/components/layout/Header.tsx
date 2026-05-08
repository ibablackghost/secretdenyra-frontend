import { FormEvent, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { ShoppingBag, Search, User, Globe, Heart, Menu, X } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { useWishlistStore } from '../../store/wishlistStore';
import imgLogo from 'figma:asset/04c30533fe5a9a60b6e7341851231c595d46cb74.png';

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const cartItems = useCartStore((state) => state.items);
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const user = useAuthStore((s) => s.user);
  const wishCount = useWishlistStore((s) => s.ids.length);

  const [headerQ, setHeaderQ] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q') ?? '';
    if (location.pathname === '/shop') setHeaderQ(q);
  }, [location.pathname, location.search]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  const runSearch = (e?: FormEvent) => {
    e?.preventDefault();
    const q = headerQ.trim();
    if (q) navigate(`/shop?q=${encodeURIComponent(q)}`);
    else navigate('/shop');
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 shadow-sm">
      <div className="bg-[#333] text-white text-xs font-medium py-2 px-4 flex justify-between items-center">
        <div className="hidden md:flex gap-4" />
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

      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
        <Link to="/" className="flex items-center shrink-0">
          <img src={imgLogo} alt="Secret de Nyra" className="h-8 md:h-12 object-contain" />
        </Link>

        <nav className="hidden lg:flex items-center gap-8 font-['Mulish',sans-serif] text-sm font-medium text-black flex-1 justify-center">
          <Link to="/shop/category/secret-de-nyra" className="hover:text-[#a4a374] transition-colors">
            Secret de Nyra
          </Link>
          <Link to="/shop/category/nos-thes-bio" className="hover:text-[#a4a374] transition-colors">
            Nos thés bio
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

        <div className="flex items-center gap-2 sm:gap-4 text-gray-700 shrink-0">
          <Link
            to={user ? '/account' : '/login'}
            className="flex p-2 hover:bg-gray-50 rounded-full transition-colors"
            title={user ? 'Mon compte' : 'Connexion'}
          >
            <User className="w-5 h-5" />
          </Link>
          <Link to="/wishlist" className="relative flex p-2 hover:bg-gray-50 rounded-full transition-colors">
            <Heart className="w-5 h-5" />
            {wishCount > 0 && (
              <span className="absolute top-0 right-0 bg-[#a4a374] text-white text-[10px] font-bold min-w-[16px] h-4 px-0.5 flex items-center justify-center rounded-full">
                {wishCount > 99 ? '99+' : wishCount}
              </span>
            )}
          </Link>
          <Link to="/cart" className="p-2 hover:bg-gray-50 rounded-full transition-colors relative">
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 bg-[#a4a374] text-white text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>
          <button
            type="button"
            className="lg:hidden flex p-2 hover:bg-gray-50 rounded-full transition-colors"
            aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white nyra-menu-enter">
          <nav className="max-w-[1400px] mx-auto px-4 py-4 flex flex-col gap-1 font-['Mulish',sans-serif]">
            <Link to="/shop/category/secret-de-nyra" className="px-3 py-2 rounded-md hover:bg-gray-50 transition-colors">
              Secret de Nyra
            </Link>
            <Link to="/shop/category/nos-thes-bio" className="px-3 py-2 rounded-md hover:bg-gray-50 transition-colors">
              Nos thés bio
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
          </nav>
        </div>
      )}

      <div className="border-t border-gray-50 bg-[#fafafa]">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-3">
          <form onSubmit={runSearch} className="flex gap-2 w-full">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="search"
                value={headerQ}
                onChange={(e) => setHeaderQ(e.target.value)}
                placeholder="Rechercher un thé, une infusion, un ingrédient…"
                className="w-full rounded-full border border-gray-200 bg-white py-3 pl-11 pr-4 font-['Mulish',sans-serif] text-sm text-[#1a1a1a] placeholder:text-gray-400 outline-none focus:border-[#a4a374] focus:ring-2 focus:ring-[#a4a374]/20"
                aria-label="Recherche produits"
              />
            </div>
            <button
              type="submit"
              className="shrink-0 rounded-full bg-[#1a1a1a] px-6 py-3 font-['Mulish',sans-serif] text-sm font-semibold text-white hover:bg-[#303030] transition-colors"
            >
              Rechercher
            </button>
          </form>
        </div>
      </div>
    </header>
  );
};
