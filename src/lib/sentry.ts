/**
 * Sentry Error Logging Service
 * Centralized error tracking and performance monitoring for production
 */

import * as Sentry from '@sentry/react';
import { env } from '@/config/env';

/**
 * Initialize Sentry with environment-specific configuration
 * Only enabled in production when VITE_SENTRY_DSN is provided
 */
export const initializeSentry = (): void => {
  // Only initialize if DSN is provided (optional for development)
  if (!env.VITE_SENTRY_DSN) {
    console.log('ℹ️ Sentry DSN not provided - error tracking disabled');
    return;
  }

  const environment = env.VITE_SENTRY_ENVIRONMENT || 'development';
  const isProduction = environment === 'production';

  Sentry.init({
    dsn: env.VITE_SENTRY_DSN,
    environment,

    // Performance Monitoring
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true, // Privacy: mask all text in replays
        blockAllMedia: true, // Privacy: block all media in replays
      }),
    ],

    // Sample rate for performance monitoring (10% in production, 100% in dev)
    tracesSampleRate: isProduction ? 0.1 : 1.0,

    // Session replay sample rate (10% of errors in production)
    replaysSessionSampleRate: isProduction ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0, // Always capture replays on errors

    // Error filtering
    beforeSend(event, hint) {
      // Filter out errors from browser extensions
      const error = hint.originalException as Error;
      if (error?.stack?.includes('chrome-extension://')) {
        return null;
      }

      // Filter out errors from development
      if (!isProduction && event.level === 'warning') {
        return null;
      }

      return event;
    },

    // Ignore specific errors
    ignoreErrors: [
      // Browser extension errors
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      // Network errors (handled by axios)
      'Network Error',
      'Failed to fetch',
    ],
  });

  console.log(`✅ Sentry initialized for ${environment} environment`);
};

/**
 * Set user context for error tracking
 */
export const setSentryUser = (userId: string, email?: string, name?: string): void => {
  if (!env.VITE_SENTRY_DSN) return;

  Sentry.setUser({
    id: userId,
    email,
    username: name,
  });
};

/**
 * Clear user context (e.g., on logout)
 */
export const clearSentryUser = (): void => {
  if (!env.VITE_SENTRY_DSN) return;
  Sentry.setUser(null);
};

/**
 * Add breadcrumb for debugging context
 */
export const addBreadcrumb = (message: string, category?: string, level?: Sentry.SeverityLevel): void => {
  if (!env.VITE_SENTRY_DSN) return;

  Sentry.addBreadcrumb({
    message,
    category: category || 'custom',
    level: level || 'info',
    timestamp: Date.now() / 1000,
  });
};

/**
 * Capture an exception manually
 */
export const captureException = (error: Error, context?: Record<string, unknown>): void => {
  if (!env.VITE_SENTRY_DSN) {
    console.error('Sentry not initialized. Error:', error, context);
    return;
  }

  Sentry.captureException(error, {
    extra: context,
  });
};

/**
 * Capture a message manually
 */
export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info'): void => {
  if (!env.VITE_SENTRY_DSN) {
    console.log(`Sentry not initialized. Message [${level}]:`, message);
    return;
  }

  Sentry.captureMessage(message, level);
};

/**
 * Set custom context for errors
 */
export const setContext = (name: string, context: Record<string, unknown>): void => {
  if (!env.VITE_SENTRY_DSN) return;
  Sentry.setContext(name, context);
};

/**
 * Add tags to errors
 */
export const setTag = (key: string, value: string): void => {
  if (!env.VITE_SENTRY_DSN) return;
  Sentry.setTag(key, value);
};
