/**
 * Accept Invitation Page
 * Public route accessible via /accept-invitation?token=xyz
 *
 * Redirects users to appropriate destination based on authentication status.
 * Backend automatically checks for pending invitations by email after auth,
 * so no token storage or passing is needed in frontend.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
import { logger } from '@/lib/logger';

export function AcceptInvitationPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  useEffect(() => {
    // CRITICAL: Wait until auth state is stable before redirecting
    // refreshToken !== undefined means auth initialization has completed
    // (it will be either a string or null, but not undefined)
    if (hasCheckedAuth || refreshToken === undefined) {
      return;
    }

    setHasCheckedAuth(true);

    logger.info('[AcceptInvitationPage] Processing invitation link', {
      isAuthenticated,
      hasRefreshToken: !!refreshToken,
    });

    // Check both isAuthenticated AND refreshToken to handle race conditions
    // If refreshToken exists, user is definitely authenticated
    if (isAuthenticated || refreshToken) {
      // User is signed in: Redirect to conversations
      // DashboardLayout will fetch pending invitations and show modal
      logger.info('[AcceptInvitationPage] User authenticated - redirecting to conversations');
      navigate('/conversations', { replace: true });
    } else {
      // User is signed out: Redirect to signup
      // After signup, completeAuthFlow() will fetch pending invitations by email
      logger.info('[AcceptInvitationPage] User not authenticated - redirecting to signup');
      navigate('/signup', { replace: true });
    }
  }, [navigate, isAuthenticated, refreshToken, hasCheckedAuth]);

  // Show skeleton while redirecting
  return <PageSkeleton />;
}
