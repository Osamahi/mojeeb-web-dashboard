/**
 * Social Login Buttons Component
 * Minimal social authentication buttons for Google, Facebook, and Apple
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import AppleSignin from 'react-apple-signin-auth';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { authService } from '../services/authService';
import { env } from '@/config/env';
import { logger } from '@/lib/logger';

interface SocialLoginButtonsProps {
  disabled?: boolean;
}

export const SocialLoginButtons = ({ disabled = false }: SocialLoginButtonsProps) => {
  const navigate = useNavigate();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setIsGoogleLoading(true);
    try {
      if (!credentialResponse.credential) {
        throw new Error('No credential received from Google');
      }

      // Decode the ID token to get user info
      const decoded: any = jwtDecode(credentialResponse.credential);

      logger.info('Google One Tap success', {
        email: decoded.email,
        name: decoded.name,
      });

      // Google One Tap doesn't provide access_token, only ID token
      // Backend needs to validate the ID token instead
      // For now, send empty access_token but populated user info
      await authService.loginWithGoogle(
        '',  // No access token from One Tap
        decoded.email || '',
        decoded.name || '',
        decoded.picture || ''
      );

      toast.success('Welcome to Mojeeb!');
      navigate('/conversations');
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      logger.error('Google sign-in error', error);
      toast.error(axiosError?.response?.data?.message || 'Google sign-in failed. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    logger.warn('Google One Tap cancelled or failed');
    toast.error('Google sign-in was cancelled');
  };

  const handleAppleSignIn = async (response: { authorization: { id_token: string } }) => {
    setIsAppleLoading(true);
    try {
      const idToken = response.authorization.id_token;
      await authService.loginWithApple(idToken);
      toast.success('Welcome to Mojeeb!');
      navigate('/conversations');
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      logger.error('Apple sign-in error', error);
      toast.error(axiosError?.response?.data?.message || 'Apple sign-in failed. Please try again.');
    } finally {
      setIsAppleLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    // Placeholder for Facebook OAuth flow
    toast.info(`${provider} login coming soon!`);
  };

  return (
    <div className="space-y-3">
      {/* Google Sign In - Using Google One Tap (no popup) */}
      <div className="w-full">
        {!isGoogleLoading && !disabled ? (
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            size="large"
            width="100%"
            text="continue_with"
            shape="rectangular"
            logo_alignment="left"
          />
        ) : (
          <button
            disabled
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-neutral-100 text-neutral-500 rounded-lg cursor-not-allowed"
          >
            <span className="text-sm font-medium">
              {isGoogleLoading ? 'Signing in...' : 'Continue with Google'}
            </span>
          </button>
        )}
      </div>

      {/* Facebook Sign In */}
      <button
        type="button"
        onClick={() => handleSocialLogin('Facebook')}
        disabled={disabled}
        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
        <span className="text-sm font-medium text-neutral-950">Continue with Facebook</span>
      </button>

      {/* Apple Sign In */}
      <AppleSignin
        authOptions={{
          clientId: env.VITE_APPLE_CLIENT_ID || '',
          scope: 'email name',
          redirectURI: env.VITE_APPLE_REDIRECT_URI || '',
          usePopup: true,
        }}
        onSuccess={handleAppleSignIn}
        onError={(error: unknown) => {
          logger.error('Apple sign-in error', error);
          toast.error('Apple sign-in was cancelled or failed');
        }}
        render={(props: unknown) => (
          <button
            {...props}
            disabled={disabled || isAppleLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#000000">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            <span className="text-sm font-medium text-neutral-950">
              {isAppleLoading ? 'Signing in...' : 'Continue with Apple'}
            </span>
          </button>
        )}
      />
    </div>
  );
};
