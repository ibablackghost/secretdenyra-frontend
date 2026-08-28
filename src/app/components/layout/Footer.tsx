import { Link } from 'react-router';
import { Facebook, Instagram, MapPin, Phone } from 'lucide-react';
import { SOCIAL_LINKS } from '../../data/socialLinks';
import { useI18n } from '../../hooks/useI18n';
import imgLogo from 'figma:asset/04c30533fe5a9a60b6e7341851231c595d46cb74.png';
import imgCert1 from 'figma:asset/37edb3178166c43c689300d451f4b1e9381b17af.png';
import imgCert2 from 'figma:asset/5f02dc35ba6ffe3d88b6446ffac987c0d52ea530.png';
import imgCert3 from 'figma:asset/7ba5e202df4fb8902ff0161be900d47488ec4518.png';

export const Footer = () => {
  const { t } = useI18n();

  return (
    <footer className="bg-[#edede3] pt-16 pb-8 border-t border-gray-200">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="flex flex-col items-start">
            <img src={imgLogo} alt="Secret de Nyra" className="h-12 object-contain mb-6" />
          </div>

          <div className="flex flex-col gap-3 font-['Mulish',sans-serif] text-sm text-black">
            <Link to="/" className="hover:text-[#a4a374] transition-colors">
              {t('nav.secret')}
            </Link>
            <Link to="/shop/category/thes-bio" className="hover:text-[#a4a374] transition-colors">
              {t('nav.teaBio')}
            </Link>
            <Link to="/shop" className="hover:text-[#a4a374] transition-colors">
              {t('nav.tisanes')}
            </Link>
            <Link to="/shop" className="hover:text-[#a4a374] transition-colors">
              {t('nav.herboristerie')}
            </Link>
            <Link to="/shop/category/cafes" className="hover:text-[#a4a374] transition-colors">
              {t('nav.cafes')}
            </Link>
            <Link to="/shop" className="hover:text-[#a4a374] transition-colors">
              {t('nav.accessoires')}
            </Link>
            <Link to="/shop" className="hover:text-[#a4a374] transition-colors uppercase">
              {t('nav.brand')}
            </Link>
            <span className="pt-2 text-xs font-semibold uppercase tracking-wide text-gray-500">{t('footer.account')}</span>
            <Link to="/login" className="hover:text-[#a4a374] transition-colors">
              {t('nav.login')}
            </Link>
            <Link to="/register" className="hover:text-[#a4a374] transition-colors">
              {t('nav.register')}
            </Link>
            <Link to="/account" className="hover:text-[#a4a374] transition-colors">
              {t('nav.account')}
            </Link>
            <Link to="/wishlist" className="hover:text-[#a4a374] transition-colors">
              {t('nav.wishlist')}
            </Link>
          </div>

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

          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <img src={imgCert1} alt="Cert 1" className="h-12 object-contain" />
              <img src={imgCert2} alt="Cert 2" className="h-12 object-contain" />
              <img src={imgCert3} alt="Cert 3" className="h-12 object-contain" />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-300 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>{t('footer.localeLabel')}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500 uppercase tracking-wider">{t('footer.secured')}</span>
          </div>
          <div className="flex items-center gap-3">
            {SOCIAL_LINKS.map((link) => (
              <a
                key={link.id}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-gray-200 rounded-full hover:bg-[#a4a374] hover:text-white transition-colors"
                aria-label={`${link.label} — ${link.handle}`}
              >
                {link.id === 'tiktok' ? (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
                  </svg>
                ) : link.id === 'instagram' ? (
                  <Instagram className="w-4 h-4" />
                ) : (
                  <Facebook className="w-4 h-4" />
                )}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
