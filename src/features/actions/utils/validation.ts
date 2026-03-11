/**
 * Validation utilities for action forms
 */

import type { ActionType } from '../types';

/**
 * Action type options for select inputs
 */
export const actionTypeOptions: { label: string; value: ActionType }[] = [
  { label: 'API Call', value: 'api_call' },
  { label: 'Webhook', value: 'webhook' },
  { label: 'Database', value: 'database' },
  { label: 'Email', value: 'email' },
  { label: 'SMS', value: 'sms' },
  { label: 'Integration', value: 'integration' },
];

/**
 * Parse JSON safely, returns null if invalid or not a plain object.
 * Rejects arrays, primitives, and null — only accepts { key: value } objects.
 */
export function parseJsonSafely(str: string): Record<string, any> | null {
  try {
    const parsed = JSON.parse(str);
    // Ensure the result is a plain object (not array, null, or primitive)
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
