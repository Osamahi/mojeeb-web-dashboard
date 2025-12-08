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
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { authService } from '../services/authService';
import { toast } from 'sonner';
import { AuthPageLayout } from '../components/AuthPageLayout';
import { AuthFooterLink } from '../components/AuthFooterLink';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export const LoginPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const errorMessage = axiosError.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthPageLayout
      title="Welcome back"
      error={error}
      isLoading={isLoading}
      footerContent={
        <AuthFooterLink
          text="Don't have an account?"
          linkText="Sign up"
          linkTo="/signup"
        />
      }
    >
      {/* Login Form - Clean Inputs */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          {...register('email')}
          type="email"
          placeholder="Email address"
          error={errors.email?.message}
          disabled={isLoading}
        />

        <div className="space-y-2">
          <Input
            {...register('password')}
            type="password"
            placeholder="Password"
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
              Forgot password?
            </button>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-11"
          isLoading={isLoading}
          disabled={isLoading}
        >
          Sign In
        </Button>
      </form>
    </AuthPageLayout>
  );
};
