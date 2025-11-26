# GitHub Secrets Configuration

## ⚠️ IMPORTANT: Why GitHub Secrets (Not Azure Portal)

**Azure Portal Configuration** is for Azure Functions (API runtime), NOT for static site builds.

For **React/Vite apps**, environment variables must be available at **BUILD TIME** (when `npm run build` runs). This means they MUST come from **GitHub Secrets** passed through the workflow.

---

## 🔐 Add These Secrets to GitHub

Go to: **https://github.com/Osamahi/mojeeb-web-dashboard/settings/secrets/actions**

Click **"New repository secret"** and add each one below:

---

## 1. Azure Deployment Token (GET FROM AZURE PORTAL FIRST!)

**Before adding other secrets, get this token from Azure:**

1. Go to Azure Portal: https://portal.azure.com
2. Navigate to your Static Web App: `mojeeb-dashboard` or search for `happy-water-0f34c100f`
3. Click **"Manage deployment token"** in the Overview page
4. Copy the token

Then add to GitHub:

```
Name: AZURE_STATIC_WEB_APPS_API_TOKEN_HAPPY_WATER_0F34C100F
Value: <paste-the-token-from-Azure-Portal>
```

---

## 2. Required Environment Variables

### API Configuration

```
Name: VITE_API_URL
Value: https://mojeebapi.azurewebsites.net
```

```
Name: VITE_API_TIMEOUT
Value: 30000
```

### Supabase Configuration

```
Name: VITE_SUPABASE_URL
Value: https://zssyyktaqahdfmehkdxn.supabase.co
```

```
Name: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpzc3l5a3RhcWFoZGZtZWhrZHhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MjUyNjYsImV4cCI6MjA2OTIwMTI2Nn0.6loB-m_y5To_zk3Inb7wvXSC00OOZ3FhMMTJMfdGlfg
```

### App Configuration

```
Name: VITE_APP_NAME
Value: Mojeeb Dashboard
```

```
Name: VITE_APP_VERSION
Value: 1.0.0
```

### OAuth Configuration

```
Name: VITE_GOOGLE_CLIENT_ID
Value: 470233234969-lqtd8f7di6qa9hn4lufj7ifkjip27628.apps.googleusercontent.com
```

```
Name: VITE_APPLE_CLIENT_ID
Value: com.mojeeb.web
```

```
Name: VITE_APPLE_REDIRECT_URI
Value: https://dashboard.mojeeb.app/oauth/callback
```

---

## 3. Optional Secrets (Add if using these features)

### Sentry Error Tracking (if configured)

```
Name: VITE_SENTRY_DSN
Value: <leave-empty-if-not-using-sentry>
```

```
Name: VITE_SENTRY_ENVIRONMENT
Value: production
```

### Token Encryption (if configured)

```
Name: VITE_TOKEN_ENCRYPTION_KEY
Value: <leave-empty-if-not-using-encryption>
```

---

## ✅ Checklist

Before triggering deployment, ensure you've added:

- [ ] AZURE_STATIC_WEB_APPS_API_TOKEN_HAPPY_WATER_0F34C100F (from Azure Portal)
- [ ] VITE_API_URL
- [ ] VITE_API_TIMEOUT
- [ ] VITE_SUPABASE_URL
- [ ] VITE_SUPABASE_ANON_KEY
- [ ] VITE_APP_NAME
- [ ] VITE_APP_VERSION
- [ ] VITE_GOOGLE_CLIENT_ID
- [ ] VITE_APPLE_CLIENT_ID
- [ ] VITE_APPLE_REDIRECT_URI

---

## 🚀 After Adding All Secrets

Trigger deployment:

```bash
git commit --allow-empty -m "Trigger deployment with secrets"
git push origin main
```

Then watch: https://github.com/Osamahi/mojeeb-web-dashboard/actions

---

## 📝 Notes

- All values above were found from existing Mojeeb projects
- API URL points to production backend: `mojeebapi.azurewebsites.net`
- Supabase configuration is from production environment
- Google OAuth Client ID is from existing dashboard configuration
- Apple redirect URI will need to be updated in Apple Developer Console after deployment

---

## ⚠️ Important: After Deployment

Once `dashboard.mojeeb.app` is live, you'll need to:

1. **Update Google OAuth Console**:
   - Add redirect URI: `https://dashboard.mojeeb.app/oauth/callback`

2. **Update Apple Developer Console**:
   - Update Return URL: `https://dashboard.mojeeb.app/oauth/callback`

3. **Update Backend CORS** (in `MojeebBackEnd/.env`):
   - Add: `https://dashboard.mojeeb.app` to ALLOWED_ORIGINS

4. **Update Landing Page**:
   - Change sign-in links from `app.mojeeb.app` to `dashboard.mojeeb.app`
