import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { authService } from '../services/authService';
import { toast } from 'sonner';
import { AuthPageLayout } from '../components/AuthPageLayout';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { extractAuthError } from '../utils/errorHandler';
import { createForgotPasswordSchema, type ForgotPasswordFormData } from '../schemas/validation.schemas';

export const ForgotPasswordPage = () => {
  const { t } = useTranslation();
  useDocumentTitle('pages.title_forgot_password');
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Memoize schema to prevent recreation on every render (performance optimization)
  const forgotPasswordSchema = useMemo(() => createForgotPasswordSchema(t), [t]);

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);

    try {
      await authService.forgotPassword(data);
      setIsSuccess(true);
      toast.success(t('auth.reset_link_sent'));
    } catch (error) {
      // Use extractAuthError utility for consistent error handling
      const errorMessage = extractAuthError(error, 'auth.reset_link_failed', t);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Memoize back to login handler to prevent recreation on every render
  const handleBackToLogin = useCallback(() => {
    navigate('/login');
  }, [navigate]);

  if (isSuccess) {
    return (
      <AuthPageLayout
        title={t('auth.check_email_title')}
        showSocialLogin={false}
      >
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-success/10 rounded-full mb-6">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
          <p className="text-neutral-600 mb-6">
            {t('auth.check_email_description')}
          </p>
          <Button
            onClick={handleBackToLogin}
            className="w-full h-11"
          >
            {t('auth.back_to_login')}
          </Button>
        </div>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout
      title={t('auth.forgot_password_title')}
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
          {t('auth.forgot_password_description')}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          {...register('email')}
          type="email"
          placeholder={t('auth.email_placeholder')}
          error={errors.email?.message}
          disabled={isLoading}
        />

        <Button
          type="submit"
          className="w-full h-11"
          isLoading={isLoading}
          disabled={isLoading}
        >
          {t('auth.send_reset_link')}
        </Button>
      </form>
    </AuthPageLayout>
  );
};
