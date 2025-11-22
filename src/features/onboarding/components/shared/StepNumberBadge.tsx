/**
 * Step Number Badge Component
 * Displays numbered badges for steps in the onboarding process
 * Eliminates 40+ lines of duplicate badge code in StepSuccess.tsx
 */

import React from 'react';

interface StepNumberBadgeProps {
  number: number;
}

/**
 * Circular badge displaying a step number
 * Used in both progress steps and next steps sections
 */
export const StepNumberBadge = ({ number }: StepNumberBadgeProps) => (
  <span className="w-5 h-5 rounded-full bg-neutral-100 flex items-center justify-center text-xs text-neutral-500">
    {number}
  </span>
);
