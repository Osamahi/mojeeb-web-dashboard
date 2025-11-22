import { useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { getAccessToken, getRefreshToken, setTokens } from '@/lib/tokenManager';
import { authService } from '../services/authService';
import { logger } from '@/lib/logger';

interface AuthInitializerProps {
  children: ReactNode;
}

/**
 * AuthInitializer - Critical component to prevent authentication flickering
 *
 * On page load/refresh:
 * 1. Validates accessToken exists
 * 2. If missing but refreshToken exists, proactively refreshes token
 * 3. Shows loading state during validation
 * 4. Only renders children after auth state is stable
 *
 * This prevents the flickering loop caused by:
 * - isAuthenticated=true (from Zustand rehydration)
 * - accessToken=null (not persisted for security)
 * - API calls fail → redirect to login
 * - PublicRoute sees isAuthenticated=true → redirects back
 */
export const AuthInitializer = ({ children }: AuthInitializerProps) => {
  const [isInitializing, setIsInitializing] = useState(true);
  const { isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = async () => {
      console.log(`\n🔄 [AuthInitializer] Initializing at ${new Date().toISOString()}`);
      console.log(`   isAuthenticated: ${isAuthenticated}`);

      try {
        // If not authenticated, no need to validate tokens
        if (!isAuthenticated) {
          console.log(`   ℹ️ Not authenticated, skipping token validation`);
          setIsInitializing(false);
          return;
        }

        console.log(`   ✅ User is authenticated, validating tokens...`);

        const accessToken = getAccessToken();
        const refreshToken = getRefreshToken();

        console.log(`   📊 Token status:`);
        console.log(`      Access Token: ${accessToken ? 'EXISTS (' + accessToken.length + ' chars)' : 'MISSING'}`);
        console.log(`      Refresh Token: ${refreshToken ? 'EXISTS (' + refreshToken.length + ' chars)' : 'MISSING'}`);

        // Case 1: Has both tokens - all good
        if (accessToken && refreshToken) {
          console.log(`   ✅ CASE 1: Both tokens present - initialization complete`);
          setIsInitializing(false);
          return;
        }

        // Case 2: Has refresh token but no access token - proactively refresh
        if (!accessToken && refreshToken) {
          console.log(`   ⚠️ CASE 2: Access token missing, refresh token present`);
          console.log(`   🔄 Attempting proactive token refresh...`);
          logger.info('AuthInitializer: Access token missing, attempting refresh...');

          try {
            // Use centralized authService.refreshToken to avoid code duplication
            const tokens = await authService.refreshToken(refreshToken);

            console.log(`   💾 Storing refreshed tokens...`);
            // Store new tokens
            setTokens(tokens.accessToken, tokens.refreshToken);

            console.log(`   ✅ Proactive refresh successful!`);
            logger.info('AuthInitializer: Token refresh successful');
            setIsInitializing(false);
            return;
          } catch (error) {
            console.error(`   ❌ Proactive refresh FAILED:`, error);
            logger.error('AuthInitializer: Token refresh failed', error);
            // Token refresh failed - logout and redirect
            console.log(`   🚪 Logging out and redirecting to login...`);
            logout();
            navigate('/login', { replace: true });
            return;
          }
        }

        // Case 3: No tokens but authenticated - inconsistent state, logout
        if (!accessToken && !refreshToken && isAuthenticated) {
          console.error(`   ❌ CASE 3: Inconsistent state - authenticated but no tokens!`);
          console.log(`   🚪 Logging out and redirecting to login...`);
          logger.warn('AuthInitializer: Inconsistent auth state - no tokens but isAuthenticated=true');
          logout();
          navigate('/login', { replace: true });
          return;
        }

        console.log(`   ℹ️ No special cases matched, ending initialization`);

      } catch (error) {
        console.error(`   ❌ [AuthInitializer] Unexpected error during initialization:`, error);
        logger.error('AuthInitializer: Unexpected error during initialization', error);
        logout();
        navigate('/login', { replace: true });
      } finally {
        console.log(`   🏁 [AuthInitializer] Initialization complete, isInitializing = false`);
        setIsInitializing(false);
      }
    };

    initializeAuth();
  }, [isAuthenticated, logout, navigate]);

  // Show loading spinner during initialization
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50">
        <div className="flex flex-col items-center gap-4">
          {/* Loading Spinner */}
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 border-4 border-neutral-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
          </div>

          {/* Loading Text */}
          <p className="text-sm text-neutral-600 font-medium">
            Initializing...
          </p>
        </div>
      </div>
    );
  }

  // Auth initialized, render children
  return <>{children}</>;
};
