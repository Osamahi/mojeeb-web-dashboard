/**
 * Primary Button Component
 * Provides consistent button styling across the onboarding feature
 * Eliminates duplicate disabled/active state styling patterns
 */

import { ReactNode, ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'rounded' | 'pill' | 'fab';

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

/**
 * Reusable primary button with consistent black/grey styling
 * Supports three variants: rounded (default), pill (full-width), and fab (circular)
 */
export const PrimaryButton = ({
  variant = 'rounded',
  disabled,
  className = '',
  children,
  ...props
}: PrimaryButtonProps) => {
  const baseStyles = 'transition-all duration-200 font-medium';

  const disabledStyles = 'bg-neutral-300 text-neutral-500 cursor-not-allowed';
  const activeStyles = 'bg-black text-white hover:bg-neutral-800';

  const variantStyles: Record<ButtonVariant, string> = {
    rounded: 'px-6 py-3 rounded-full',
    pill: 'w-full px-4 py-3 text-sm rounded-xl',
    fab: 'w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center',
  };

  return (
    <button
      {...props}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${
        disabled ? disabledStyles : activeStyles
      } ${className}`.trim()}
    >
      {children}
    </button>
  );
};
