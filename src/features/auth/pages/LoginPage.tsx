/**
 * Mojeeb Minimal Login Page
 * Ultra-clean login experience with Mojeeb brand identity
 * NO animations, NO gradients (except logo), just professional simplicity
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AxiosError } from 'axios';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { authService } from '../services/authService';
import { toast } from 'sonner';
import { SocialLoginButtons } from '../components/SocialLoginButtons';

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
      toast.success('Welcome back!');
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
              Welcome back
            </h1>
          </div>

          {/* Error Alert - Minimal */}
          {error && (
            <div className="mb-6 p-4 bg-error/5 border border-error/20 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

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

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-neutral-500">Or continue with</span>
            </div>
          </div>

          {/* Social Login Buttons */}
          <SocialLoginButtons disabled={isLoading} />

          {/* Footer Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-600">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="text-brand-cyan hover:text-brand-cyan/80 transition-colors font-medium"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
