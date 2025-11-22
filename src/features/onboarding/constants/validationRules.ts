/**
 * Validation rules for onboarding form inputs
 * Centralized to ensure consistency across all validation logic
 */

export const VALIDATION_RULES = {
  // Agent name validation
  AGENT_NAME_MIN_LENGTH: 2,
  AGENT_NAME_MAX_LENGTH: 50,

  // Phone number validation
  PHONE_MIN_DIGITS: 5,
  PHONE_MAX_DIGITS: 15,
} as const;

export type ValidationRule = typeof VALIDATION_RULES;
