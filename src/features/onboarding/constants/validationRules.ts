/**
 * Validation rules for onboarding form inputs
 * Centralized to ensure consistency across all validation logic
 */

export const VALIDATION_RULES = {
  // Agent name validation
  AGENT_NAME_MIN_LENGTH: 2,

  // Phone number validation
  PHONE_MIN_DIGITS: 5,
} as const;
