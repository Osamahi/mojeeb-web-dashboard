import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { authService } from '../services/authService';
import { toast } from 'sonner';

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
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send reset link');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card glass className="text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                Check Your Email
              </h2>
              <p className="text-neutral-600">
                We've sent a password reset link to your email address.
                Please check your inbox and follow the instructions.
              </p>
            </div>

            <Button
              onClick={() => navigate('/login')}
              className="w-full"
            >
              Back to Login
            </Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card glass>
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">
              Reset Password
            </h1>
            <p className="text-neutral-600">
              Enter your email address and we'll send you a link to reset your password
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none z-10" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="Email address"
                  className="w-full pl-11 pr-4 py-3 rounded-lg border border-neutral-300 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold"
              isLoading={isLoading}
              disabled={isLoading}
            >
              Send Reset Link
            </Button>
          </form>

          {/* Back to login */}
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
        </Card>
      </motion.div>
    </div>
  );
};
