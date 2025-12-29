/**
 * Header Container Component
 * Reusable navigation header wrapper with consistent styling
 * Single source of truth for all top navigation header variants (auth, dashboard)
 *
 * Note: This is different from BaseHeader (page header component for titles/actions)
 */

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface HeaderContainerProps {
  /** Header content */
  children: ReactNode;
  /** Additional CSS classes for variant-specific styling */
  className?: string;
}

export const HeaderContainer = ({ children, className }: HeaderContainerProps) => {
  return (
    <header
      className={cn(
        // Fixed positioning
        'fixed top-0 start-0 end-0',
        // Dimensions
        'h-16',
        // Styling
        'bg-white border-b border-neutral-200',
        // Layout
        'flex items-center px-4',
        // Z-index
        'z-30',
        // Variant-specific overrides
        className
      )}
    >
      {children}
    </header>
  );
};
