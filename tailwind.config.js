/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Mojeeb Brand Colors - Minimal Palette
        brand: {
          cyan: '#00DBB7',    // Primary accent
          green: '#7DFF51',   // Success & highlights
          dark: '#0A0A17',    // Brand dark
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
          950: '#0A0A17',     // Brand dark (same as brand.dark)
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
        success: '#7DFF51',   // Green
        error: '#EF4444',     // Red
        warning: '#F59E0B',   // Amber
        info: '#00DBB7',      // Cyan
      },
      fontFamily: {
        // Mojeeb Brand Fonts
        sans: ['Alexandria', 'system-ui', '-apple-system', 'sans-serif'],
        arabic: ['Loew Next Arabic', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        // Minimal Typography Scale
        'xs': ['0.75rem', { lineHeight: '1rem' }],        // 12px - captions, labels
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],    // 14px - body secondary
        'base': ['1rem', { lineHeight: '1.5rem' }],       // 16px - body primary
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],    // 18px - subheadings
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],     // 20px - headings
        '2xl': ['1.5rem', { lineHeight: '2rem' }],        // 24px - page titles
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],   // 30px - display
      },
      spacing: {
        // 8px Grid System (already good, keeping existing)
        '18': '4.5rem',  // 72px
        '88': '22rem',   // 352px
      },
      borderRadius: {
        // Minimal Border Radius
        'sm': '0.25rem',    // 4px - buttons, inputs
        'DEFAULT': '0.375rem', // 6px - default
        'md': '0.375rem',   // 6px - cards, containers
        'lg': '0.5rem',     // 8px - modals, panels
        'xl': '0.75rem',    // 12px - hero sections
        'full': '9999px',   // Pills, avatars
      },
      animation: {
        // Minimal smooth animations
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'shimmer': 'shimmer 2s infinite',
        // Enhanced loading animations
        'pulse-ring': 'pulseRing 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'rotate-slow': 'rotateSlow 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        // Enhanced loading keyframes
        pulseRing: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.05)', opacity: '0.8' },
        },
        rotateSlow: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
}
