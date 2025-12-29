/**
 * App Logo Component
 * Reusable Mojeeb logo with size variants
 * Single source of truth for branding across all contexts
 */

import { useTranslation } from 'react-i18next';

interface AppLogoProps {
  /** Logo size variant */
  size?: 'default' | 'large';
  /** Additional CSS classes */
  className?: string;
}

export const AppLogo = ({ size = 'default', className }: AppLogoProps) => {
  const { t } = useTranslation();

  const sizeClass = size === 'large' ? 'h-6' : 'h-5';

  return (
    <img
      src="/mojeeb-logo.png"
      alt={t('header.logo_alt')}
      className={className ? `${sizeClass} ${className}` : sizeClass}
    />
  );
};
