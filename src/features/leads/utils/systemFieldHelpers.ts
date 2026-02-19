/**
 * Shared helpers for mapping system field schema keys to values.
 * Two variants:
 *   - getSystemFormFieldValue: Maps field_key → form state (for AddLeadModal/LeadEditMode)
 *   - getSystemFieldValue: Maps field_key → lead entity property (for table/view rendering)
 */

import type { Lead } from '../types/lead.types';

/**
 * Maps a system field_key to the corresponding form state value.
 * Used by schema-driven forms to read the correct state variable for each system field.
 */
export function getSystemFormFieldValue(
  fieldKey: string,
  state: { name: string; phone: string; status: string; notes: string },
): string {
  switch (fieldKey) {
    case 'name': return state.name;
    case 'phone': return state.phone;
    case 'status': return state.status;
    case 'summary': return state.notes;
    default: return '';
  }
}

/**
 * Maps a system field_key to the corresponding lead entity property value.
 * Used by table renderers and view mode to read the correct property from a Lead object.
 */
export function getSystemFieldValue(lead: Lead, fieldKey: string): unknown {
  switch (fieldKey) {
    case 'name': return lead.name;
    case 'phone': return lead.phone;
    case 'summary': return lead.summary;
    case 'status': return lead.status;
    case 'notes': return lead.notes;
    case 'created_at': return lead.createdAt;
    default: return undefined;
  }
}
