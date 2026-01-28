/**
 * useCheckPendingInvitations Hook
 *
 * Automatically fetches and displays pending invitations when user reaches authenticated pages.
 * This ensures invitation modals show even when user navigates directly to /conversations
 * (bypassing the login flow where completeAuthFlow() normally runs).
 *
 * Usage: Call this hook in DashboardLayout or any authenticated page component.
 */

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useInvitationStore } from '../stores/invitationStore';
import { invitationService } from '../services/invitationService';
import { logger } from '@/lib/logger';

export function useCheckPendingInvitations() {
  const user = useAuthStore((state) => state.user);
  const { setPendingInvitations, setShowModal } = useInvitationStore();
  const hasChecked = useRef(false);

  useEffect(() => {
    // Only run once per mount
    if (hasChecked.current) return;

    // Only check if user is authenticated and has email
    if (!user?.email) {
      logger.debug('[useCheckPendingInvitations] Skipping check - no user email');
      return;
    }

    hasChecked.current = true;

    const fetchPendingInvitations = async () => {
      try {
        logger.info('[useCheckPendingInvitations] Checking for pending invitations', {
          email: user.email,
        });

        const invitations = await invitationService.getMyPendingInvitations();

        if (invitations && invitations.length > 0) {
          logger.info('[useCheckPendingInvitations] Found pending invitations', {
            count: invitations.length,
          });
          setPendingInvitations(invitations);
          setShowModal(true);
        } else {
          logger.debug('[useCheckPendingInvitations] No pending invitations found');
        }
      } catch (error) {
        logger.error(
          '[useCheckPendingInvitations] Failed to fetch pending invitations (non-fatal)',
          error as Error
        );
        // Non-fatal error - don't break the dashboard experience
      }
    };

    fetchPendingInvitations();
  }, [user?.email, setPendingInvitations, setShowModal]);
}
