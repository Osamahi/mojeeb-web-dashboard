/**
 * Chat Bubble Color Constants
 * Centralized color definitions for user and assistant message bubbles
 */

export const CHAT_BUBBLE_COLORS = {
  user: {
    backgroundColor: '#FFFFFF',
    color: '#000000',
    borderColor: '#D4D4D4',
  },
  assistant: {
    backgroundColor: '#000000',
    color: '#FFFFFF',
    borderColor: '#000000',
  },
} as const;
