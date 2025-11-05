/**
 * Mojeeb Minimal Design System - Design Tokens
 * Centralized constants for colors, spacing, typography, and animations
 * Based on Mojeeb brand guidelines with minimal aesthetic
 */

// =============================================================================
// COLORS
// =============================================================================

export const colors = {
  // Brand Colors (Use sparingly - 10% of UI)
  brand: {
    cyan: '#00DBB7',    // Primary actions, links
    green: '#7DFF51',   // Success states, highlights
    dark: '#0A0A17',    // Brand dark, main text
  },

  // Neutral Scale (Monochrome foundation - 90% of UI)
  neutral: {
    50: '#F9F9FC',      // Lightest backgrounds
    100: '#F2F2F7',     // Light backgrounds
    200: '#E5E5ED',     // Borders, dividers
    300: '#CBCBD6',     // Subtle borders
    400: '#A3A3B3',     // Placeholder text
    500: '#7A7A8B',     // Secondary text
    600: '#525263',     // Body text
    700: '#3A3A4E',     // Strong text
    800: '#2A2A3E',     // Headings
    900: '#1A1A2E',     // Dark headings
    950: '#0A0A17',     // Brand dark
  },

  // Supportive Colors (from brand guidelines)
  support: {
    teal: '#4C635F',
    mint: '#E4F7F4',
    lime: '#E4FFDB',
    yellow: '#E8FF4F',
    sage: '#CED6CB',
  },

  // Semantic Colors
  semantic: {
    success: '#7DFF51',  // Green
    error: '#EF4444',    // Red
    warning: '#F59E0B',  // Amber
    info: '#00DBB7',     // Cyan
  },

  // Pure Colors
  pure: {
    white: '#FFFFFF',
    black: '#000000',
  },
} as const;

// =============================================================================
// SPACING (8px grid system)
// =============================================================================

export const spacing = {
  0: '0px',
  0.5: '2px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
} as const;

// =============================================================================
// TYPOGRAPHY
// =============================================================================

export const typography = {
  // Font Families
  fontFamily: {
    sans: '"Alexandria", system-ui, -apple-system, sans-serif',
    arabic: '"Loew Next Arabic", system-ui, sans-serif',
    mono: '"JetBrains Mono", monospace',
  },

  // Font Sizes (with line heights)
  fontSize: {
    xs: { size: '12px', lineHeight: '16px' },    // Captions, labels
    sm: { size: '14px', lineHeight: '20px' },    // Body secondary
    base: { size: '16px', lineHeight: '24px' },  // Body primary
    lg: { size: '18px', lineHeight: '28px' },    // Subheadings
    xl: { size: '20px', lineHeight: '28px' },    // Headings
    '2xl': { size: '24px', lineHeight: '32px' }, // Page titles
    '3xl': { size: '30px', lineHeight: '36px' }, // Display
  },

  // Font Weights
  fontWeight: {
    light: 300,
    regular: 400,
    medium: 500,
    bold: 700,
    extrabold: 800,
    black: 900,
  },
} as const;

// =============================================================================
// BORDER RADIUS (Minimal)
// =============================================================================

export const borderRadius = {
  none: '0px',
  sm: '4px',      // Buttons, inputs
  md: '6px',      // Cards, containers
  lg: '8px',      // Modals, panels
  xl: '12px',     // Hero sections
  full: '9999px', // Pills, avatars
} as const;

// =============================================================================
// SHADOWS (Minimal - use sparingly)
// =============================================================================

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  // Note: Minimal design - avoid using shadows when possible, use borders instead
} as const;

// =============================================================================
// ANIMATIONS
// =============================================================================

export const animations = {
  duration: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
  },
  easing: {
    easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

// =============================================================================
// COMPONENT TOKENS
// =============================================================================

export const components = {
  // Button
  button: {
    height: {
      sm: '36px',
      md: '40px',
      lg: '44px',
    },
    padding: {
      sm: '10px 16px',
      md: '12px 24px',
      lg: '14px 32px',
    },
  },

  // Input
  input: {
    height: {
      sm: '36px',
      md: '40px',
      lg: '44px',
    },
    padding: '10px 14px',
  },

  // Card
  card: {
    padding: '24px',
    border: `1px solid ${colors.neutral[200]}`,
    borderRadius: borderRadius.lg,
  },

  // Sidebar
  sidebar: {
    // Widths
    width: {
      expanded: '256px',    // w-64 (desktop default)
      collapsed: '80px',    // w-20 (desktop collapsed to icon-only)
    },

    // Colors
    backgroundColor: colors.neutral[50],
    borderRight: `1px solid ${colors.neutral[200]}`,

    // Mobile overlay
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      backdropBlur: '4px',
    },

    // Animations
    transition: {
      duration: animations.duration.normal, // 200ms
      easing: animations.easing.easeOut,
    },
  },

  // Header
  header: {
    height: '60px',
    backgroundColor: colors.pure.white,
    borderBottom: `1px solid ${colors.neutral[200]}`,
  },
} as const;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get color value by path (e.g., 'brand.cyan', 'neutral.500')
 */
export function getColor(path: string): string {
  const parts = path.split('.');
  let value: any = colors;

  for (const part of parts) {
    value = value[part];
    if (!value) return '';
  }

  return value;
}

/**
 * Get spacing value by key
 */
export function getSpacing(key: keyof typeof spacing): string {
  return spacing[key];
}

/**
 * Create focus ring styles (for accessibility)
 */
export function focusRing(color: string = colors.brand.cyan): string {
  return `outline: 2px solid ${color}20; outline-offset: 2px;`;
}

// =============================================================================
// EXPORTS
// =============================================================================

export const designTokens = {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
  animations,
  components,
} as const;

export default designTokens;
