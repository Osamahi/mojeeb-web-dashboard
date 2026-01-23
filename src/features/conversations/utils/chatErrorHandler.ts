/**
 * Centralized Chat Error Handler
 * Provides consistent error handling across all chat features
 * Replaces scattered error handling patterns in useChatEngine, chatStore, etc.
 */

import { logger } from '@/lib/logger';
import { toast } from 'sonner';
import { getErrorMessage, toAppError, type CatchError } from '@/lib/errors';

/**
 * Context information for error logging
 */
export interface ChatErrorContext {
  /** Component or feature where error occurred */
  component?: string;
  /** Conversation ID if applicable */
  conversationId?: string;
  /** Message ID if applicable */
  messageId?: string;
  /** Agent ID if applicable */
  agentId?: string;
  /** Additional context data */
  [key: string]: unknown;
}

/**
 * Error handler options
 */
export interface ChatErrorHandlerOptions {
  /** Show toast notification (default: true) */
  showToast?: boolean;
  /** Log error (default: true) */
  logError?: boolean;
  /** Custom toast message (overrides default) */
  toastMessage?: string;
  /** Custom error callback */
  onError?: (error: Error) => void;
  /** Rethrow error after handling (default: false) */
  rethrow?: boolean;
}

/**
 * Centralized chat error handler
 *
 * @example
 * ```typescript
 * try {
 *   await sendMessage(content);
 * } catch (error) {
 *   handleChatError(error, {
 *     component: 'ChatPanel',
 *     conversationId: conversation.id,
 *   });
 * }
 * ```
 */
export function handleChatError(
  error: CatchError,
  context: ChatErrorContext,
  options: ChatErrorHandlerOptions = {}
): void {
  const {
    showToast = true,
    logError = true,
    toastMessage,
    onError,
    rethrow = false,
  } = options;

  // Convert to AppError for consistent handling
  const appError = toAppError(error);

  // Log error with context
  if (logError) {
    logger.error('Chat operation failed', appError, context);
  }

  // Show user-friendly toast notification
  if (showToast) {
    const message = toastMessage || getErrorMessage(appError);
    toast.error(message);
  }

  // Call custom error callback
  if (onError) {
    onError(appError);
  }

  // Rethrow if requested
  if (rethrow) {
    throw appError;
  }
}

/**
 * Specific error handlers for common chat operations
 */

/**
 * Handle message send errors
 * Uses backend's error message for user-friendly context
 */
export function handleMessageSendError(
  error: CatchError,
  context: ChatErrorContext
): void {
  // Don't override toastMessage - let it fall back to getErrorMessage()
  // This extracts the backend's friendly message (e.g., "Message limit exceeded...")
  handleChatError(error, context);
}

/**
 * Handle message fetch errors
 */
export function handleMessageFetchError(
  error: CatchError,
  context: ChatErrorContext
): void {
  handleChatError(error, context, {
    toastMessage: 'Failed to load messages. Please refresh the page.',
  });
}

/**
 * Handle real-time subscription errors
 * Shows reconnecting message instead of error to avoid alarming users
 */
export function handleSubscriptionError(
  error: CatchError,
  context: ChatErrorContext,
  options?: { showAsReconnecting?: boolean }
): void {
  const showAsReconnecting = options?.showAsReconnecting ?? true;

  handleChatError(error, context, {
    // If showing as reconnecting, don't display an error toast
    // The AuthInitializer will show the reconnecting overlay
    showToast: !showAsReconnecting,
    toastMessage: showAsReconnecting
      ? undefined // Don't show toast when reconnecting
      : 'Failed to connect to real-time updates. Retrying...',
    logError: true, // Still log for debugging
  });
}

/**
 * Handle connection errors on app resume (mobile browsers)
 * Silently logs error and lets reconnection logic handle it
 */
export function handleConnectionResumeError(
  error: CatchError,
  context: ChatErrorContext
): void {
  handleChatError(error, context, {
    showToast: false, // Don't show error toast - reconnecting UI will appear
    logError: true,
    toastMessage: undefined,
  });
}

/**
 * Handle AI response timeout errors
 */
export function handleAITimeoutError(context: ChatErrorContext): void {
  const error = new Error('AI response timeout after 30 seconds');
  handleChatError(error, context, {
    toastMessage: 'AI is taking longer than expected. Please wait or try again.',
  });
}

/**
 * Handle mode toggle errors
 */
export function handleModeToggleError(
  error: CatchError,
  context: ChatErrorContext,
  attemptedMode: 'AI' | 'Human'
): void {
  handleChatError(error, context, {
    toastMessage: `Failed to switch to ${attemptedMode} mode. Please try again.`,
  });
}

/**
 * Handle file upload errors
 */
export function handleFileUploadError(
  error: CatchError,
  context: ChatErrorContext,
  fileName?: string
): void {
  const message = fileName
    ? `Failed to upload ${fileName}. Please try again.`
    : 'Failed to upload file. Please try again.';

  handleChatError(error, context, {
    toastMessage: message,
  });
}

/**
 * Error handler for retry operations
 * Suppresses toast on first few attempts to avoid spam
 */
export function handleRetryError(
  error: CatchError,
  context: ChatErrorContext,
  attemptNumber: number,
  maxAttempts: number
): void {
  const isLastAttempt = attemptNumber >= maxAttempts;

  handleChatError(error, {
    ...context,
    attemptNumber,
    maxAttempts,
  }, {
    showToast: isLastAttempt, // Only show toast on last attempt
    toastMessage: isLastAttempt
      ? 'Failed to send message after multiple attempts. Please try again.'
      : undefined,
  });
}
