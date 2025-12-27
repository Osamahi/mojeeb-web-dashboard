import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { localeLoaders, LOCALES } from './locales';
import type { Locale } from './locales';

/**
 * Loads translation file for a given locale with retry logic and error handling.
 *
 * @param lng - The locale to load (e.g., 'en', 'ar-SA', 'ar-EG')
 * @throws Error if all retry attempts fail and fallback to English also fails
 */
export async function loadLanguage(lng: Locale) {
  // Skip if already loaded
  if (i18n.hasResourceBundle(lng, 'translation')) {
    if (import.meta.env.DEV) {
      console.log(`[i18n] Language "${lng}" already loaded, skipping...`);
    }
    return;
  }

  if (import.meta.env.DEV) {
    console.log(`[i18n] Loading language "${lng}"...`);
  }

  const maxRetries = 3;
  let lastError: Error | null = null;

  // Retry logic with exponential backoff
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (import.meta.env.DEV) {
        console.log(`[i18n] Attempt ${attempt}/${maxRetries} to load "${lng}"`);
      }
      const module = await localeLoaders[lng]();
      if (import.meta.env.DEV) {
        console.log(`[i18n] Module loaded for "${lng}":`, module);
      }
      i18n.addResourceBundle(lng, 'translation', module.default, true, true);
      if (import.meta.env.DEV) {
        console.log(`[i18n] Successfully loaded and added resource bundle for "${lng}"`);
      }
      return; // Success - exit function
    } catch (error) {
      lastError = error as Error;
      console.warn(
        `Failed to load locale "${lng}" (attempt ${attempt}/${maxRetries}):`,
        error
      );

      // Wait before retrying (exponential backoff: 1s, 2s, 3s)
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  // All retries failed - try fallback to English
  if (lng !== 'en') {
    console.error(
      `Failed to load locale "${lng}" after ${maxRetries} attempts. Falling back to English.`
    );
    try {
      await loadLanguage('en');
    } catch (fallbackError) {
      console.error('Critical: Failed to load English fallback:', fallbackError);
    }
  }

  throw new Error(`Failed to load locale "${lng}": ${lastError?.message}`);
}

/**
 * Changes the application language asynchronously, ensuring translations are loaded
 * before components re-render. This prevents flash of untranslated content.
 *
 * @param lng - The locale to switch to
 * @throws Error if translation loading fails
 */
export async function changeLanguageAsync(lng: Locale) {
  if (import.meta.env.DEV) {
    console.log(`[i18n] changeLanguageAsync called for "${lng}"`);
    console.log(`[i18n] Current language:`, i18n.language);
  }

  // Load translations first (with retry and error handling)
  await loadLanguage(lng);

  if (import.meta.env.DEV) {
    console.log(`[i18n] Changing language to "${lng}"...`);
  }
  // Change language (triggers component re-renders)
  await i18n.changeLanguage(lng);

  // Persist language preference to localStorage
  localStorage.setItem('i18nextLng', lng);

  if (import.meta.env.DEV) {
    console.log(`[i18n] Language changed to:`, i18n.language);
    console.log(`[i18n] Available languages:`, i18n.languages);
    console.log(`[i18n] Resource bundles:`, Object.keys(i18n.store.data));
  }

  // Update document direction for RTL support
  setDirection(lng);
}

function setDirection(lng: string) {
  const dir = lng.startsWith('ar') ? 'rtl' : 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = lng;
}

i18n
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    lng: 'en', // Set initial language explicitly
    supportedLngs: LOCALES,
    resources: {}, // Empty - loaded dynamically
    interpolation: { escapeValue: false }, // React already escapes
    react: {
      useSuspense: false, // We handle loading state manually in LanguageSwitcher
    },
    // Don't wait for resources to be loaded before init completes
    initImmediate: false,
  });

// Event handler for backward compatibility and direction updates
i18n.on('languageChanged', (lng) => {
  setDirection(lng);
});

export default i18n;
