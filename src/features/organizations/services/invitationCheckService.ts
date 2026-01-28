/**
 * Invitation Check Service
 *
 * Centralized service to check for pending invitations after user authentication.
 * Called automatically after any sign-in method (Google, email/password, etc.)
 */

import { logger } from '@/lib/logger';
import { invitationService } from './invitationService';
import { useInvitationStore } from '../stores/invitationStore';

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
 * Check for pending invitations after user signs in
 * If invitations are found, stores them in Zustand and triggers UI
 */
export async function checkAndHandlePendingInvitations(userEmail: string): Promise<void> {
  try {
    logger.info('[InvitationCheck] Checking for pending invitations', { userEmail });

    // Call backend to get pending invitations
    const invitations = await invitationService.getMyPendingInvitations();

    if (!invitations || invitations.length === 0) {
      logger.info('[InvitationCheck] No pending invitations found');
      return;
    }

    logger.info('[InvitationCheck] Found pending invitations', {
      count: invitations.length,
      organizations: invitations.map(inv => inv.organizationName)
    });

    // Store in Zustand to trigger modal
    useInvitationStore.getState().setPendingInvitations(invitations);
    useInvitationStore.getState().setShowModal(true);

  } catch (error) {
    logger.error('[InvitationCheck] Error checking for pending invitations', error instanceof Error ? error : new Error(String(error)));
    // Don't fail the auth flow if invitation check fails
  }
}

export const invitationCheckService = {
  checkAndHandlePendingInvitations,
};
