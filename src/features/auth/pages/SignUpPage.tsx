/**
 * Mojeeb Minimal Sign Up Page
 * Clean registration experience matching login page style
 */

import { useState, useEffect } from 'react';
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
import { logger } from '@/lib/logger';
import { agentService } from '@/features/agents/services/agentService';
import { useAuthStore } from '../stores/authStore';

const signUpSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100, 'Password cannot exceed 100 characters'),
});

type SignUpForm = z.infer<typeof signUpSchema>;

export const SignUpPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const { register, handleSubmit, formState: { errors } } = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
  });

  // Redirect already-authenticated users who visit /signup directly
  useEffect(() => {
    if (isAuthenticated && !hasSubmitted) {
      navigate('/conversations', { replace: true });
    }
  }, [isAuthenticated, hasSubmitted, navigate]); // React to state changes

  const onSubmit = async (data: SignUpForm) => {
    setIsLoading(true);
    setError(null);

    // Mark submission BEFORE register to prevent useEffect redirect race condition
    // (authService.register sets isAuthenticated=true, which would trigger the useEffect)
    setHasSubmitted(true);

    try {
      // Register the user
      await authService.register({
        name: data.name,
        email: data.email,
        password: data.password,
      });

      toast.success('Account created successfully!');

      // Check if user needs onboarding (no agents) or can go straight to conversations
      try {
        const agents = await agentService.getAgents();

        if (agents.length === 0) {
          // New user with no agents - send to onboarding
          navigate('/onboarding', { replace: true });
        } else {
          // User already has agents (edge case) - skip onboarding
          navigate('/conversations', { replace: true });
        }
      } catch (agentError) {
        // If agent check fails, default to onboarding (safe fallback)
        logger.warn('Failed to check agents after signup, defaulting to onboarding', agentError);
        navigate('/onboarding', { replace: true });
      }
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
      // Reset hasSubmitted so user can retry (and useEffect guard works correctly)
      setHasSubmitted(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthPageLayout
      title="Create your account"
      error={error}
      isLoading={isLoading}
      footerContent={
        <AuthFooterLink
          text="Already have an account?"
          linkText="Sign in"
          linkTo="/login"
        />
      }
    >
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
    </AuthPageLayout>
  );
};
