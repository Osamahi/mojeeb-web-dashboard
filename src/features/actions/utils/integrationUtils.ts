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
  targetSheetId: 0,
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

// ─── Paired action helpers ───────────────────────────────────────────────────
//
// When a user enables `update_row` or `read_row` on a connection that already
// has an `add_row` action (or any sibling), we create a new action by cloning
// the sibling's full payload and swapping only `action_config.operation` +
// `triggerPrompt`. This keeps target_tab / target_sheet_id / column_mapping
// in sync across the trio without the frontend needing to know what those
// fields are — it just copies the whole blob.
//
// Same pattern is used in CreateActionModal's "Allow edit / Allow read"
// checkbox flow. Extracted here so Create + Edit modals share one source of
// truth for what "paired action" means.

/**
 * Map from operation id → suffix appended to the base action's name.
 * Kept connector-agnostic: callers pass the base name, this just adds the
 * "(update)" / "(read)" tag the user already sees in the actions list.
 */
const OPERATION_NAME_SUFFIX: Record<string, string> = {
  add_row:    '',
  update_row: ' (update)',
  read_row:   ' (read)',
  // Future ops follow the same pattern — add an entry when the op ships.
};

export type ActionLike = {
  id: string;
  agentId: string;
  name: string;
  description: string | null;
  triggerPrompt: string;
  actionType: 'api_call' | 'webhook' | 'integration';
  actionConfig: Record<string, any>;
  integrationConnectionId: string | null;
  isActive: boolean;
  priority: number;
};

/**
 * Strip any existing operation suffix from a name so we can re-derive it cleanly.
 * Example: "Save to leads (update)" → "Save to leads".
 */
function stripOperationSuffix(name: string): string {
  return name.replace(/\s*\((update|read)\)\s*$/i, '').trim();
}

/**
 * Builds a CreateAction request payload for a paired operation by cloning a
 * sibling action. Used by both the Create modal (when "Allow edit/read" is
 * checked at creation time) and the Edit modal (when a user toggles an op ON).
 *
 * The returned payload is ready to POST to /api/actions. Caller decides whether
 * to fire it (no side effects here).
 *
 * @param sibling      Any existing action on the same connection. Its
 *                     actionConfig is cloned wholesale (connector-agnostic).
 * @param targetOp     The op id to enable (e.g. "update_row").
 * @param triggerPrompt The user-supplied trigger prompt for the new action.
 */
export function buildPairedActionRequest(
  sibling: ActionLike,
  targetOp: string,
  triggerPrompt: string
): {
  agentId: string;
  name: string;
  description: string;
  triggerPrompt: string;
  actionType: 'integration';
  actionConfig: Record<string, any>;
  isActive: boolean;
  priority: number;
  integrationConnectionId: string;
} {
  const baseName = stripOperationSuffix(sibling.name);
  const suffix = OPERATION_NAME_SUFFIX[targetOp] ?? ` (${targetOp})`;

  return {
    agentId: sibling.agentId,
    name: `${baseName}${suffix}`,
    description:
      targetOp === 'update_row'
        ? `Update an existing row previously created via "${baseName}". Mutates only the fields the customer asks to change.`
        : targetOp === 'read_row'
        ? `Read the current values of a row previously created via "${baseName}". Used to recap or confirm details with the customer.`
        : sibling.description ?? '',
    triggerPrompt,
    actionType: 'integration',
    // Spread the sibling's full action_config wholesale, then override only
    // the operation discriminator. Connector-agnostic by design — works for
    // Sheets (target_tab, column_mapping) just as it would for Calendar
    // (calendar_id) or Notion (database_id) since we never name the fields.
    actionConfig: { ...sibling.actionConfig, operation: targetOp },
    isActive: true,
    priority: sibling.priority,
    integrationConnectionId: sibling.integrationConnectionId!,
  };
}
