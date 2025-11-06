/**
 * Centralized Logger Utility
 * Replaces console.* calls with structured logging that integrates with Sentry
 *
 * Usage:
 * - logger.debug('Debug message', { context }); // Only in development
 * - logger.info('Info message', { context });    // General information
 * - logger.warn('Warning message', { context }); // Warnings
 * - logger.error('Error message', error, { context }); // Errors -> Sentry
 */

import { env } from '@/config/env';
import { captureException, captureMessage, addBreadcrumb } from './sentry';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogContext = Record<string, unknown>;

const isDevelopment = env.VITE_SENTRY_ENVIRONMENT !== 'production';

/**
 * Format log message with timestamp and level
 */
const formatMessage = (level: LogLevel, message: string, context?: LogContext): string => {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` ${JSON.stringify(context)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
};

/**
 * Log debug messages (development only)
 */
const debug = (message: string, context?: LogContext): void => {
  if (!isDevelopment) return;

  const formatted = formatMessage('debug', message, context);
  console.debug(formatted);

  // Add breadcrumb for debugging
  addBreadcrumb(message, 'debug', 'debug');
};

/**
 * Log informational messages
 */
const info = (message: string, context?: LogContext): void => {
  const formatted = formatMessage('info', message, context);

  if (isDevelopment) {
    console.info(formatted);
  }

  // Add breadcrumb to Sentry
  addBreadcrumb(message, 'info', 'info');

  // Send to Sentry in production only if context indicates importance
  if (!isDevelopment && context?.sendToSentry) {
    captureMessage(message, 'info');
  }
};

/**
 * Log warning messages
 */
const warn = (message: string, context?: LogContext): void => {
  const formatted = formatMessage('warn', message, context);

  console.warn(formatted);

  // Add breadcrumb to Sentry
  addBreadcrumb(message, 'warning', 'warning');

  // Always send warnings to Sentry
  captureMessage(message, 'warning');
};

/**
 * Log error messages and send to Sentry
 */
const error = (message: string, error?: Error | unknown, context?: LogContext): void => {
  const formatted = formatMessage('error', message, context);

  console.error(formatted, error);

  // Add breadcrumb to Sentry
  addBreadcrumb(message, 'error', 'error');

  // Send error to Sentry
  if (error instanceof Error) {
    captureException(error, context);
  } else {
    // If error is not an Error object, create one
    const syntheticError = new Error(message);
    captureException(syntheticError, { ...context, originalError: error });
  }
};

/**
 * Log a successful operation (development only for cleaner logs)
 */
const success = (message: string, context?: LogContext): void => {
  if (!isDevelopment) return;

  const formatted = `✅ ${message}`;
  console.log(formatted, context);

  addBreadcrumb(message, 'success', 'info');
};

/**
 * Log the start of an operation (development only)
 */
const start = (operation: string, context?: LogContext): void => {
  if (!isDevelopment) return;

  const formatted = `🔄 Starting: ${operation}`;
  console.log(formatted, context);

  addBreadcrumb(`Starting: ${operation}`, 'operation', 'info');
};

/**
 * Log a performance metric
 */
const performance = (metric: string, duration: number, context?: LogContext): void => {
  if (!isDevelopment) return;

  const formatted = `⏱️ ${metric}: ${duration}ms`;
  console.log(formatted, context);

  addBreadcrumb(`Performance: ${metric} (${duration}ms)`, 'performance', 'info');
};

/**
 * Log API request/response (development only)
 */
const api = (method: string, url: string, status?: number, duration?: number): void => {
  if (!isDevelopment) return;

  const statusEmoji = status && status < 400 ? '✅' : '❌';
  const formatted = `${statusEmoji} ${method.toUpperCase()} ${url} ${status ? `[${status}]` : ''} ${duration ? `(${duration}ms)` : ''}`;
  console.log(formatted);

  addBreadcrumb(`API: ${method} ${url}`, 'http', status && status < 400 ? 'info' : 'error');
};

/**
 * Logger object with all logging methods
 */
export const logger = {
  debug,
  info,
  warn,
  error,
  success,
  start,
  performance,
  api,
};

/**
 * Create a scoped logger with a prefix
 * Useful for distinguishing logs from different modules
 */
export const createLogger = (scope: string) => ({
  debug: (message: string, context?: LogContext) => debug(`[${scope}] ${message}`, context),
  info: (message: string, context?: LogContext) => info(`[${scope}] ${message}`, context),
  warn: (message: string, context?: LogContext) => warn(`[${scope}] ${message}`, context),
  error: (message: string, error?: Error | unknown, context?: LogContext) => logger.error(`[${scope}] ${message}`, error, context),
  success: (message: string, context?: LogContext) => success(`[${scope}] ${message}`, context),
  start: (operation: string, context?: LogContext) => start(`[${scope}] ${operation}`, context),
  performance: (metric: string, duration: number, context?: LogContext) => performance(`[${scope}] ${metric}`, duration, context),
  api: (method: string, url: string, status?: number, duration?: number) => api(method, url, status, duration),
});
