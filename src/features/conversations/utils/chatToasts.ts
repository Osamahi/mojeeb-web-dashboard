/**
 * Centralized Toast Messages for Chat Components
 * Single source of truth for all user-facing toast notifications
 */

import { toast } from 'sonner';

export const chatToasts = {
  // Mode switching
  modeSwitch: (isAI: boolean) =>
    toast.success(`Switched to ${isAI ? 'AI' : 'Human'} mode`),
  modeSwitchError: () => toast.error('Failed to switch mode'),

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
