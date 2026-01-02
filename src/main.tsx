import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './styles/design-tokens.css'
import './styles/globals.css'
import './i18n/config' // Initialize i18n BEFORE app renders
import i18n, { loadLanguage } from './i18n/config'
import { isValidLocale } from './i18n/locales'
import App from './App.tsx'
import { env } from './config/env'
import { initializeSentry } from './lib/sentry'
import { initializeClarity } from './lib/clarity'
import { startStorageMonitoring } from './lib/storageMonitor'
import { initializeLogoutListener } from './features/auth/services/logoutService'
import { analytics } from './lib/analytics'
import { initializeVerificationHelpers } from './lib/analytics/utils/verifyAnalytics'

// Initialize error tracking and analytics
initializeSentry(); // Error tracking (only in production if DSN provided)
initializeClarity(); // Session recording and UX analytics (only in production if Project ID provided)
analytics.initialize(); // Unified analytics (GTM, Meta Pixel, etc.)
initializeVerificationHelpers(); // Add browser console helpers for debugging

// Initialize multi-tab logout propagation
initializeLogoutListener(); // Listen for logout events from other tabs

// DIAGNOSTIC: Monitor localStorage changes to track auth issues
if (import.meta.env.DEV) {
  console.log('🔍 [Development] Initializing storage monitoring for auth debugging...');
  startStorageMonitoring();
}

const googleClientId = env.VITE_GOOGLE_CLIENT_ID || ''

// Explicit i18n bootstrap - load translations before rendering
const storedLng = localStorage.getItem('i18nextLng');
const lng = storedLng && isValidLocale(storedLng) ? storedLng : 'en';

try {
  await loadLanguage(lng);
  await i18n.changeLanguage(lng);

  // Set initial document direction and lang attribute
  const dir = lng.startsWith('ar') ? 'rtl' : 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = lng;
} catch (error) {
  console.error('Failed to initialize i18n with locale:', lng, error);

  // Fallback to English if initial load fails
  if (lng !== 'en') {
    console.warn('Attempting to load English fallback...');
    try {
      await loadLanguage('en');
      await i18n.changeLanguage('en');
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = 'en';
    } catch (fallbackError) {
      console.error('CRITICAL: Failed to load English fallback. App may not display translations correctly.', fallbackError);
      // App will still render, but translations may not work
    }
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)
