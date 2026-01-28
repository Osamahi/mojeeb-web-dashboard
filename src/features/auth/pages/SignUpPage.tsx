/**
 * Mojeeb Minimal Sign Up Page
 * Clean registration experience matching login page style
 */

import { useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { authService } from '../services/authService';
import { AuthPageLayout } from '../components/AuthPageLayout';
import { AuthFooterLink } from '../components/AuthFooterLink';
import { useAuthStore } from '../stores/authStore';
import { useOnboardingStore } from '@/features/onboarding/stores/onboardingStore';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useLanguageFromUrl } from '@/hooks/useLanguageFromUrl';
import { useAuthFormSubmit } from '../hooks/useAuthFormSubmit';
import { createSignUpSchema, type SignUpFormData } from '../schemas/validation.schemas';

export const SignUpPage = () => {
  const { t } = useTranslation();
  useDocumentTitle('pages.title_signup');
  useLanguageFromUrl(); // Apply language from URL parameter (from landing page)
  const navigate = useNavigate();

  // CRITICAL: Use ref instead of state for synchronous guard flag
  // Prevents React batching race condition where setIsSubmitting(true) + setIsAuthenticated(true)
  // are batched together, causing useEffect to see isAuthenticated=true while isSubmitting=false
  const isSubmittingRef = useRef(false);

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Memoize schema to prevent recreation on every render (performance optimization)
  const signUpSchema = useMemo(() => createSignUpSchema(t), [t]);

  const { register, handleSubmit, formState: { errors } } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  // Unified form submission logic (loading, errors, analytics, navigation)
  const { handleSubmit: onSubmit, isLoading, error, isNavigating } = useAuthFormSubmit({
    authAction: (data: SignUpFormData) => authService.register(data),
    errorKey: 'auth.signup_failed',
    trackingEvent: 'signup_completed',
    trackingData: (response) => ({
      userId: response.user.id,
      email: response.user.email,
      name: response.user.name,
      signupMethod: 'email',
    }),
    onSuccess: () => {
      // Clear any stale onboarding state before starting fresh
      // Ensures new signups always begin onboarding from step 0 with clean form data
      useOnboardingStore.getState().resetOnboarding();
    },
    guardRef: isSubmittingRef,
  });

  // Redirect already-authenticated users who visit /signup directly
  // Guard with isSubmittingRef to prevent race condition during registration flow
  useEffect(() => {
    if (isAuthenticated && !isSubmittingRef.current) {
      navigate('/conversations', { replace: true });
    }
  }, [isAuthenticated, navigate]); // isSubmittingRef not needed in deps (it's a ref)

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
          isLoading={isLoading || isNavigating}
          disabled={isLoading || isNavigating}
        >
          {t('auth.signup_button')}
        </Button>
      </form>
    </AuthPageLayout>
  );
};
