/**
 * Shared Step Heading Components
 * Provides consistent heading and subtitle styling across all onboarding steps
 * Eliminates 24 lines of duplicate code across 4 step components
 */

import { ReactNode } from 'react';

interface StepHeadingProps {
  children: ReactNode;
}

/**
 * Main heading for onboarding steps
 * Mobile-first responsive design (3xl on mobile, 4xl on desktop)
 */
export const StepHeading = ({ children }: StepHeadingProps) => (
  <h1 className="text-3xl sm:text-4xl font-bold text-neutral-950 mb-2 tracking-tight">
    {children}
  </h1>
);

/**
 * Subtitle for onboarding steps
 * Provides context and instructions below the main heading
 */
export const StepSubtitle = ({ children }: StepHeadingProps) => (
  <p className="text-sm sm:text-base text-neutral-600 mb-6">
    {children}
  </p>
);
