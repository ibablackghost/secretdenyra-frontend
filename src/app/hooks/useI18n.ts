import { useCallback } from 'react';
import { translate, type TranslationKey } from '../i18n/messages';
import { useLocaleStore, type Locale } from '../store/localeStore';

export function useI18n() {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const toggleLocale = useLocaleStore((s) => s.toggleLocale);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => translate(locale, key, vars),
    [locale]
  );

  return { locale, setLocale, toggleLocale, t } as {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    toggleLocale: () => void;
    t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  };
}
