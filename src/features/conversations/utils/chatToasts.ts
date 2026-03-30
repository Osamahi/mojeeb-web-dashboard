/**
 * Centralized Toast Messages for Chat Components
 * Single source of truth for all user-facing toast notifications
 * Pass translated strings from callers for i18n support.
 */

import { toast } from 'sonner';

export const chatToasts = {
  // Mode switching — accepts pre-translated message
  modeSwitch: (message: string) => toast.success(message),
  modeSwitchError: (message: string) => toast.error(message),

  // Message sending
  sendError: () => toast.error('Failed to send message. Please try again.'),
  messageTooLong: (maxLength: number) =>
    toast.error(`Message too long. Maximum ${maxLength} characters.`),

  // Message loading
  loadOlderMessagesError: () => toast.error('Failed to load older messages'),

  // Paste operations
  pasteTruncated: (maxLength: number) =>
    toast.warning(`Pasted text truncated to ${maxLength} characters`),

  // Copy operations
  copied: () => toast.success('Message copied to clipboard'),
} as const;
