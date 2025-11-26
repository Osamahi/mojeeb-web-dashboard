/**
 * Sidebar Layout Constants
 * Centralized dimensions and configuration for the sidebar component
 */

export const SIDEBAR_DIMENSIONS = {
  // Desktop widths
  COLLAPSED_WIDTH: 80, // px - icon-only width
  EXPANDED_WIDTH: 256, // px - full sidebar width

  // Mobile dimensions
  MOBILE_WIDTH: 256, // px - drawer width

  // Layout offsets
  HEADER_HEIGHT: 64, // px - fixed header height (h-16 = 64px)
} as const;

export const SIDEBAR_ANIMATIONS = {
  // Framer Motion easing
  EASE_CURVE: [0.16, 1, 0.3, 1] as const,

  // Durations in seconds
  DESKTOP_TRANSITION: 0.25,
  MOBILE_TRANSITION: 0.2,
  OVERLAY_TRANSITION: 0.2,
} as const;

export const SIDEBAR_Z_INDEX = {
  DESKTOP: 30,
  OVERLAY: 40,
  MOBILE: 50,
} as const;
