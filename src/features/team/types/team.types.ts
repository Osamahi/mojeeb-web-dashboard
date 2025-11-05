/**
 * Team types for team member management
 * Extends User types with team-specific fields
 */

import type { User, Role } from '@/features/users/types';

// Team member is a user with team-specific roles
export type TeamRole = 'SuperAdmin' | 'Admin' | 'HumanAgent';

export interface TeamMember extends User {
  role: TeamRole;
  // Additional team-specific fields can be added here
  last_active?: string;
  is_online?: boolean;
  assigned_conversations_count?: number;
}

export interface TeamStats {
  total_members: number;
  online_members: number;
  admins_count: number;
  agents_count: number;
  super_admins_count: number;
}

export interface InviteTeamMemberRequest {
  email: string;
  name: string;
  role: TeamRole;
}

export interface InviteTeamMemberResponse {
  success: boolean;
  message: string;
  data?: TeamMember;
}

export interface TeamMemberFilters {
  searchQuery?: string;
  role?: TeamRole | 'All';
  status?: 'All' | 'Online' | 'Offline';
}
