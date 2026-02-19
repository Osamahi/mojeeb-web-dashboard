/**
 * Shared helpers for mapping system field schema keys to form state values.
 * Eliminates duplication between AddLeadModal and LeadEditMode.
 */

/**
 * Maps a system field_key to the corresponding form state value.
 * Used by schema-driven forms to read the correct state variable for each system field.
 */
export function getSystemFormFieldValue(
  fieldKey: string,
  state: { name: string; phone: string; status: string; notes: string },
): any {
  switch (fieldKey) {
    case 'name': return state.name;
    case 'phone': return state.phone;
    case 'status': return state.status;
    case 'summary': return state.notes;
    default: return '';
  }
}
