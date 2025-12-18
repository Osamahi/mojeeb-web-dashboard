import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './styles/design-tokens.css'
import './styles/globals.css'
import App from './App.tsx'
import { env } from './config/env'
import { initializeSentry } from './lib/sentry'
import { initializeClarity } from './lib/clarity'
import { startStorageMonitoring } from './lib/storageMonitor'

// Initialize error tracking and analytics
initializeSentry(); // Error tracking (only in production if DSN provided)
initializeClarity(); // Session recording and UX analytics (only in production if Project ID provided)

// DIAGNOSTIC: Monitor localStorage changes to track auth issues
if (import.meta.env.DEV) {
  console.log('🔍 [Development] Initializing storage monitoring for auth debugging...');
  startStorageMonitoring();
}

const googleClientId = env.VITE_GOOGLE_CLIENT_ID || ''

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)
