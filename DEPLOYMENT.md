# Mojeeb Dashboard - Deployment Guide

## Environment Variables for Vercel

### Required Variables

```bash
# API Configuration
VITE_API_URL=https://your-api-domain.azurewebsites.net
VITE_API_TIMEOUT=30000

# Supabase Configuration (REQUIRED)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here

# App Configuration
VITE_APP_NAME=Mojeeb Dashboard
VITE_APP_VERSION=1.0.0

# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Apple Sign-In Configuration
VITE_APPLE_CLIENT_ID=com.mojeeb.signin
VITE_APPLE_REDIRECT_URI=https://dashboard.mojeeb.app/oauth/callback
```

### Optional Variables

```bash
# Error Tracking (Sentry)
VITE_SENTRY_DSN=your-sentry-dsn
VITE_SENTRY_ENVIRONMENT=production

# Security
VITE_TOKEN_ENCRYPTION_KEY=your-encryption-key-for-secure-storage
```

## Vercel Configuration

### Build Settings
- **Framework Preset**: Vite
- **Build Command**: `vite build` (skip TypeScript check temporarily)
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Environment Variables Setup in Vercel

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add all variables from above
4. Select environment: Production, Preview, Development (as needed)

## Custom Domain Configuration

### DNS Settings for dashboard.mojeeb.app

After adding the custom domain in Vercel, you'll get one of these configurations:

**Option A: CNAME Record**
```
Type: CNAME
Name: dashboard
Value: cname.vercel-dns.com
```

**Option B: A Record**
```
Type: A
Name: dashboard
Value: 76.76.21.21
```

### SSL Certificate
- Vercel automatically provisions Let's Encrypt SSL certificates
- HTTPS will be enabled automatically after DNS propagation

## Deployment Workflow

### Automatic Deployments
- **Production**: Push to `main` branch → auto-deploy to dashboard.mojeeb.app
- **Preview**: Create PR → auto-deploy preview environment

### Manual Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod
```

## Post-Deployment Checklist

- [ ] Verify all environment variables are set correctly
- [ ] Test authentication flow (email, Google, Apple)
- [ ] Verify API connection works
- [ ] Test agent management features
- [ ] Verify conversations load correctly
- [ ] Test all OAuth integrations
- [ ] Check error tracking (Sentry) if configured

## Backend Configuration Updates

After deploying to dashboard.mojeeb.app, update:

1. **CORS Configuration** - Add `dashboard.mojeeb.app` to allowed origins
2. **Google OAuth** - Update redirect URI to `https://dashboard.mojeeb.app/oauth/callback`
3. **Apple Sign In** - Update redirect URI to `https://dashboard.mojeeb.app/oauth/callback`

## Known Issues

### TypeScript Build Errors
Currently, there are TypeScript errors that prevent `npm run build` from working.

**Temporary Solution**: Use `vite build` instead (configured in Vercel)

**TODO**: Fix TypeScript errors:
- Type import issues with `verbatimModuleSyntax`
- Unused variables/imports
- Type mismatches
- Missing Vitest global declarations

## Monitoring

- **Vercel Analytics**: Built-in performance monitoring
- **Sentry** (if configured): Error tracking and monitoring
- **Vercel Logs**: Real-time deployment and runtime logs

## Rollback

If issues occur after deployment:

1. Go to Vercel dashboard
2. Navigate to "Deployments"
3. Find previous working deployment
4. Click "..." → "Promote to Production"
