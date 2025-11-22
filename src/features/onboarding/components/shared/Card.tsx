/**
 * Card Component
 * Provides consistent card styling across the onboarding feature
 * Replaces duplicate border/background/padding patterns
 */

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Reusable card container with consistent styling
 * White background, neutral border, rounded corners, standard padding
 */
export const Card = ({ children, className = '' }: CardProps) => (
  <div className={`bg-white border border-neutral-200 rounded-xl p-5 ${className}`}>
    {children}
  </div>
);
