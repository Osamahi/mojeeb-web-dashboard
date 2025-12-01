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

export interface UserFilters {
  searchQuery?: string;
  role?: Role | 'All';
}

export interface UserApiResponse {
  success?: boolean;
  message?: string;
  data?: User[];
}

export interface RoleStatisticsApiResponse {
  success?: boolean;
  message?: string;
  data?: RoleStatistic[];
}
