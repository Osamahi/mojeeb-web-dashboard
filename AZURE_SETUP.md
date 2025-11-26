# Azure Static Web Apps - Step-by-Step Setup Guide

## ✅ Pre-requisites Complete

- ✅ React dashboard builds successfully (`npm run build:prod`)
- ✅ GitHub repository ready (`mojeeb-web-dashboard`)
- ✅ GitHub Actions workflow configured
- ✅ Azure routing configuration created (`staticwebapp.config.json`)

---

## 📋 Step-by-Step Deployment

### Step 1: Commit and Push Configuration (If Not Done)

```bash
# Verify files are committed
git status

# If needed, commit
git add .
git commit -m "Add Azure Static Web Apps configuration"
git push origin main
```

### Step 2: Create Azure Static Web App

1. **Go to Azure Portal**: [portal.azure.com](https://portal.azure.com)

2. **Click "+ Create a resource"**

3. **Search for "Static Web App"** and select it

4. **Click "Create"**

### Step 3: Configure Basic Settings

**Subscription**: Select your Azure subscription

**Resource Group**:
- Use existing or create new (e.g., `mojeeb-resources`)

**Name**:
```
mojeeb-dashboard
```
This will create URL: `https://mojeeb-dashboard-<random>.azurestaticapps.net`

**Region**:
- Choose closest to your users (e.g., West Europe, East US)

**Plan Type**:
- **Free** (recommended for start)
- Standard (if need more bandwidth/custom features)

### Step 4: Configure Deployment Details

**Source**: GitHub

**GitHub Account**: Sign in and authorize Azure

**Organization**: Your GitHub username/organization

**Repository**: `mojeeb-web-dashboard`

**Branch**: `main`

### Step 5: Build Configuration

Azure will auto-detect React/Vite. Verify these settings:

**Build Presets**: React

**App location**: `/` (root)

**API location**: *(leave empty)*

**Output location**: `dist`

**Note**: The GitHub Actions workflow we created will override these settings.

### Step 6: Review and Create

1. Click "Review + Create"
2. Review all settings
3. Click "Create"
4. Wait 2-3 minutes for deployment

### Step 7: Get Deployment Token

After creation:

1. Go to your Static Web App resource
2. Click "Manage deployment token" in the Overview page
3. Copy the deployment token
4. **SAVE THIS TOKEN** - you'll need it for GitHub Secrets

### Step 8: Configure GitHub Secrets

1. Go to your GitHub repository: `github.com/Osamahi/mojeeb-web-dashboard`

2. Navigate to: **Settings** → **Secrets and variables** → **Actions**

3. Click "New repository secret" and add:

#### Deployment Token
```
Name: AZURE_STATIC_WEB_APPS_API_TOKEN_DASHBOARD
Value: <paste-the-deployment-token-from-step-7>
```

#### Environment Variables (Add each as separate secret)

**Required Secrets:**
```
VITE_API_URL
VITE_API_TIMEOUT
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_APP_NAME
VITE_APP_VERSION
VITE_GOOGLE_CLIENT_ID
VITE_APPLE_CLIENT_ID
VITE_APPLE_REDIRECT_URI
```

**Optional Secrets:**
```
VITE_SENTRY_DSN
VITE_SENTRY_ENVIRONMENT
VITE_TOKEN_ENCRYPTION_KEY
```

**Example:**
```
Name: VITE_API_URL
Value: https://your-api.azurewebsites.net

Name: VITE_SUPABASE_URL
Value: https://abc123.supabase.co

... (continue for all variables)
```

### Step 9: Delete Auto-Created Workflow (Important!)

Azure automatically creates a workflow file. We need to use our custom one instead:

1. In GitHub, go to: `.github/workflows/`

2. You'll see TWO workflow files:
   - `azure-static-web-apps-dashboard.yml` (our custom one) ✅ KEEP
   - `azure-static-web-apps-<random-id>.yml` (auto-created) ❌ DELETE

3. Delete the auto-created workflow file:
   ```bash
   git rm .github/workflows/azure-static-web-apps-<random-id>.yml
   git commit -m "Remove auto-generated workflow, using custom workflow"
   git push origin main
   ```

### Step 10: Trigger First Deployment

After adding all secrets:

1. Make a small change to trigger workflow:
   ```bash
   git commit --allow-empty -m "Trigger Azure deployment"
   git push origin main
   ```

2. Go to GitHub → Actions tab

3. Watch the deployment progress

4. Wait for green checkmark (success)

### Step 11: Test Staging URL

Once deployment succeeds:

1. Go to Azure Portal → Your Static Web App
2. Click on the URL (e.g., `https://mojeeb-dashboard-<random>.azurestaticapps.net`)
3. Test the dashboard:
   - [ ] Page loads
   - [ ] Login form appears
   - [ ] No console errors
   - [ ] Can attempt login (API connection)

### Step 12: Add Custom Domain (dashboard.mojeeb.app)

Once staging works:

1. In Azure Portal → Static Web App → **Custom domains**

2. Click "+ Add"

3. **Domain name**: `dashboard.mojeeb.app`

4. **Hostname record type**: Choose one:
   - **CNAME** (recommended if supported)
   - **TXT** (for validation)

5. Azure shows DNS records to add

### Step 13: Configure DNS

In your domain provider (where mojeeb.app is registered):

**Option A: CNAME (Recommended)**
```
Type: CNAME
Name: dashboard
Value: mojeeb-dashboard-<random>.azurestaticapps.net
TTL: 3600
```

**Option B: A Record + TXT**
```
Type: A
Name: dashboard
Value: <IP-from-Azure>
TTL: 3600

Type: TXT
Name: _dnsauth.dashboard
Value: <validation-code-from-Azure>
TTL: 3600
```

### Step 14: Validate Domain

1. Wait 5-60 minutes for DNS propagation
2. Check propagation: [dnschecker.org](https://dnschecker.org)
3. In Azure Portal, click "Validate"
4. Once validated, Azure auto-provisions SSL certificate
5. HTTPS enabled automatically

### Step 15: Verify Production Domain

Test `https://dashboard.mojeeb.app`:
- [ ] HTTPS working (lock icon)
- [ ] Full authentication flow
- [ ] All features work
- [ ] No console errors

---

## 🎯 Post-Deployment Tasks

### Update Backend CORS

Add to your API's allowed origins:
```
https://dashboard.mojeeb.app
```

### Update OAuth Providers

**Google OAuth Console**:
1. Go to Google Cloud Console
2. APIs & Services → Credentials
3. Add authorized redirect URI: `https://dashboard.mojeeb.app/oauth/callback`

**Apple Sign In**:
1. Go to Apple Developer Console
2. Certificates, Identifiers & Profiles
3. Update Return URL: `https://dashboard.mojeeb.app/oauth/callback`

### Update Landing Page

Update sign-in links in `mojeeb-landing/index.html`:
```
OLD: https://app.mojeeb.app
NEW: https://dashboard.mojeeb.app
```

---

## 🔧 Troubleshooting

### Workflow Fails with "No secret found"

**Solution**: Double-check all GitHub Secrets are added correctly. Secret names are case-sensitive.

### Build Succeeds But Deployment Fails

**Solution**:
1. Check Azure deployment logs
2. Verify deployment token is correct
3. Ensure only ONE workflow file exists

### DNS Not Propagating

**Solution**:
1. Use [dnschecker.org](https://dnschecker.org) to monitor
2. Can take up to 48 hours (usually 5-60 min)
3. Clear browser cache
4. Try incognito mode

### Site Loads But Shows Blank Page

**Solution**:
1. Open browser console (F12)
2. Check for JavaScript errors
3. Verify environment variables in GitHub Secrets
4. Check API URL is accessible

---

## 📊 Monitoring & Management

### View Deployment History
- **GitHub**: Repository → Actions tab
- **Azure**: Static Web App → Deployments

### View Logs
- **Azure Portal**: Static Web App → Log Stream
- **Application Insights**: For advanced monitoring

### Redeploy
Push to main branch or manually trigger workflow in GitHub Actions.

---

## ✅ Checklist

Before going live:

- [ ] Azure Static Web App created
- [ ] Deployment token added to GitHub Secrets
- [ ] All VITE_* environment variables added to GitHub Secrets
- [ ] Custom workflow deployed (auto-created workflow deleted)
- [ ] First deployment successful
- [ ] Staging URL tested and working
- [ ] Custom domain added and validated
- [ ] DNS configured and propagated
- [ ] HTTPS working on dashboard.mojeeb.app
- [ ] Backend CORS updated
- [ ] OAuth redirect URIs updated
- [ ] Landing page links updated
- [ ] Full end-to-end testing complete

---

## 🎉 Success!

Once all steps complete, you'll have:
- ✅ React dashboard live at `dashboard.mojeeb.app`
- ✅ Automatic deployments on every push to main
- ✅ Preview deployments for pull requests
- ✅ HTTPS with auto-renewing SSL certificates
- ✅ Global CDN distribution via Azure

---

## 📞 Need Help?

- **Azure Docs**: [docs.microsoft.com/azure/static-web-apps](https://docs.microsoft.com/azure/static-web-apps/)
- **GitHub Actions**: Check workflow logs in Actions tab
- **Azure Support**: Azure Portal → Support + troubleshooting
