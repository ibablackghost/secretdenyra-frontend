import { Link } from 'react-router';
import { ShoppingBag, Search, User, Globe, Heart } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import imgLogo from 'figma:asset/04c30533fe5a9a60b6e7341851231c595d46cb74.png';

export const Header = () => {
  const cartItems = useCartStore((state) => state.items);
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 shadow-sm">
      {/* Top Banner */}
      <div className="bg-[#333] text-white text-xs font-medium py-2 px-4 flex justify-between items-center">
        <div className="hidden md:flex gap-4">
          {/* We could place Language / Currency here, as per design */}
        </div>
        <div className="text-center w-full md:w-auto">
          Livraison gratuite pour les commandes de plus de 45000 XOF
        </div>
        <div className="hidden md:flex gap-4 items-center">
          <span className="flex items-center gap-1 cursor-pointer hover:opacity-80">EN <Globe className="w-3 h-3" /></span>
          <span className="flex items-center gap-1 cursor-pointer hover:opacity-80">XOF <Globe className="w-3 h-3" /></span>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <img src={imgLogo} alt="Secret de Nyra" className="h-8 md:h-12 object-contain" />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-8 font-['Mulish',sans-serif] text-sm font-medium text-black">
          <Link to="/" className="hover:text-[#a4a374] transition-colors">Secret de Nyra</Link>
          <Link to="/shop?category=nos-thes-bio" className="hover:text-[#a4a374] transition-colors">Nos thés bio</Link>
          <Link to="/shop?category=tisanes" className="hover:text-[#a4a374] transition-colors">Tisanes</Link>
          <Link to="/shop?category=herboristerie" className="hover:text-[#a4a374] transition-colors">Herboristerie</Link>
          <Link to="/shop?category=cafes" className="hover:text-[#a4a374] transition-colors">Cafés</Link>
          <Link to="/shop?category=accessoires" className="hover:text-[#a4a374] transition-colors">Accessoires</Link>
          <Link to="/shop" className="hover:text-[#a4a374] transition-colors uppercase tracking-wider">VOTRE MARQUE</Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-4 text-gray-700">
          <button className="p-2 hover:bg-gray-50 rounded-full transition-colors"><Search className="w-5 h-5" /></button>
          <button className="p-2 hover:bg-gray-50 rounded-full transition-colors hidden sm:block"><Heart className="w-5 h-5" /></button>
          <button className="p-2 hover:bg-gray-50 rounded-full transition-colors hidden sm:block"><User className="w-5 h-5" /></button>
          <Link to="/cart" className="p-2 hover:bg-gray-50 rounded-full transition-colors relative">
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 bg-[#a4a374] text-white text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
};