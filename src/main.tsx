import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './styles/design-tokens.css'
import './styles/globals.css'
import App from './App.tsx'
import { env } from './config/env'
import { initializeSentry } from './lib/sentry'

// Initialize Sentry for error tracking (only in production if DSN provided)
initializeSentry();

const googleClientId = env.VITE_GOOGLE_CLIENT_ID || ''

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)
