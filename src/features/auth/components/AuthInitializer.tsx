import { useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { getAccessToken, getRefreshToken, setTokens } from '@/lib/tokenManager';
import { authService } from '../services/authService';

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
      try {
        // If not authenticated, no need to validate tokens
        if (!isAuthenticated) {
          setIsInitializing(false);
          return;
        }

        const accessToken = getAccessToken();
        const refreshToken = getRefreshToken();

        // Case 1: Has both tokens - all good
        if (accessToken && refreshToken) {
          setIsInitializing(false);
          return;
        }

        // Case 2: Has refresh token but no access token - proactively refresh
        if (!accessToken && refreshToken) {
          console.log('AuthInitializer: Access token missing, attempting refresh...');

          try {
            // Use centralized authService.refreshToken to avoid code duplication
            const tokens = await authService.refreshToken(refreshToken);

            // Store new tokens
            setTokens(tokens.accessToken, tokens.refreshToken);

            console.log('AuthInitializer: Token refresh successful');
            setIsInitializing(false);
            return;
          } catch (error) {
            console.error('AuthInitializer: Token refresh failed', error);
            // Token refresh failed - logout and redirect
            logout();
            navigate('/login', { replace: true });
            return;
          }
        }

        // Case 3: No tokens but authenticated - inconsistent state, logout
        if (!accessToken && !refreshToken && isAuthenticated) {
          console.warn('AuthInitializer: Inconsistent auth state - no tokens but isAuthenticated=true');
          logout();
          navigate('/login', { replace: true });
          return;
        }

      } catch (error) {
        console.error('AuthInitializer: Unexpected error during initialization', error);
        logout();
        navigate('/login', { replace: true });
      } finally {
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
