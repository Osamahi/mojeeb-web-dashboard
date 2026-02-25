/**
 * Mojeeb Minimal Login Page
 * Ultra-clean login experience with Mojeeb brand identity
 */

import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { authService } from '../services/authService';
import { AuthPageLayout } from '../components/AuthPageLayout';
import { AuthFooterLink } from '../components/AuthFooterLink';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useLanguageFromUrl } from '@/hooks/useLanguageFromUrl';
import { useAuthFormSubmit } from '../hooks/useAuthFormSubmit';
import { createLoginSchema, type LoginFormData } from '../schemas/validation.schemas';

export const LoginPage = () => {
  const { t } = useTranslation();
  useDocumentTitle('pages.title_login');
  useLanguageFromUrl(); // Apply language from URL parameter (from landing page)
  const navigate = useNavigate();

  // Memoize schema to prevent recreation on every render (performance optimization)
  const loginSchema = useMemo(() => createLoginSchema(t), [t]);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Unified form submission logic (loading, errors, navigation)
  const { handleSubmit: onSubmit, isLoading, error, isNavigating } = useAuthFormSubmit({
    authAction: (data: LoginFormData) => authService.login(data),
    errorKey: 'auth.login_failed',
  });

  // Memoize forgot password handler to prevent recreation on every render
  const handleForgotPassword = useCallback(() => {
    navigate('/forgot-password');
  }, [navigate]);

  return (
    <AuthPageLayout
      title={t('auth.login_title')}
      error={error}
      isLoading={isLoading}
      footerContent={
        <AuthFooterLink
          text={t('auth.dont_have_account')}
          linkText={t('auth.sign_up_link')}
          linkTo="/signup"
        />
      }
    >
      {/* Login Form - Clean Inputs */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          {...register('email')}
          type="email"
          placeholder={t('auth.email_placeholder')}
          error={errors.email?.message}
          disabled={isLoading}
        />

        <div className="space-y-2">
          <Input
            {...register('password')}
            type="password"
            placeholder={t('auth.password_placeholder')}
            error={errors.password?.message}
            disabled={isLoading}
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-sm text-brand-mojeeb hover:text-brand-mojeeb/80 transition-colors"
              disabled={isLoading}
            >
              {t('auth.forgot_password_link')}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-11"
          isLoading={isLoading || isNavigating}
          disabled={isLoading || isNavigating}
        >
          {t('auth.login_button')}
        </Button>
      </form>
    </AuthPageLayout>
  );
};
