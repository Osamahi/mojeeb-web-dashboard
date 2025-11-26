# Azure Static Web App Configuration Guide

## ✅ Recommended Approach: Azure Portal Configuration

We're using **Azure Portal** to store environment variables (not GitHub Secrets).

**Why this is better:**
- ✅ More secure (secrets only in Azure)
- ✅ Centralized (all Mojeeb config in one place)
- ✅ Azure best practice
- ✅ Easier to manage and update

---

## 🎯 Step-by-Step Setup

### **Step 1: Add Environment Variables in Azure Portal**

1. Go to **Azure Portal**: https://portal.azure.com

2. Navigate to your Static Web App:
   - Search for: `mojeeb-dashboard` or `happy-water-0f34c100f`
   - Or go to: Resource Groups → mojeeb-resources → mojeeb-dashboard

3. In the left menu, click **"Configuration"**

4. Click **"+ Add"** to add each environment variable below:

---

### **Required Environment Variables to Add:**

#### API Configuration
```
Name: VITE_API_URL
Value: https://mojeebapi.azurewebsites.net
```

```
Name: VITE_API_TIMEOUT
Value: 30000
```

#### Supabase Configuration
```
Name: VITE_SUPABASE_URL
Value: https://zssyyktaqahdfmehkdxn.supabase.co
```

```
Name: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpzc3l5a3RhcWFoZGZtZWhrZHhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MjUyNjYsImV4cCI6MjA2OTIwMTI2Nn0.6loB-m_y5To_zk3Inb7wvXSC00OOZ3FhMMTJMfdGlfg
```

#### App Configuration
```
Name: VITE_APP_NAME
Value: Mojeeb Dashboard
```

```
Name: VITE_APP_VERSION
Value: 1.0.0
```

#### OAuth Configuration
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

#### Optional (Add if needed)
```
Name: VITE_SENTRY_DSN
Value: (leave empty if not using Sentry)
```

```
Name: VITE_SENTRY_ENVIRONMENT
Value: production
```

```
Name: VITE_TOKEN_ENCRYPTION_KEY
Value: (leave empty if not using encryption)
```

5. **Click "Save"** after adding all variables

---

### **Step 2: Add GitHub Secret (Deployment Token Only)**

Only **ONE** secret needs to be in GitHub (the deployment token):

1. In Azure Portal (same Static Web App page), click **"Manage deployment token"**
2. Copy the token
3. Go to GitHub: https://github.com/Osamahi/mojeeb-web-dashboard/settings/secrets/actions
4. Click **"New repository secret"**

```
Name: AZURE_STATIC_WEB_APPS_API_TOKEN_HAPPY_WATER_0F34C100F
Value: <paste-token-from-Azure>
```

---

### **Step 3: Trigger Deployment**

After adding all Azure configuration and the GitHub secret:

```bash
git commit --allow-empty -m "Trigger deployment with Azure configuration"
git push origin main
```

---

### **Step 4: Monitor Deployment**

1. Go to GitHub Actions: https://github.com/Osamahi/mojeeb-web-dashboard/actions
2. Watch the workflow run
3. Wait for green checkmark ✅ (2-4 minutes)

---

### **Step 5: Test Staging URL**

Once deployed, test: **https://happy-water-0f34c100f.3.azurestaticapps.net**

Check:
- [ ] Page loads
- [ ] Dashboard UI appears
- [ ] Login form works
- [ ] No console errors (F12)
- [ ] API connection working

---

## 📊 Configuration Checklist

### In Azure Portal (Configuration):
- [ ] VITE_API_URL
- [ ] VITE_API_TIMEOUT
- [ ] VITE_SUPABASE_URL
- [ ] VITE_SUPABASE_ANON_KEY
- [ ] VITE_APP_NAME
- [ ] VITE_APP_VERSION
- [ ] VITE_GOOGLE_CLIENT_ID
- [ ] VITE_APPLE_CLIENT_ID
- [ ] VITE_APPLE_REDIRECT_URI

### In GitHub Secrets:
- [ ] AZURE_STATIC_WEB_APPS_API_TOKEN_HAPPY_WATER_0F34C100F

---

## 🔧 How to Update Configuration Later

**To change environment variables:**

1. Azure Portal → Static Web App → Configuration
2. Edit the variable value
3. Click "Save"
4. Trigger a new deployment:
   ```bash
   git commit --allow-empty -m "Redeploy with updated config"
   git push origin main
   ```

**No need to touch GitHub at all!**

---

## 🎯 Advantages of This Approach

✅ **More Secure**: Secrets stored in Azure, not exposed in GitHub workflow files
✅ **Centralized**: All Mojeeb configuration in Azure Portal
✅ **Easier Management**: Update in one place (Azure Portal)
✅ **Better Access Control**: Azure RBAC for who can see/edit secrets
✅ **Audit Trail**: Azure tracks all configuration changes
✅ **Azure Best Practice**: Recommended by Microsoft
✅ **Cleaner Workflow**: No clutter in GitHub Actions file

---

## 📝 Notes

- All environment variables are **automatically injected** during the build process
- Azure encrypts all configuration values at rest
- Changes to configuration require a new deployment to take effect
- Configuration is **per-environment** (can have different values for staging/production)

---

## ⚠️ After Deployment

Once `dashboard.mojeeb.app` is live, you'll need to:

1. **Update Google OAuth Console**:
   - Add redirect URI: `https://dashboard.mojeeb.app/oauth/callback`

2. **Update Apple Developer Console**:
   - Update Return URL: `https://dashboard.mojeeb.app/oauth/callback`

3. **Update Backend CORS**:
   - Add `https://dashboard.mojeeb.app` to allowed origins in backend

4. **Update Landing Page**:
   - Change sign-in links from `app.mojeeb.app` to `dashboard.mojeeb.app`
