import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslations from './locales/en.json';
import arSATranslations from './locales/ar-SA.json';
import arEGTranslations from './locales/ar-EG.json';

// Resources
const resources = {
  en: {
    translation: enTranslations,
  },
  'ar-SA': {
    translation: arSATranslations,
  },
  'ar-EG': {
    translation: arEGTranslations,
  },
};

// Custom language detector - Only use localStorage, ignore browser language
const customLanguageDetector = {
  name: 'mojeebLanguageDetector',
  lookup() {
    // Only check localStorage - if user manually switched language
    const storedLang = localStorage.getItem('i18nextLng');
    if (storedLang) {
      return storedLang;
    }

    // Always return English as default (ignore browser language)
    return 'en';
  },
  cacheUserLanguage(lng: string) {
    localStorage.setItem('i18nextLng', lng);
  },
};

// Initialize i18next
i18n
  .use({
    type: 'languageDetector',
    ...customLanguageDetector,
  })
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    lng: 'en', // Force English as default
    supportedLngs: ['en', 'ar-SA', 'ar-EG'],

    // Only use our custom detector (localStorage only)
    detection: {
      order: ['mojeebLanguageDetector'],
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: false, // React already escapes
    },

    react: {
      useSuspense: false, // Set to true if you want to use Suspense
    },
  });

// RTL/LTR direction management
i18n.on('languageChanged', (lng) => {
  const dir = lng.startsWith('ar') ? 'rtl' : 'ltr';
  document.documentElement.setAttribute('dir', dir);
  document.documentElement.setAttribute('lang', lng);

  // Store metadata
  const metadata = {
    detectionMethod: localStorage.getItem('i18nextLng') ? 'user' : 'browser',
    lastUpdated: new Date().toISOString(),
  };
  localStorage.setItem('mojeeb_locale_metadata', JSON.stringify(metadata));
});

export default i18n;
