/**
 * Auth Header Component
 * Minimal fixed header for authentication pages (login, signup, forgot password)
 * Uses AppLogo for consistent branding
 * Includes language switcher (English ↔ Arabic) or custom action button
 */

import { useState, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLogo } from '@/components/ui/AppLogo';
import { HeaderContainer } from './HeaderContainer';
import { changeLanguageAsync } from '@/i18n/config';
import type { Locale } from '@/i18n/locales';
import { cn } from '@/lib/utils';

interface AuthHeaderProps {
  /** Whether to show the language switcher button (default: true) */
  showLanguageSwitcher?: boolean;
  /** Custom action button to display instead of language switcher */
  actionButton?: ReactNode;
}

export const AuthHeader = ({
  showLanguageSwitcher = true,
  actionButton,
}: AuthHeaderProps = {}) => {
  const { i18n } = useTranslation();
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);

  const toggleLanguage = async () => {
    if (isChangingLanguage) return; // Prevent multiple clicks

    const currentLang = i18n.language;
    const newLang = currentLang.startsWith('ar') ? 'en' : 'ar-SA';

    setIsChangingLanguage(true);
    try {
      await changeLanguageAsync(newLang as Locale);
    } catch (error) {
      console.error('[AuthHeader] Failed to change language:', error);
    } finally {
      setIsChangingLanguage(false);
    }
  };

  const getLanguageLabel = () => {
    return i18n.language.startsWith('ar') ? 'English' : 'العربية';
  };

  return (
    <HeaderContainer className="justify-between">
      {/* Logo */}
      <div className="flex items-center">
        <AppLogo />
      </div>

      {/* Action Area - Language Switcher or Custom Button */}
      {showLanguageSwitcher ? (
        <button
          onClick={toggleLanguage}
          disabled={isChangingLanguage}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium',
            'text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100',
            'transition-colors',
            isChangingLanguage && 'opacity-50 cursor-not-allowed'
          )}
          aria-label="Switch language"
        >
          <span>{getLanguageLabel()}</span>
          {isChangingLanguage && (
            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
          )}
        </button>
      ) : (
        actionButton
      )}
    </HeaderContainer>
  );
};
