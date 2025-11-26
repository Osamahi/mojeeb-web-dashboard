# Mojeeb Dashboard - Azure Deployment Guide

## 📋 Overview

The Mojeeb Dashboard is deployed to **Azure Static Web Apps** with automatic GitHub Actions CI/CD.

- **Platform**: Azure Static Web Apps
- **Domain**: dashboard.mojeeb.app (to be configured)
- **Build**: React 19 + Vite
- **Auto-Deploy**: Push to `main` branch

---

## 🔐 Required GitHub Secrets

Add these secrets in GitHub repository settings (Settings → Secrets and variables → Actions):

### Azure Deployment Token
```
AZURE_STATIC_WEB_APPS_API_TOKEN_DASHBOARD=<deployment-token-from-azure>
```

### Environment Variables (All VITE_* variables)

#### Required:
```
VITE_API_URL=https://your-api-domain.azurewebsites.net
VITE_API_TIMEOUT=30000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_APP_NAME=Mojeeb Dashboard
VITE_APP_VERSION=1.0.0
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
VITE_APPLE_CLIENT_ID=com.mojeeb.signin
VITE_APPLE_REDIRECT_URI=https://dashboard.mojeeb.app/oauth/callback
```

#### Optional:
```
VITE_SENTRY_DSN=your-sentry-dsn
VITE_SENTRY_ENVIRONMENT=production
VITE_TOKEN_ENCRYPTION_KEY=your-encryption-key
```

---

## ⚙️ Build Configuration

### Build Command
```bash
npm run build:prod
```
This uses `vite build` directly (skips TypeScript check temporarily).

### Output Directory
```
dist/
```

### Routing Configuration
The `staticwebapp.config.json` file configures:
- SPA routing (all routes → index.html)
- Cache headers for assets
- 404 fallback handling

---

## 🚀 Deployment Process

### Automatic Deployment (GitHub Actions)

The workflow `.github/workflows/azure-static-web-apps-dashboard.yml` automatically:

1. **On Push to `main`**:
   - Installs dependencies (`npm ci`)
   - Builds React app (`npm run build:prod`)
   - Deploys `dist/` to Azure Static Web Apps

2. **On Pull Request**:
   - Creates preview deployment
   - Comments PR with preview URL
   - Cleans up when PR is closed

### Manual Deployment

If needed, you can deploy manually using Azure Static Web Apps CLI:

```bash
# Install SWA CLI
npm install -g @azure/static-web-apps-cli

# Build locally
npm run build:prod

# Deploy (requires Azure credentials)
swa deploy
```

---

## 🌐 Custom Domain Setup

### Step 1: Add Custom Domain in Azure

1. Go to Azure Portal → Your Static Web App
2. Navigate to "Custom domains"
3. Click "+ Add"
4. Enter: `dashboard.mojeeb.app`
5. Choose validation method (TXT or CNAME)

### Step 2: Configure DNS

Add DNS records in your domain provider:

**Option A: CNAME (Recommended)**
```
Type: CNAME
Name: dashboard
Value: <your-static-web-app>.azurestaticapps.net
TTL: 3600
```

**Option B: Apex Domain (A + TXT records)**
```
Type: A
Name: dashboard
Value: <IP-address-from-Azure>
TTL: 3600

Type: TXT
Name: _dnsauth.dashboard
Value: <validation-code-from-Azure>
TTL: 3600
```

### Step 3: Verify and Enable HTTPS

1. Wait for DNS propagation (5-60 minutes)
2. Click "Validate" in Azure Portal
3. Azure auto-provisions SSL certificate
4. HTTPS is enabled automatically

---

## ✅ Post-Deployment Checklist

After deploying to dashboard.mojeeb.app:

- [ ] Verify all environment variables are set in GitHub Secrets
- [ ] Test authentication flow (email, Google, Apple)
- [ ] Verify API connection works
- [ ] Test agent management features
- [ ] Verify conversations load correctly
- [ ] Test all OAuth integrations
- [ ] Check error tracking (Sentry) if configured

---

## 🔧 Backend Configuration Updates

After deployment, update backend services:

### 1. CORS Configuration
Add `https://dashboard.mojeeb.app` to allowed origins in your API.

### 2. OAuth Redirect URIs

**Google OAuth Console**:
- Authorized redirect URI: `https://dashboard.mojeeb.app/oauth/callback`

**Apple Sign In**:
- Return URL: `https://dashboard.mojeeb.app/oauth/callback`

---

## ⚠️ Known Issues

### TypeScript Build Errors

Currently, `npm run build` (with TypeScript check) fails with errors.

**Current Solution**: Using `npm run build:prod` which runs `vite build` directly.

**TODO**: Fix TypeScript errors for better type safety:
- Type import issues with `verbatimModuleSyntax`
- Unused variables/imports
- Type mismatches
- Missing Vitest global declarations

---

## 📊 Monitoring

### Azure Monitoring
- **Deployment History**: GitHub Actions → Actions tab
- **Azure Logs**: Azure Portal → Static Web App → Logs
- **Analytics**: Azure Portal → Static Web App → Metrics

### Error Tracking
- **Sentry** (if configured): Real-time error monitoring
- **Browser Console**: Client-side errors

---

## 🔄 Rollback

If issues occur after deployment:

### Option 1: Revert Git Commit
```bash
git revert <commit-hash>
git push origin main
```
GitHub Actions will auto-deploy the reverted version.

### Option 2: Azure Portal
1. Go to Azure Portal → Static Web App
2. Navigate to "Deployments"
3. Find previous working deployment
4. Click "Promote" to make it active

---

## 📁 Project Structure

```
mojeeb-dashboard/
├── .github/
│   └── workflows/
│       └── azure-static-web-apps-dashboard.yml  ← CI/CD workflow
├── dist/                                         ← Build output (not committed)
├── src/                                          ← Source code
├── staticwebapp.config.json                      ← Azure routing config
├── package.json                                  ← Dependencies & scripts
└── vite.config.ts                                ← Vite configuration
```

---

## 🆘 Troubleshooting

### Build Fails in GitHub Actions

1. Check GitHub Actions logs for errors
2. Verify all secrets are set correctly
3. Test build locally: `npm run build:prod`
4. Check for missing environment variables

### Deployment Succeeds But Site is Blank

1. Check browser console for errors
2. Verify `staticwebapp.config.json` is correct
3. Check if environment variables are set in GitHub Secrets
4. Verify API URL is accessible

### OAuth Redirects Not Working

1. Verify redirect URIs match exactly in OAuth provider
2. Must use HTTPS in production
3. Check CORS configuration in API

---

## 📞 Support Resources

- **Azure Static Web Apps Docs**: https://docs.microsoft.com/azure/static-web-apps/
- **GitHub Actions Logs**: Repository → Actions tab
- **Azure Portal**: https://portal.azure.com
