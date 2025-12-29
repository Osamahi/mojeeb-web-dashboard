/**
 * App Logo Component
 * Language-aware Mojeeb logo with size variants and responsive mark/full logo
 * - Mobile (< 768px): Shows compact mark (icon only)
 * - Desktop (≥ 768px): Shows full logo with language detection
 * - Smooth animations on language switch and screen resize
 * Single source of truth for branding across all contexts
 */

import { memo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/useMediaQuery';

interface AppLogoProps {
  /** Logo size variant */
  size?: 'default' | 'large';
  /** Additional CSS classes */
  className?: string;
  /** Whether the logo should be clickable and navigate to home page */
  clickable?: boolean;
  /** Logo variant: 'auto' (default) detects mobile, 'full' always shows full logo, 'mark' always shows mark */
  variant?: 'auto' | 'full' | 'mark';
}

export const AppLogo = memo(({
  size = 'default',
  className,
  clickable = true,
  variant = 'auto'
}: AppLogoProps) => {
  const { t, i18n } = useTranslation();
  const isMobile = useIsMobile();

  const sizeClass = size === 'large' ? 'h-6' : 'h-5';
  const combinedClassName = className ? `${sizeClass} ${className}` : sizeClass;

  // Determine which logo to show
  const shouldShowMark = variant === 'mark' || (variant === 'auto' && isMobile);

  // Determine logo source
  let logoSrc: string;
  if (shouldShowMark) {
    // Show compact mark (language-neutral icon)
    logoSrc = '/mojeeb-mark.svg';
  } else {
    // Show full logo with language detection
    // Arabic locales (ar-SA, ar-EG) use Arabic logo, others use English
    logoSrc = i18n.language.startsWith('ar')
      ? '/mojeeb-logo-ar.svg'
      : '/mojeeb-logo-en.svg';
  }

  // Animation variants for smooth transitions
  const logoVariants = {
    initial: {
      opacity: 0,
      scale: 0.95,
    },
    animate: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.2,
        ease: 'easeOut',
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: 0.15,
        ease: 'easeIn',
      },
    },
  };

  const logoImage = (
    <AnimatePresence mode="wait" initial={false}>
      <motion.img
        key={logoSrc} // Key changes when logo changes, triggering animation
        src={logoSrc}
        alt={t('header.logo_alt')}
        className={combinedClassName}
        variants={logoVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      />
    </AnimatePresence>
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
