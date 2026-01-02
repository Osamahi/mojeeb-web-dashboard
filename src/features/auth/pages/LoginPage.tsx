/**
 * Mojeeb Minimal Login Page
 * Ultra-clean login experience with Mojeeb brand identity
 * NO animations, NO gradients (except logo), just professional simplicity
 */

import { useState } from 'react';
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
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useLanguageFromUrl } from '@/hooks/useLanguageFromUrl';

type LoginForm = {
  email: string;
  password: string;
};

export const LoginPage = () => {
  const { t } = useTranslation();
  useDocumentTitle('pages.title_login');
  useLanguageFromUrl(); // Apply language from URL parameter (from landing page)
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginSchema = z.object({
    email: z.string().email(t('auth.email_invalid')),
    password: z.string().min(6, t('auth.password_min_length', { min: 6 })),
  });

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError(null);

    try {
      await authService.login(data);
      // Phone modal will auto-show in DashboardLayout if needed
      navigate('/conversations');
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const errorMessage = axiosError.response?.data?.message || t('auth.login_failed');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

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
              onClick={() => navigate('/forgot-password')}
              className="text-sm text-brand-cyan hover:text-brand-cyan/80 transition-colors"
              disabled={isLoading}
            >
              {t('auth.forgot_password_link')}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-11"
          isLoading={isLoading}
          disabled={isLoading}
        >
          {t('auth.login_button')}
        </Button>
      </form>
    </AuthPageLayout>
  );
};
