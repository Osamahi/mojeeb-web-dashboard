import { useState, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { authService } from '../services/authService';
import { useAuthStore } from '../stores/authStore';
import { AuthPageLayout } from '../components/AuthPageLayout';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { extractAuthError } from '../utils/errorHandler';
import {
  createResetPasswordSchema,
  type ResetPasswordFormData,
} from '../schemas/validation.schemas';

export const ResetPasswordPage = () => {
  const { t } = useTranslation();
  useDocumentTitle('pages.title_reset_password');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const resetPasswordSchema = useMemo(() => createResetPasswordSchema(t), [t]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const handleBackToLogin = useCallback(() => {
    navigate('/login');
  }, [navigate]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      toast.error(t('auth.reset_password_invalid_token'));
      return;
    }
    setIsLoading(true);
    try {
      await authService.resetPassword({ token, newPassword: data.newPassword });
      // If the user happened to be signed in (e.g. clicked the link on the same device),
      // drop the stale session so they have to sign in fresh with the new password.
      // `redirect: false` keeps the success screen in view.
      void useAuthStore.getState().logout({ redirect: false, reason: 'password-reset' });
      setIsSuccess(true);
      toast.success(t('auth.reset_password_success'));
    } catch (error) {
      const errorMessage = extractAuthError(error, 'auth.reset_password_failed', t);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // No token in URL → bounce to forgot-password so the user can request a new link.
  if (!token) {
    return <Navigate to="/forgot-password" replace />;
  }

  if (isSuccess) {
    return (
      <AuthPageLayout
        title={t('auth.reset_password_done_title')}
        showSocialLogin={false}
      >
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-success/10 rounded-full mb-6">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
          <p className="text-neutral-600 mb-6">
            {t('auth.reset_password_done_description')}
          </p>
          <Button onClick={handleBackToLogin} className="w-full h-11">
            {t('auth.back_to_login')}
          </Button>
        </div>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout
      title={t('auth.reset_password_title')}
      showSocialLogin={false}
      footerContent={
        <div className="mt-6">
          <button
            onClick={handleBackToLogin}
            className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors mx-auto"
            disabled={isLoading}
          >
            <ArrowLeft className="w-4 h-4" />
            {t('auth.back_to_login')}
          </button>
        </div>
      }
    >
      <div className="text-center mb-6">
        <p className="text-neutral-600 text-sm">
          {t('auth.reset_password_description')}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          {...register('newPassword')}
          type="password"
          autoComplete="new-password"
          placeholder={t('auth.new_password_placeholder')}
          error={errors.newPassword?.message}
          disabled={isLoading}
        />

        <Input
          {...register('confirmPassword')}
          type="password"
          autoComplete="new-password"
          placeholder={t('auth.confirm_password_placeholder')}
          error={errors.confirmPassword?.message}
          disabled={isLoading}
        />

        <Button
          type="submit"
          className="w-full h-11"
          isLoading={isLoading}
          disabled={isLoading}
        >
          {t('auth.reset_password_submit')}
        </Button>
      </form>
    </AuthPageLayout>
  );
};
