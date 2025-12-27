/**
 * Language Switcher Component
 * Simple, clean language selector for i18n
 * Supports: English, Arabic (Saudi), Arabic (Egypt)
 */

import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'ar-SA', label: 'Arabic (Saudi)', native: 'العربية (السعودية)' },
  { code: 'ar-EG', label: 'Arabic (Egypt)', native: 'العربية (مصر)' },
] as const;

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
  };

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
            className="justify-start"
          >
            <span className="flex items-center gap-2">
              <span>{lang.native}</span>
              {lang.label !== lang.native && (
                <span className="text-xs text-neutral-500">({lang.label})</span>
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

  const currentLang = LANGUAGES.find(lang => lang.code === i18n.language) || LANGUAGES[0];

  return (
    <div className="relative">
      <select
        value={i18n.language}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        className="appearance-none bg-white border border-neutral-300 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
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
