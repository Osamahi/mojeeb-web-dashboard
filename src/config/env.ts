/**
 * Environment Variable Validation
 * Uses Zod for runtime validation of all environment variables
 * Fails fast on startup if required variables are missing or invalid
 */

import { z } from 'zod';

const envSchema = z.object({
  // API Configuration
  VITE_API_URL: z.string().url('VITE_API_URL must be a valid URL'),
  VITE_API_TIMEOUT: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 30000))
    .pipe(z.number().positive('VITE_API_TIMEOUT must be positive')),

  // Supabase Configuration (Required)
  VITE_SUPABASE_URL: z.string().url('VITE_SUPABASE_URL must be a valid URL'),
  VITE_SUPABASE_ANON_KEY: z
    .string()
    .min(1, 'VITE_SUPABASE_ANON_KEY is required')
    .startsWith('eyJ', 'VITE_SUPABASE_ANON_KEY must be a valid JWT'),

  // OAuth Configuration (Optional)
  VITE_GOOGLE_CLIENT_ID: z.string().optional(),
  VITE_GOOGLE_REDIRECT_URI: z.string().url().optional(),
  VITE_APPLE_CLIENT_ID: z.string().optional(),
  VITE_APPLE_REDIRECT_URI: z.string().url().optional(),

  // Error Logging (Optional)
  VITE_SENTRY_DSN: z
    .string()
    .transform((val) => (val === '' ? undefined : val))
    .pipe(z.string().url().optional()),
  VITE_SENTRY_ENVIRONMENT: z.string().optional(),

  // Analytics (Optional)
  VITE_CLARITY_PROJECT_ID: z.string().optional(),

  // Security (Optional)
  VITE_TOKEN_ENCRYPTION_KEY: z
    .string()
    .transform((val) => (val === '' ? undefined : val))
    .pipe(z.string().min(16).optional()),
});

// Parse and validate environment variables
const parseEnv = () => {
  const result = envSchema.safeParse({
    VITE_API_URL: import.meta.env.VITE_API_URL,
    VITE_API_TIMEOUT: import.meta.env.VITE_API_TIMEOUT,
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    VITE_GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    VITE_GOOGLE_REDIRECT_URI: import.meta.env.VITE_GOOGLE_REDIRECT_URI,
    VITE_APPLE_CLIENT_ID: import.meta.env.VITE_APPLE_CLIENT_ID,
    VITE_APPLE_REDIRECT_URI: import.meta.env.VITE_APPLE_REDIRECT_URI,
    VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
    VITE_SENTRY_ENVIRONMENT: import.meta.env.VITE_SENTRY_ENVIRONMENT,
    VITE_CLARITY_PROJECT_ID: import.meta.env.VITE_CLARITY_PROJECT_ID,
    VITE_TOKEN_ENCRYPTION_KEY: import.meta.env.VITE_TOKEN_ENCRYPTION_KEY,
  });

  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    console.error(result.error.flatten().fieldErrors);
    throw new Error(
      `Environment validation failed:\n${JSON.stringify(result.error.flatten().fieldErrors, null, 2)}`
    );
  }

  return result.data;
};

// Export validated and typed environment variables
export const env = parseEnv();

// Type-safe access to environment variables
export type Env = z.infer<typeof envSchema>;
