/**
 * Centralized Authentication Validation Schemas
 *
 * Reusable Zod validation schemas for authentication forms.
 * Eliminates duplication across Login/SignUp/ForgotPassword pages.
 *
 * @module auth/schemas/validation
 */

import { z } from 'zod';
import type { TFunction } from 'i18next';

/**
 * Reusable email field validator
 * Used across all auth forms
 */
export const emailField = (t: TFunction) =>
  z.string().email(t('auth.email_invalid'));

/**
 * Reusable password field validator
 *
 * @param t - Translation function
 * @param minLength - Minimum password length (default: 8)
 */
export const passwordField = (t: TFunction, minLength: number = 8) =>
  z.string()
    .min(minLength, t('auth.password_min_length', { min: minLength }))
    .max(100, t('auth.password_max_length', { max: 100 }));

/**
 * Reusable name field validator
 * Used in signup and profile forms
 */
export const nameField = (t: TFunction) =>
  z.string().min(2, t('auth.name_min_length', { min: 2 }));

/**
 * Login form validation schema
 *
 * @param t - Translation function
 * @returns Zod schema for login form
 */
export const createLoginSchema = (t: TFunction) => z.object({
  email: emailField(t),
  password: passwordField(t, 6), // Login uses min 6 for legacy compatibility
});

/**
 * Sign up form validation schema
 *
 * @param t - Translation function
 * @returns Zod schema for signup form
 */
export const createSignUpSchema = (t: TFunction) => z.object({
  name: nameField(t),
  email: emailField(t),
  password: passwordField(t, 8), // SignUp enforces min 8
});

/**
 * Forgot password form validation schema
 *
 * @param t - Translation function
 * @returns Zod schema for forgot password form
 */
export const createForgotPasswordSchema = (t: TFunction) => z.object({
  email: emailField(t),
});

/**
 * Reset password form validation schema
 * Token comes from URL — only password fields are user input.
 */
export const createResetPasswordSchema = (t: TFunction) =>
  z
    .object({
      newPassword: passwordField(t),
      confirmPassword: z.string().min(1, t('auth.confirm_password_required')),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t('auth.passwords_do_not_match'),
      path: ['confirmPassword'],
    });

/**
 * TypeScript types for form data
 */
export type LoginFormData = z.infer<ReturnType<typeof createLoginSchema>>;
export type SignUpFormData = z.infer<ReturnType<typeof createSignUpSchema>>;
export type ForgotPasswordFormData = z.infer<ReturnType<typeof createForgotPasswordSchema>>;
export type ResetPasswordFormData = z.infer<ReturnType<typeof createResetPasswordSchema>>;
