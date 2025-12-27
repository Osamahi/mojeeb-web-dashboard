/**
 * Language Switcher Component
 * Simple, clean language selector for i18n
 * Supports: English, Arabic (Saudi), Arabic (Egypt)
 */

import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { changeLanguageAsync } from '@/i18n/config';
import { isValidLocale } from '@/i18n/locales';
import type { Locale } from '@/i18n/locales';

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'ar-SA', label: 'Arabic (Saudi)', native: 'العربية (السعودية)' },
  { code: 'ar-EG', label: 'Arabic (Egypt)', native: 'العربية (مصر)' },
] as const;

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const handleLanguageChange = useCallback(
    async (languageCode: string) => {
      // Validate locale
      if (!isValidLocale(languageCode)) {
        return;
      }

      if (isLoading) {
        return;
      }

      // Don't reload if already selected
      if (i18n.language === languageCode) {
        return;
      }

      setIsLoading(true);
      try {
        await changeLanguageAsync(languageCode as Locale);
      } catch (error) {
        console.error('[LanguageSwitcher] Failed to change language:', error);
        toast.error(t('language_switcher.error') || 'Failed to change language. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [i18n.language, isLoading, t]
  );

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium text-neutral-700">
        <Globe className="w-4 h-4" />
        {t('language_switcher.label')}
      </label>
      <div className="flex flex-col gap-2">
        {LANGUAGES.map((lang) => (
          <Button
            key={lang.code}
            variant={i18n.language === lang.code ? 'primary' : 'outline'}
            size="sm"
            onClick={() => handleLanguageChange(lang.code)}
            disabled={isLoading}
            className="justify-start"
          >
            <span className="flex items-center gap-2">
              <span>{lang.native}</span>
              {lang.label !== lang.native && (
                <span className="text-xs text-neutral-500">({lang.label})</span>
              )}
              {isLoading && i18n.language !== lang.code && (
                <span className="ml-auto">
                  <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                </span>
              )}
            </span>
          </Button>
        ))}
      </div>

      {/* Current Language Indicator */}
      <div className="mt-4 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
        <p className="text-xs text-neutral-600">
          {t('language_switcher.current')}: <span className="font-medium text-neutral-900">{i18n.language}</span>
        </p>
        <p className="text-xs text-neutral-500 mt-1">
          {t('language_switcher.direction')}: <span className="font-medium">{document.documentElement.dir || 'ltr'}</span>
        </p>
      </div>
    </div>
  );
}

/**
 * Compact Language Switcher (for toolbar/header)
 */
export function CompactLanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = useCallback(
    async (languageCode: string) => {
      if (!isValidLocale(languageCode) || isLoading) return;
      if (i18n.language === languageCode) return;

      setIsLoading(true);
      try {
        await changeLanguageAsync(languageCode as Locale);
      } catch (error) {
        console.error('Failed to change language:', error);
        toast.error(t('language_switcher.error') || 'Failed to change language. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [i18n.language, isLoading, t]
  );

  return (
    <div className="relative">
      <select
        value={i18n.language}
        onChange={(e) => handleChange(e.target.value)}
        disabled={isLoading}
        className="appearance-none bg-white border border-neutral-300 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label={t('language_switcher.select_language')}
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.native}
          </option>
        ))}
      </select>
      <Globe className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
    </div>
  );
}
