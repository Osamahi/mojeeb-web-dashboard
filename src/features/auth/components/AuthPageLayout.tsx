/**
 * Minimal Auth Page Layout Component
 * Reusable layout for all authentication pages (Login, SignUp, ForgotPassword)
 * Uses AuthHeader for consistent branding
 * Features smooth page transitions with Framer Motion
 */

import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthHeader } from '@/components/layout/AuthHeader';
import { SupportButton } from '@/components/SupportButton';
import { ErrorAlert } from './ErrorAlert';
import { Divider } from './Divider';
import { SocialLoginButtons } from './SocialLoginButtons';

/**
 * Animation variants for smooth page transitions
 * Fade + subtle vertical slide for professional feel
 */
const pageVariants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -10,
  },
};

/**
 * Page transition timing
 * 250ms with Material Design easing for instant yet polished feel
 */
const pageTransition = {
  duration: 0.25,
  ease: [0.4, 0.0, 0.2, 1], // Material Design standard easing
};

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
  const location = useLocation();

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <AuthHeader />

      {/* Main Content - Account for fixed header */}
      <div className="flex-1 flex items-center justify-center p-4 pt-20">
        <div className="w-full max-w-md">
          {/* Minimal Card Container with Page Transition Animation */}
          <motion.div
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
            className="bg-white rounded-xl border border-neutral-200 p-8"
          >
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
          </motion.div>

          {/* Support Button - Below Card */}
          <div className="mt-4">
            <SupportButton variant="subtle" className="w-full justify-center" />
          </div>
        </div>
      </div>
    </div>
  );
};
