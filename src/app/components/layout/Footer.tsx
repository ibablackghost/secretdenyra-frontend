import { Link } from 'react-router';
import { Facebook, Twitter, Instagram, Linkedin, MapPin, Phone } from 'lucide-react';
import imgLogo from 'figma:asset/04c30533fe5a9a60b6e7341851231c595d46cb74.png';
import imgCert1 from 'figma:asset/37edb3178166c43c689300d451f4b1e9381b17af.png';
import imgCert2 from 'figma:asset/5f02dc35ba6ffe3d88b6446ffac987c0d52ea530.png';
import imgCert3 from 'figma:asset/7ba5e202df4fb8902ff0161be900d47488ec4518.png';

export const Footer = () => {
  return (
    <footer className="bg-[#edede3] pt-16 pb-8 border-t border-gray-200 mt-20">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Logo & Description */}
          <div className="flex flex-col items-start">
            <img src={imgLogo} alt="Secret de Nyra" className="h-12 object-contain mb-6" />
          </div>

          {/* Links */}
          <div className="flex flex-col gap-3 font-['Mulish',sans-serif] text-sm text-black">
            <Link to="/" className="hover:text-[#a4a374] transition-colors">Secret de Nyra</Link>
            <Link to="/shop" className="hover:text-[#a4a374] transition-colors">Nos thés bio</Link>
            <Link to="/shop" className="hover:text-[#a4a374] transition-colors">Tisanes</Link>
            <Link to="/shop" className="hover:text-[#a4a374] transition-colors">Herboristerie</Link>
            <Link to="/shop" className="hover:text-[#a4a374] transition-colors">Cafés</Link>
            <Link to="/shop" className="hover:text-[#a4a374] transition-colors">Accessoires</Link>
            <Link to="/shop" className="hover:text-[#a4a374] transition-colors uppercase">Votre MARQUE</Link>
            <span className="pt-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Compte</span>
            <Link to="/login" className="hover:text-[#a4a374] transition-colors">Connexion</Link>
            <Link to="/register" className="hover:text-[#a4a374] transition-colors">Créer un compte</Link>
            <Link to="/account" className="hover:text-[#a4a374] transition-colors">Mon compte</Link>
            <Link to="/wishlist" className="hover:text-[#a4a374] transition-colors">Liste de souhaits</Link>
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-4 font-['Mulish',sans-serif] text-sm text-black">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-gray-500" />
              <span>Dakar, Sénégal</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-gray-500" />
              <span>(+221) 33 820 13 13 - (+221) 33 822 54 85</span>
            </div>
          </div>

          {/* Certifications */}
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <img src={imgCert1} alt="Cert 1" className="h-12 object-contain" />
              <img src={imgCert2} alt="Cert 2" className="h-12 object-contain" />
              <img src={imgCert3} alt="Cert 3" className="h-12 object-contain" />
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-300 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-sm text-gray-600">
             <span>United States EN</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500 uppercase tracking-wider">Secured payment</span>
            {/* Payment icons could go here */}
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="p-2 bg-gray-200 rounded-full hover:bg-[#a4a374] hover:text-white transition-colors"><Facebook className="w-4 h-4" /></a>
            <a href="#" className="p-2 bg-gray-200 rounded-full hover:bg-[#a4a374] hover:text-white transition-colors"><Twitter className="w-4 h-4" /></a>
            <a href="#" className="p-2 bg-gray-200 rounded-full hover:bg-[#a4a374] hover:text-white transition-colors"><Instagram className="w-4 h-4" /></a>
            <a href="#" className="p-2 bg-gray-200 rounded-full hover:bg-[#a4a374] hover:text-white transition-colors"><Linkedin className="w-4 h-4" /></a>
          </div>
        </div>
      </div>
    </footer>
  );
};