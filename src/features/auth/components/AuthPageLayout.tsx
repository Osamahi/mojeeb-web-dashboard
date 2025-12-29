/**
 * Minimal Auth Page Layout Component
 * Reusable layout for all authentication pages (Login, SignUp, ForgotPassword)
 * Uses AuthHeader for consistent branding
 */

import { ReactNode } from 'react';
import { AuthHeader } from '@/components/layout/AuthHeader';
import { ErrorAlert } from './ErrorAlert';
import { Divider } from './Divider';
import { SocialLoginButtons } from './SocialLoginButtons';

interface AuthPageLayoutProps {
  /** Page title displayed at the top of the card */
  title: string;
  /** Optional error message to display */
  error?: string | null;
  /** Form content to render inside the card */
  children: ReactNode;
  /** Whether to show the divider and social login buttons */
  showSocialLogin?: boolean;
  /** Optional footer content (e.g., AuthFooterLink or custom navigation) */
  footerContent?: ReactNode;
  /** Loading state for social login buttons */
  isLoading?: boolean;
}

export const AuthPageLayout = ({
  title,
  error,
  children,
  showSocialLogin = true,
  footerContent,
  isLoading = false,
}: AuthPageLayoutProps) => {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <AuthHeader />

      {/* Main Content - Account for fixed header */}
      <div className="flex-1 flex items-center justify-center p-4 pt-20">
        <div className="w-full max-w-md">
          {/* Minimal Card Container */}
          <div className="bg-white rounded-xl border border-neutral-200 p-8">
            {/* Header - Clean & Centered */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-neutral-950">
                {title}
              </h1>
            </div>

            {/* Error Alert */}
            {error && <ErrorAlert message={error} />}

            {/* Form Content */}
            {children}

            {/* Social Login Section */}
            {showSocialLogin && (
              <>
                <Divider />
                <SocialLoginButtons disabled={isLoading} />
              </>
            )}

            {/* Footer Content */}
            {footerContent}
          </div>
        </div>
      </div>
    </div>
  );
};
