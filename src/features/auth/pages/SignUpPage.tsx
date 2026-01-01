/**
 * Mojeeb Minimal Sign Up Page
 * Clean registration experience matching login page style
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AxiosError } from 'axios';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { authService } from '../services/authService';
import { toast } from 'sonner';
import { AuthPageLayout } from '../components/AuthPageLayout';
import { AuthFooterLink } from '../components/AuthFooterLink';
import { logger } from '@/lib/logger';
import { useAuthStore } from '../stores/authStore';
import { useOnboardingStore } from '@/features/onboarding/stores/onboardingStore';
import { trackSignupSuccess } from '@/utils/gtmTracking';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

type SignUpForm = {
  name: string;
  email: string;
  password: string;
};

export const SignUpPage = () => {
  const { t } = useTranslation();
  useDocumentTitle('pages.title_signup');
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const signUpSchema = z.object({
    name: z.string().min(2, t('auth.name_min_length', { min: 2 })),
    email: z.string().email(t('auth.email_invalid')),
    password: z.string().min(8, t('auth.password_min_length', { min: 8 })).max(100, t('auth.password_max_length', { max: 100 })),
  });

  const { register, handleSubmit, formState: { errors } } = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
  });

  // Redirect already-authenticated users who visit /signup directly
  useEffect(() => {
    if (isAuthenticated && !hasSubmitted) {
      navigate('/conversations', { replace: true });
    }
  }, [isAuthenticated, hasSubmitted, navigate]); // React to state changes

  const onSubmit = async (data: SignUpForm) => {
    setIsLoading(true);
    setError(null);

    // Mark submission BEFORE register to prevent useEffect redirect race condition
    // (authService.register sets isAuthenticated=true, which would trigger the useEffect)
    setHasSubmitted(true);

    try {
      // Register the user
      console.time('⏱️ SIGNUP-TOTAL');
      console.time('⏱️ SIGNUP-API');
      const authResponse = await authService.register({
        name: data.name,
        email: data.email,
        password: data.password,
      });
      console.timeEnd('⏱️ SIGNUP-API');

      // Track signup success in Google Tag Manager
      trackSignupSuccess(
        authResponse.user.id,
        authResponse.user.email,
        authResponse.user.name,
        'email'
      );

      // Clear any stale onboarding state before starting fresh
      // Ensures new signups always begin onboarding from step 0 with clean form data
      useOnboardingStore.getState().resetOnboarding();

      // New signups always go to onboarding (they won't have any agents yet)
      // This saves an extra API call and improves perceived performance
      console.time('⏱️ SIGNUP-NAVIGATE');
      navigate('/onboarding', { replace: true });
      console.timeEnd('⏱️ SIGNUP-NAVIGATE');
      console.timeEnd('⏱️ SIGNUP-TOTAL');
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string; error?: string; errors?: Array<{ message: string }> }>;
      logger.error('Registration error', error);
      logger.error('Error response', axiosError.response?.data);

      // Extract detailed error message
      const errorMessage =
        axiosError.response?.data?.message ||
        axiosError.response?.data?.error ||
        axiosError.response?.data?.errors?.[0]?.message ||
        axiosError.message ||
        t('auth.signup_failed');

      setError(errorMessage);
      toast.error(errorMessage);
      // Reset hasSubmitted so user can retry (and useEffect guard works correctly)
      setHasSubmitted(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthPageLayout
      title={t('auth.signup_title')}
      error={error}
      isLoading={isLoading}
      footerContent={
        <AuthFooterLink
          text={t('auth.already_have_account')}
          linkText={t('auth.sign_in_link')}
          linkTo="/login"
        />
      }
    >
      {/* Sign Up Form - Clean Inputs */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          {...register('name')}
          type="text"
          placeholder={t('auth.name_placeholder')}
          error={errors.name?.message}
          disabled={isLoading}
        />

        <Input
          {...register('email')}
          type="email"
          placeholder={t('auth.email_placeholder')}
          error={errors.email?.message}
          disabled={isLoading}
        />

        <Input
          {...register('password')}
          type="password"
          placeholder={t('auth.password_placeholder')}
          error={errors.password?.message}
          disabled={isLoading}
        />

        <Button
          type="submit"
          className="w-full h-11"
          isLoading={isLoading}
          disabled={isLoading}
        >
          {t('auth.signup_button')}
        </Button>
      </form>
    </AuthPageLayout>
  );
};
