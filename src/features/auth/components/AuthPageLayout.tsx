/**
 * Minimal Auth Page Layout Component
 * Reusable layout for all authentication pages (Login, SignUp, ForgotPassword)
 * Provides consistent structure: logo, card, title, error display, form content
 */

import { ReactNode } from 'react';
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
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Mojeeb Brand Logo - Above Card */}
        <div className="text-center mb-6">
          <img
            src="/mojeeb-logo.png"
            alt="Mojeeb"
            className="h-10 mx-auto"
          />
        </div>

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
  );
};
