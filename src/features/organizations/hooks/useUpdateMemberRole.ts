import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { organizationService } from '../services/organizationService';
import { logger } from '@/lib/logger';

interface UpdateMemberRoleParams {
  organizationId: string;
  userId: string;
  newRole: 'owner' | 'admin' | 'member';
}

/**
 * TanStack Query mutation hook for updating organization member roles
 * Handles API call, cache invalidation, and toast notifications
 *
 * Usage:
 * ```tsx
 * const updateRoleMutation = useUpdateMemberRole();
 *
 * updateRoleMutation.mutate({
 *   organizationId: 'org-123',
 *   userId: 'user-456',
 *   newRole: 'admin'
 * });
 * ```
 */
export function useUpdateMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UpdateMemberRoleParams) => {
      return organizationService.updateMemberRole(
        params.organizationId,
        params.userId,
        params.newRole
      );
    },

    onSuccess: (_data, variables) => {
      // Invalidate organization members query to trigger refetch
      queryClient.invalidateQueries({
        queryKey: ['organization-members', variables.organizationId]
      });

      logger.info('[useUpdateMemberRole] Member role updated successfully', {
        userId: variables.userId,
        newRole: variables.newRole
      });

      toast.success(`Role updated to ${variables.newRole} successfully`);
    },

    onError: (error: Error, variables) => {
      logger.error('[useUpdateMemberRole] Failed to update member role', error, {
        userId: variables.userId,
        newRole: variables.newRole
      });

      // Extract error message from API response
      const errorMessage = error.message || 'Failed to update member role';
      toast.error(errorMessage);
    }
  });
}
