/**
 * Accept Invitation Page
 * Public route accessible via /accept-invitation?token=xyz
 *
 * For signed-in users: Fetches and displays the specific invitation
 * For signed-out users: Redirects to signup (existing flow handles invitation after auth)
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useInvitationStore } from '../stores/invitationStore';
import { invitationService } from '../services/invitationService';
import { PendingInvitationModal } from '../components/PendingInvitationModal';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

export function AcceptInvitationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const { setPendingInvitations, setShowModal } = useInvitationStore();

  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  // Fetch pending invitations (only if authenticated)
  const { data: invitations, isLoading, error } = useQuery({
    queryKey: ['invitations', 'my-pending'],
    queryFn: invitationService.getMyPendingInvitations,
    enabled: isAuthenticated && !!token,
    retry: 1,
  });

  // Handle auth state check and redirect for signed-out users
  useEffect(() => {
    // CRITICAL: Wait until auth state is stable before redirecting
    // refreshToken !== undefined means auth initialization has completed
    if (hasCheckedAuth || refreshToken === undefined) {
      return;
    }

    setHasCheckedAuth(true);

    logger.info('[AcceptInvitationPage] Processing invitation link', {
      isAuthenticated,
      hasRefreshToken: !!refreshToken,
      hasToken: !!token,
    });

    // If signed out, redirect to signup (existing flow handles invitation)
    if (!isAuthenticated && !refreshToken) {
      logger.info('[AcceptInvitationPage] User not authenticated - redirecting to signup');
      navigate('/signup', { replace: true });
    }
  }, [navigate, isAuthenticated, refreshToken, hasCheckedAuth, token]);

  // Handle invitation filtering and modal display for signed-in users
  useEffect(() => {
    if (!isAuthenticated || !invitations || !token) {
      return;
    }

    logger.info('[AcceptInvitationPage] Filtering invitations by token', {
      totalInvitations: invitations.length,
      tokenPrefix: token.substring(0, 10),
      invitationTokens: invitations.map(inv => inv.invitationToken.substring(0, 10) + '...'),
    });

    // Find the specific invitation by token (client-side filter)
    const invitation = invitations.find(
      (inv) => inv.invitationToken === token
    );

    if (invitation) {
      logger.info('[AcceptInvitationPage] Invitation found - showing modal', {
        organizationName: invitation.organizationName,
      });

      // Set ONLY this invitation in store (single-item array)
      setPendingInvitations([invitation]);
      setShowModal(true);
    } else {
      // Log detailed debug information
      console.log('❌ INVITATION NOT FOUND');
      console.log('URL Token:', token);
      console.log('Available invitations:', invitations.length);
      console.log('Available tokens:', invitations.map(inv => inv.invitationToken));

      logger.warn('[AcceptInvitationPage] Invitation not found or expired', {
        urlToken: token.substring(0, 20) + '...',
        availableTokens: invitations.map(inv => ({
          token: inv.invitationToken.substring(0, 20) + '...',
          org: inv.organizationName
        })),
      });
      toast.error('This invitation is invalid or has expired');

      // Delay redirect so logs can be seen
      setTimeout(() => {
        navigate('/conversations', { replace: true });
      }, 3000);
    }
  }, [invitations, token, isAuthenticated, setPendingInvitations, setShowModal, navigate]);

  // Show loading state while fetching
  if (isLoading || !hasCheckedAuth) {
    return <PageSkeleton />;
  }

  // Show error state
  if (error) {
    logger.error('[AcceptInvitationPage] Failed to fetch invitations', error as Error);
    toast.error('Failed to load invitation. Please try again.');
    navigate('/conversations', { replace: true });
    return <PageSkeleton />;
  }

  // Render modal (reads from store)
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      <PendingInvitationModal />
    </div>
  );
}
