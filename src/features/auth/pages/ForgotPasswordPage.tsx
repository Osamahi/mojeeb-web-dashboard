import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AxiosError } from 'axios';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { authService } from '../services/authService';
import { toast } from 'sonner';
import { AuthPageLayout } from '../components/AuthPageLayout';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true);

    try {
      await authService.forgotPassword(data);
      setIsSuccess(true);
      toast.success('Password reset link sent to your email');
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(axiosError.response?.data?.message || 'Failed to send reset link');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <AuthPageLayout
        title="Check Your Email"
        showSocialLogin={false}
      >
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-success/10 rounded-full mb-6">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
          <p className="text-neutral-600 mb-6">
            We've sent a password reset link to your email address.
            Please check your inbox and follow the instructions.
          </p>
          <Button
            onClick={() => navigate('/login')}
            className="w-full h-11"
          >
            Back to Login
          </Button>
        </div>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout
      title="Reset Password"
      showSocialLogin={false}
      footerContent={
        <div className="mt-6">
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors mx-auto"
            disabled={isLoading}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </button>
        </div>
      }
    >
      <div className="text-center mb-6">
        <p className="text-neutral-600 text-sm">
          Enter your email address and we'll send you a link to reset your password
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          {...register('email')}
          type="email"
          placeholder="Email address"
          error={errors.email?.message}
          disabled={isLoading}
        />

        <Button
          type="submit"
          className="w-full h-11"
          isLoading={isLoading}
          disabled={isLoading}
        >
          Send Reset Link
        </Button>
      </form>
    </AuthPageLayout>
  );
};
