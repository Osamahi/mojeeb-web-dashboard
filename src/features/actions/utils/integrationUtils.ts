/**
 * Shared utilities for integration action forms.
 * Extracted to eliminate duplication between CreateActionModal and EditActionModal.
 */

import type { IntegrationConfigValue } from '../components/IntegrationActionConfig';
import { parseJsonSafely } from './validation';

// ─── Shared Types ─────────────────────────────────────────────

export type ActionFormData = {
  name: string;
  description: string;
  triggerPrompt: string;
  actionType: 'api_call' | 'webhook' | 'database' | 'email' | 'sms' | 'integration';
  actionConfigJson: string;
  requestExampleJson?: string;
  responseExampleJson?: string;
  responseMappingJson?: string;
  testDataJson?: string;
  sandboxOptionsJson?: string;
  isActive: boolean;
  priority: number;
};

// ─── Shared Constants ─────────────────────────────────────────

export const defaultIntegrationConfig: IntegrationConfigValue = {
  targetTab: '',
  columnMapping: [],
};

// ─── Shared Utilities ─────────────────────────────────────────

/**
 * Converts a sheet header (Arabic or Latin) into a safe variable name.
 * Unicode-aware: preserves Arabic, Latin, digits.
 */
export function headerToVariableName(header: string): string {
  return header
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_]/gu, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Validates optional JSON fields in the action form.
 * Returns parsed values and any validation errors.
 */
export function validateOptionalJsonFields(data: ActionFormData) {
  const errors: Record<string, string> = {};

  const fields = [
    { key: 'requestExample', value: data.requestExampleJson },
    { key: 'responseExample', value: data.responseExampleJson },
    { key: 'responseMapping', value: data.responseMappingJson },
    { key: 'testData', value: data.testDataJson },
    { key: 'sandboxOptions', value: data.sandboxOptionsJson },
  ] as const;

  const parsed: Record<string, Record<string, any> | undefined> = {};

  for (const { key, value } of fields) {
    if (value) {
      const result = parseJsonSafely(value);
      if (!result) {
        errors[key] = 'Invalid JSON format';
      } else {
        parsed[key] = result;
      }
    }
  }

  return { errors, parsed };
}

/**
 * Validates integration config (connection, tab, column mapping).
 * connectionId is now a separate top-level FK column, not part of IntegrationConfigValue.
 */
export function validateIntegrationConfig(
  integrationConfig: IntegrationConfigValue,
  connectionId: string
): string | null {
  if (!connectionId) {
    return 'Please select a Google Sheets connection';
  }
  if (!integrationConfig.targetTab) {
    return 'Please select a sheet tab';
  }
  if (integrationConfig.columnMapping.filter(c => c.enabled).length === 0) {
    return 'At least one column mapping is required';
  }
  return null;
}
