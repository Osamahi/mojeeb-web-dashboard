/**
 * Chat Bubble Color Constants
 * Centralized color definitions for user and assistant message bubbles
 * Following Minimal Design System (Chatbase-inspired)
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

/**
 * Minimal Color Palette
 * Monochrome-first design with green accent for essential actions
 */
export const MINIMAL_COLORS = {
  // Monochrome Palette (PRIMARY)
  black: '#000000',
  white: '#FFFFFF',
  grey900: '#0A0A0A',
  grey700: '#262626',
  grey500: '#525252',
  grey300: '#A3A3A3',
  grey100: '#E5E5E5',
  grey50: '#F5F5F5',

  // Brand Color (USE SPARINGLY)
  brandGreen: '#00bd6f',

  // UI Element Colors
  borderLight: '#D4D4D4',
  textPrimary: '#0A0A0A',
  textSecondary: '#525252',
  textTertiary: '#737373',
} as const;
