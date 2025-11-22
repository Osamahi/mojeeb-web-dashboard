/**
 * Animation and API timing constants for onboarding flow
 * Centralized to ensure consistency and easy adjustment
 */

export const ANIMATION_TIMINGS = {
  // Agent creation animation delays (milliseconds)
  AGENT_SUCCESS_DELAY: 600,
  KB_LOADING_DELAY: 600,
  KB_SUCCESS_DELAY: 600,
  READY_TRANSITION: 600,

  // Confetti animation
  CONFETTI_DURATION: 1500,

  // Next steps reveal animation (staggered)
  NEXT_STEP_STAGGER: 500,
  NEXT_STEP_OFFSET_1: 500,
  NEXT_STEP_OFFSET_2: 1000,
  NEXT_STEP_OFFSET_3: 1500,

  // API timeout
  API_TIMEOUT: 10000, // 10 seconds
} as const;

export type AnimationTiming = typeof ANIMATION_TIMINGS;
