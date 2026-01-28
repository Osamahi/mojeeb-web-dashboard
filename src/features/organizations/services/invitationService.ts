/**
 * Invitation Service
 * Handles API calls related to organization invitations
 */

import api from '@/lib/api';
import type { ApiResponse } from '@/types/api';
import { logger } from '@/lib/logger';

// API response type for pending invitations list
interface ApiPendingInvitation {
  id: string;
  email: string;
  role: string;
  organization_id: string;
  organization_name: string;
  inviter_name: string | null;
  invitation_token: string;
  expires_at: string;
  created_at: string;
}

export interface PendingInvitation {
  id: string;
  email: string;
  role: string;
  organizationId: string;
  organizationName: string;
  inviterName: string | null;
  invitationToken: string;
  expiresAt: string;
  createdAt: string;
}

/**
 * Transform pending invitation from snake_case to camelCase
 */
function transformPendingInvitation(apiInv: ApiPendingInvitation): PendingInvitation {
  return {
    id: apiInv.id,
    email: apiInv.email,
    role: apiInv.role,
    organizationId: apiInv.organization_id,
    organizationName: apiInv.organization_name,
    inviterName: apiInv.inviter_name,
    invitationToken: apiInv.invitation_token,
    expiresAt: apiInv.expires_at,
    createdAt: apiInv.created_at,
  };
}

export const invitationService = {
  /**
   * Accept invitation for authenticated user
   * Authenticated endpoint - requires JWT token
   * Used when users are accepting invitations from modal
   * Automatically transfers user from current org to new org
   */
  async acceptInvitationAuthenticated(token: string): Promise<void> {
    try {
      await api.post<ApiResponse<{ message: string }>>(
        `/api/invitations/accept-authenticated/${token}`
      );
      logger.info('[invitationService] Accepted invitation (authenticated)', { token: token.substring(0, 10) + '...' });
    } catch (error) {
      logger.error('[invitationService] Failed to accept invitation (authenticated)', error as Error);
      throw error;
    }
  },

  /**
   * Get pending invitations for current user
   * Authenticated endpoint - called after sign-in
   */
  async getMyPendingInvitations(): Promise<PendingInvitation[]> {
    try {
      const response = await api.get<ApiResponse<ApiPendingInvitation[]>>(
        '/api/invitations/my-pending'
      );
      logger.info('[invitationService] Fetched pending invitations', { count: response.data.data.length });
      return response.data.data.map(transformPendingInvitation);
    } catch (error) {
      logger.error('[invitationService] Failed to fetch pending invitations', error as Error);
      throw error;
    }
  },
};
