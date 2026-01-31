/**
 * Validation utilities for lead fields
 *
 * IMPORTANT: Frontend validation provides immediate UX feedback only.
 * Backend performs authoritative validation.
 * Keep validation rules synchronized with: MojeebBackEnd/Services/Leads/Domain/Services/LeadValidationService.cs
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates lead name
 * - Required field
 * - Must have at least 1 character (after trimming)
 */
export const validateName = (name: string): ValidationResult => {
  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return {
      valid: false,
      error: 'Name is required',
    };
  }

  if (trimmed.length > 100) {
    return {
      valid: false,
      error: 'Name must be less than 100 characters',
    };
  }

  return { valid: true };
};

/**
 * Validates phone number
 * - Optional field (can be empty)
 * - If provided, must match basic phone format
 * - Allows international format with +
 */
export const validatePhone = (phone: string): ValidationResult => {
  const trimmed = phone.trim();

  // Phone is optional
  if (trimmed.length === 0) {
    return { valid: true };
  }

  // Basic phone validation: allow digits, spaces, +, -, (, )
  const phoneRegex = /^[\d\s\-+()]+$/;
  if (!phoneRegex.test(trimmed)) {
    return {
      valid: false,
      error: 'Phone number can only contain digits, spaces, and + - ( )',
    };
  }

  // Check minimum length (at least 7 digits for shortest valid phone)
  const digitsOnly = trimmed.replace(/\D/g, '');
  if (digitsOnly.length < 7) {
    return {
      valid: false,
      error: 'Phone number must have at least 7 digits',
    };
  }

  if (digitsOnly.length > 15) {
    return {
      valid: false,
      error: 'Phone number must have at most 15 digits',
    };
  }

  return { valid: true };
};
