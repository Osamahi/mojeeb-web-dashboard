import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { changeLanguageAsync } from '@/i18n/config';
import { isValidLocale, type Locale } from '@/i18n/locales';

/**
 * Hook to detect and apply language preference from URL parameter.
 *
 * Reads the `?lang=` query parameter and applies it if valid.
 * This enables language transfer from landing page to dashboard.
 *
 * @example
 * // In LoginPage or SignUpPage
 * function MyPage() {
 *   useLanguageFromUrl();
 *   // ... rest of component
 * }
 *
 * // User navigates from landing with ?lang=ar-SA
 * // Dashboard will automatically switch to Arabic (Saudi)
 */
export function useLanguageFromUrl() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const langParam = searchParams.get('lang');

    if (!langParam) {
      if (import.meta.env.DEV) {
        console.log('[useLanguageFromUrl] No lang parameter found in URL');
      }
      return;
    }

    // Validate locale
    if (!isValidLocale(langParam)) {
      console.warn(`[useLanguageFromUrl] Invalid locale "${langParam}", ignoring`);
      return;
    }

    const currentLang = localStorage.getItem('i18nextLng');

    // Only change if different from current language
    if (currentLang === langParam) {
      if (import.meta.env.DEV) {
        console.log(`[useLanguageFromUrl] Language already set to "${langParam}", skipping`);
      }
      return;
    }

    if (import.meta.env.DEV) {
      console.log(`[useLanguageFromUrl] Applying language from URL: ${langParam}`);
    }

    // Apply language change
    changeLanguageAsync(langParam as Locale).catch(err => {
      console.error('[useLanguageFromUrl] Failed to change language:', err);
    });
  }, [searchParams]);
}
