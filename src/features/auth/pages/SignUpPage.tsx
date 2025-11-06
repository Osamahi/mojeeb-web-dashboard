/**
 * Mojeeb Minimal Sign Up Page
 * Clean registration experience matching login page style
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
import { logger } from '@/lib/logger';

const signUpSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type SignUpForm = z.infer<typeof signUpSchema>;

export const SignUpPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (data: SignUpForm) => {
    setIsLoading(true);
    setError(null);

    try {
      await authService.register({
        name: data.name,
        email: data.email,
        password: data.password,
      });
      toast.success('Account created successfully!');
      navigate('/conversations');
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
        'Registration failed. Please try again.';

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
              Create your account
            </h1>
          </div>

          {/* Error Alert - Minimal */}
          {error && (
            <div className="mb-6 p-4 bg-error/5 border border-error/20 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          {/* Sign Up Form - Clean Inputs */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              {...register('name')}
              type="text"
              placeholder="Full name"
              error={errors.name?.message}
              disabled={isLoading}
            />

            <Input
              {...register('email')}
              type="email"
              placeholder="Email address"
              error={errors.email?.message}
              disabled={isLoading}
            />

            <Input
              {...register('password')}
              type="password"
              placeholder="Password"
              error={errors.password?.message}
              disabled={isLoading}
            />

            <Button
              type="submit"
              className="w-full h-11"
              isLoading={isLoading}
              disabled={isLoading}
            >
              Create Account
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
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-brand-cyan hover:text-brand-cyan/80 transition-colors font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
