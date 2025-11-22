/**
 * Next Step Item Component
 * Displays animated "Next Steps" items in the success screen
 * Eliminates 50+ lines of duplicate animation pattern code
 */

import React from 'react';
import { StepNumberBadge } from './StepNumberBadge';

interface NextStepItemProps {
  stepNumber: number;
  icon: string;
  text: string;
  isVisible: boolean;
}

/**
 * Animated list item for "Next Steps" section
 * Features staggered reveal animation with smooth transitions
 */
export const NextStepItem = ({ stepNumber, icon, text, isVisible }: NextStepItemProps) => (
  <li
    className={`flex items-center gap-3 text-sm text-neutral-600 transition-all duration-[600ms] ${
      isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-3 scale-95'
    }`}
    style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
  >
    <StepNumberBadge number={stepNumber} />
    {icon} {text}
  </li>
);
