/**
 * User types for user management
 * Backend returns snake_case, so we match that here
 */

export type Role = 'SuperAdmin' | 'Admin' | 'Customer' | 'AiAgent' | 'HumanAgent' | 'System';

export interface User {
  id: string;
  email: string | null;
  name: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  country?: string | null;
  role: Role;
  role_value: number;
  created_at: string;
  updated_at: string;
  o_auth_provider?: string | null;
}

export interface RoleStatistic {
  role: Role;
  role_value: number;
  count: number;
}

/**
 * Cursor-paginated users response from GET /api/usermanagement/users/cursor.
 * `next_cursor` is Base64-encoded; pass it back as the `cursor` query param
 * for the next page. `has_more` is the authoritative "more pages?" signal.
 */
export interface CursorPaginatedUsersResponse {
  items: User[];
  next_cursor: string | null;
  has_more: boolean;
}
