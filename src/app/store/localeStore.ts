import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Locale = 'fr' | 'en';

type LocaleState = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
};

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set, get) => ({
      locale: 'fr',
      setLocale: (locale) => {
        set({ locale });
        if (typeof document !== 'undefined') {
          document.documentElement.lang = locale;
        }
      },
      toggleLocale: () => {
        const next = get().locale === 'fr' ? 'en' : 'fr';
        get().setLocale(next);
      },
    }),
    {
      name: 'nyra-locale',
      onRehydrateStorage: () => (state) => {
        if (state?.locale && typeof document !== 'undefined') {
          document.documentElement.lang = state.locale;
        }
      },
    }
  )
);
