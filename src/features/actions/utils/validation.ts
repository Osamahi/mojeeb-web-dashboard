/**
 * Validation utilities for action forms
 */

import { z } from 'zod';
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
];

/**
 * Create action form validation schema
 */
export const createActionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
  description: z.string().min(1, 'Description is required'),
  triggerPrompt: z.string().min(1, 'Trigger prompt is required'),
  actionType: z.enum(['api_call', 'webhook', 'database', 'email', 'sms']),
  actionConfig: z.record(z.any()).refine((val) => Object.keys(val).length > 0, {
    message: 'Action configuration is required',
  }),
  requestExample: z.record(z.any()).optional(),
  responseExample: z.record(z.any()).optional(),
  responseMapping: z.record(z.any()).optional(),
  testData: z.record(z.any()).optional(),
  sandboxOptions: z.record(z.any()).optional(),
  isActive: z.boolean(),
  priority: z.number().int().min(0).max(1000),
});

/**
 * Update action form validation schema (all fields optional)
 */
export const updateActionSchema = createActionSchema.partial();

/**
 * Validate JSON string
 */
export function isValidJson(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse JSON safely
 */
export function parseJsonSafely(str: string): Record<string, any> | null {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

/**
 * Validate priority range
 */
export function isValidPriority(priority: number): boolean {
  return Number.isInteger(priority) && priority >= 0 && priority <= 1000;
}
