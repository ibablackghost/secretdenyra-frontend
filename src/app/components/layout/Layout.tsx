import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { useCartCatalogSync } from '@/app/hooks/useCartCatalogSync';
import { Header } from './Header';
import { Footer } from './Footer';
import { ToastViewport } from '../ui/ToastViewport';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
};

export const Layout = () => {
  useCartCatalogSync();

  return (
    <div className="min-h-screen flex flex-col font-['Mulish',sans-serif] bg-[#fafafa] text-[#131313]">
      <ScrollToTop />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[80] rounded bg-black px-4 py-2 text-sm font-semibold text-white"
      >
        Aller au contenu principal
      </a>
      <Header />
      <main id="main-content" className="flex-1 w-full">
        <Outlet />
      </main>
      <Footer />
      <ToastViewport />
    </div>
  );
};