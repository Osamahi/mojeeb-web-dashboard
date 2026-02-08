/**
 * TypeScript types for Add-Ons feature
 */

export type AddonType = 'message_credits' | 'agent_slots';

/**
 * Add-on plan definition from backend
 */
export interface AddonPlan {
  id: string;
  code: string;
  name: string;
  description?: string;
  addon_type: AddonType;
  quantity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Add-on operation (audit log entry)
 */
export interface AddonOperation {
  id: string;
  organization_id: string;
  organization_name: string;
  addon_plan_code: string;
  addon_name: string;
  addon_type: AddonType;
  quantity_granted: number;
  granted_by_user_id: string;
  granted_by_user_email: string;
  granted_at: string;
  notes?: string;
}

/**
 * Request to grant an add-on to an organization
 */
export interface GrantAddonRequest {
  organization_id: string;
  addon_code: string;
  notes?: string;
}

/**
 * Result of granting an add-on
 */
export interface GrantAddonResult {
  success: boolean;
  message: string;
  operation?: AddonOperation;
  new_message_limit: number;
  new_agent_limit: number;
}

/**
 * Query filters for fetching add-on operations
 */
export interface AddonOperationsFilters {
  page?: number;
  page_size?: number;
  organization_id?: string;
  addon_type?: AddonType;
  start_date?: string;
}
