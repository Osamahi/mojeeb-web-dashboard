/**
 * App Logo Component
 * Language-aware Mojeeb logo with size variants
 * Automatically switches between Arabic and English logos based on i18n language
 * Single source of truth for branding across all contexts
 */

import { memo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface AppLogoProps {
  /** Logo size variant */
  size?: 'default' | 'large';
  /** Additional CSS classes */
  className?: string;
  /** Whether the logo should be clickable and navigate to home page */
  clickable?: boolean;
}

export const AppLogo = memo(({ size = 'default', className, clickable = true }: AppLogoProps) => {
  const { t, i18n } = useTranslation();

  const sizeClass = size === 'large' ? 'h-6' : 'h-5';
  const combinedClassName = className ? `${sizeClass} ${className}` : sizeClass;

  // Determine logo source based on current language
  // Arabic locales (ar-SA, ar-EG) use Arabic logo, others use English
  const logoSrc = i18n.language.startsWith('ar')
    ? '/mojeeb-logo-ar.svg'
    : '/mojeeb-logo-en.svg';

  const logoImage = (
    <img
      src={logoSrc}
      alt={t('header.logo_alt')}
      className={combinedClassName}
    />
  );

  // Wrap in Link if clickable
  if (clickable) {
    return (
      <Link
        to="/"
        className="inline-block"
        aria-label={t('common.navigate_home')}
      >
        {logoImage}
      </Link>
    );
  }

  return logoImage;
});

AppLogo.displayName = 'AppLogo';
