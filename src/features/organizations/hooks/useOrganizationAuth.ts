import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useAgentContext } from '@/hooks/useAgentContext';
import { organizationService } from '../services/organizationService';
import { Role } from '@/features/auth/types/auth.types';
import type { OrganizationMember } from '../types';

/**
 * Centralized authorization hook for organization operations.
 * Single source of truth for all organization permission checks.
 *
 * Returns computed permission flags based on:
 * - User's global role (SuperAdmin)
 * - User's organization role (owner/admin/member)
 *
 * Usage:
 * ```tsx
 * const { canEditRoles, canAssignOwner, isOwner } = useOrganizationAuth();
 *
 * if (canEditRoles) {
 *   // Show edit role button
 * }
 * ```
 */
export function useOrganizationAuth() {
  const user = useAuthStore((state) => state.user);
  const { agent } = useAgentContext();

  // Fetch organization members to determine current user's role
  const { data: members = [] } = useQuery({
    queryKey: ['organization-members', agent?.organizationId],
    queryFn: () =>
      agent?.organizationId
        ? organizationService.getOrganizationMembers(agent.organizationId)
        : Promise.resolve([]),
    enabled: !!agent?.organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Compute authorization flags
  const authFlags = useMemo(() => {
    // SuperAdmin has all permissions
    const isSuperAdmin = user?.role === Role.SuperAdmin;

    // Find current user's organization membership
    const currentUserMembership = members.find(
      (m: OrganizationMember) => m.userId === user?.id
    );

    const userRole = currentUserMembership?.role;

    // Role checks
    const isOwner = userRole === 'owner';
    const isAdmin = userRole === 'admin';
    const isMember = userRole === 'member';

    // Permission flags
    const canEditRoles = isSuperAdmin || isOwner || isAdmin;
    const canAssignOwner = isSuperAdmin || isOwner;
    const canInviteMembers = isSuperAdmin || isOwner || isAdmin;
    const canRemoveMembers = isSuperAdmin || isOwner;

    /**
     * Check if current user can edit a specific member's role
     * @param member - Target member to check
     * @returns true if current user can edit this member's role
     */
    const canEditMember = (member: OrganizationMember): boolean => {
      // SuperAdmin can edit anyone
      if (isSuperAdmin) {
        return true;
      }

      // Can't edit yourself
      if (member.userId === user?.id) {
        return false;
      }

      // Owner and Admin can edit members
      if (isOwner || isAdmin) {
        return true;
      }

      return false;
    };

    /**
     * Check if a role option should be shown in role selector
     * @param role - Role to check ('owner' | 'admin' | 'member')
     * @returns true if role option should be available
     */
    const canSelectRole = (role: 'owner' | 'admin' | 'member'): boolean => {
      // Owner role only for SuperAdmin or current owner
      if (role === 'owner') {
        return canAssignOwner;
      }

      // Admin/Member roles for anyone who can edit roles
      return canEditRoles;
    };

    return {
      // User role flags
      isSuperAdmin,
      isOwner,
      isAdmin,
      isMember,
      userRole,

      // Permission flags
      canEditRoles,
      canAssignOwner,
      canInviteMembers,
      canRemoveMembers,

      // Computed helpers
      canEditMember,
      canSelectRole,

      // Raw data (for advanced use cases)
      currentUserMembership,
    };
  }, [user?.id, user?.role, members]);

  return authFlags;
}
