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
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { authService } from '../services/authService';
import { toast } from 'sonner';

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
      navigate('/dashboard');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Minimal Card Container */}
        <div className="bg-white rounded-xl border border-neutral-200 p-8">
          {/* Logo & Header - Clean & Centered */}
          <div className="text-center mb-8">
            {/* Mojeeb Brand Logo */}
            <img
              src="/mojeeb-icon.png"
              alt="Mojeeb"
              className="w-14 h-14 mb-4 mx-auto"
            />

            <h1 className="text-2xl font-bold text-neutral-950 mb-2">
              Welcome to Mojeeb
            </h1>
            <p className="text-sm text-neutral-600">
              Sign in to manage your AI agents
            </p>
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
              Sign In
            </Button>
          </form>

          {/* Footer Link */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/forgot-password')}
              className="text-sm text-brand-cyan hover:text-brand-cyan/80 transition-colors"
              disabled={isLoading}
            >
              Forgot your password?
            </button>
          </div>
        </div>

        {/* Footer Text */}
        <p className="text-center mt-6 text-sm text-neutral-500">
          Powered by Mojeeb AI Platform
        </p>
      </div>
    </div>
  );
};
