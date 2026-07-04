import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import ar from './locales/ar.json';

// Initialize i18n synchronously without React binding at module level
const i18nInstance = i18n.createInstance();

i18nInstance
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar }
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    detection: {
      // querystring first so hreflang alternates (?lng=ar) actually switch
      // the language for crawlers and shared links.
      order: ['querystring', 'localStorage', 'navigator'],
      lookupQuerystring: 'lng',
      caches: ['localStorage']
    },
    react: {
      useSuspense: false
    }
  });

export default i18nInstance;
