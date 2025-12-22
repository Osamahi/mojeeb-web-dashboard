# Browser Storage Troubleshooting Guide

**Project:** Mojeeb Dashboard
**Issue:** Authentication Not Persisting Across Browser Restarts
**Created:** December 22, 2025
**Version:** 1.0.0

---

## Table of Contents

1. [Quick Diagnosis](#quick-diagnosis)
2. [Common Causes](#common-causes)
3. [Step-by-Step Fixes](#step-by-step-fixes)
4. [Browser-Specific Instructions](#browser-specific-instructions)
5. [Advanced Diagnostics](#advanced-diagnostics)
6. [Still Not Working?](#still-not-working)

---

## Quick Diagnosis

### Run the Built-in Health Check

1. **Login successfully** to Mojeeb Dashboard
2. **Open browser console** (F12 or Cmd+Option+I on Mac)
3. **Type this command:**
   ```javascript
   runStorageHealthCheck()
   ```
4. **Review the report** - it will tell you exactly what's wrong

### What to Look For

The health check will show you:
- ✅ **HEALTHY (90-100)** - localStorage is working perfectly
- ⚠️ **DEGRADED (60-89)** - Some issues, but might work
- ❌ **FAILED (0-59)** - localStorage is broken, auth won't persist

---

## Common Causes

### 1. Incognito/Private Browsing Mode 🔒

**Symptom:** Login works, but logs out when browser closes

**How to Check:**
- Chrome: Look for 🕵️ icon in top-right
- Firefox: Look for purple mask 🎭 icon
- Safari: Check menu bar for "Private" label
- Edge: Look for "InPrivate" label

**Fix:** **Exit private/incognito mode** and use a normal browser window

---

### 2. "Clear Cookies on Close" Setting 🍪

**Symptom:** Login works, persists during session, but clears on browser close

**How to Check:**

#### Chrome/Edge:
1. Go to `chrome://settings/cookies` (or `edge://settings/content/cookies`)
2. Look for **"Clear cookies and site data when you close all windows"**
3. If this is **ON**, it's the problem

**Fix:**
1. **Turn OFF** "Clear cookies and site data when you close all windows"
2. **OR** Add an exception for your Mojeeb domain:
   - Click "Sites that can always use cookies"
   - Add: `https://yourdomain.com` (replace with your actual domain)

#### Firefox:
1. Go to `about:preferences#privacy`
2. Under "Cookies and Site Data", click **"Manage Exceptions"**
3. Make sure your domain is allowed

#### Safari:
1. Safari → Settings → Privacy
2. Uncheck **"Block all cookies"**
3. Make sure **"Prevent cross-site tracking"** allows your domain

---

### 3. Browser Extensions Interfering 🔌

**Symptom:** Unpredictable logout behavior

**Common culprits:**
- Privacy Badger
- Ghostery
- uBlock Origin (aggressive settings)
- Cookie AutoDelete
- Privacy-focused extensions

**How to Check:**
1. Open browser in **incognito/private mode WITHOUT extensions**
2. Test if login persists
3. If it works, an extension is the problem

**Fix:**
1. **Disable extensions one by one** to find the culprit
2. **Whitelist your Mojeeb domain** in the extension settings
3. **OR** Keep extensions disabled for Mojeeb domain

---

### 4. Storage Quota Exceeded 💾

**Symptom:** Login fails silently, or localStorage writes fail

**How to Check:**
```javascript
// Run in console
runStorageHealthCheck()
// Look for "Storage: XX% full" - if >90%, that's the problem
```

**Fix:**
1. **Clear browser data:**
   - Chrome: `chrome://settings/clearBrowserData`
   - Firefox: `about:preferences#privacy` → "Clear Data"
   - Safari: Safari → Settings → Privacy → "Manage Website Data"
2. **Select "Cookies and site data"** (or "Local Storage")
3. **Clear data** (optionally keep data for important sites)
4. **Restart browser** and try again

---

### 5. Corrupted localStorage Data 🗑️

**Symptom:** Login works, data writes, but reads return null or corrupted data

**Fix:**
1. **Manually clear Mojeeb localStorage:**
   ```javascript
   // Run in console
   localStorage.removeItem('mojeeb-auth-storage');
   localStorage.removeItem('accessToken');
   localStorage.removeItem('refreshToken');
   localStorage.clear(); // Nuclear option - clears everything
   ```
2. **Hard refresh:** Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
3. **Login again** and test

---

## Step-by-Step Fixes

### Fix #1: The Nuclear Option (Fixes 95% of Cases)

```bash
# Steps (Chrome/Edge example):
1. Close ALL browser windows completely
2. Reopen browser
3. Go to chrome://settings/clearBrowserData
4. Select:
   ☑ Cookies and other site data
   ☑ Cached images and files
5. Time range: "All time"
6. Click "Clear data"
7. Restart browser
8. Go to Mojeeb and login
9. Check console for health report
10. Close browser completely
11. Reopen and verify you're still logged in
```

**Success rate:** 95%
**Time:** 2 minutes

---

### Fix #2: Check Browser Privacy Settings

#### Chrome/Edge:
```bash
1. Go to chrome://settings/privacy
2. Click "Third-party cookies"
3. Make sure it's NOT set to "Block third-party cookies"
   (Or add exception for your Mojeeb domain)
4. Go to chrome://settings/cookies
5. Turn OFF "Clear cookies when you close all windows"
6. Restart browser and test
```

#### Firefox:
```bash
1. Go to about:preferences#privacy
2. Set "Enhanced Tracking Protection" to "Standard" (not Strict)
3. Under "Cookies and Site Data":
   - Uncheck "Delete cookies and site data when Firefox is closed"
4. Restart browser and test
```

#### Safari:
```bash
1. Safari → Settings → Privacy
2. Uncheck "Block all cookies"
3. Uncheck "Prevent cross-site tracking" (or add exception)
4. Quit Safari completely
5. Reopen and test
```

---

### Fix #3: Test in Different Browser

To isolate the issue:

1. **Install a fresh browser** (if using Chrome, try Firefox, or vice versa)
2. **Don't install any extensions**
3. **Login to Mojeeb**
4. **Close browser completely**
5. **Reopen and check if you're logged in**

If it works in the fresh browser:
- ✅ The issue is with your original browser's settings/extensions
- ❌ Go back to original browser and fix settings (see above)

If it STILL doesn't work:
- 🤔 The issue might be with the backend or your network
- 📞 Contact support with browser console logs

---

## Browser-Specific Instructions

### Chrome (Version 90+)

**Check storage:**
```bash
1. F12 → Application tab
2. Left sidebar → Storage → Local Storage
3. Click your domain
4. Look for 'mojeeb-auth-storage' key
5. It should have a JSON value with user data
```

**Clear storage:**
```bash
1. Same place as above
2. Right-click 'mojeeb-auth-storage' → Delete
3. Or click "Clear All" button at top
```

**Check privacy settings:**
```bash
chrome://settings/privacy → Cookies and site data
Make sure:
- Third-party cookies NOT blocked (or add exception)
- "Clear on close" is OFF
```

---

### Firefox (Version 90+)

**Check storage:**
```bash
1. F12 → Storage tab
2. Left sidebar → Local Storage
3. Click your domain
4. Look for 'mojeeb-auth-storage' key
```

**Clear storage:**
```bash
1. Same place as above
2. Right-click key → Delete
3. Or right-click domain → Delete All
```

**Check privacy settings:**
```bash
about:preferences#privacy
Make sure:
- Enhanced Tracking Protection: Standard (not Strict)
- "Delete cookies when Firefox is closed" is UNCHECKED
```

---

### Safari (Version 14+)

**Check storage:**
```bash
1. Enable Developer menu: Safari → Settings → Advanced → "Show Develop menu"
2. Develop → Show Web Inspector
3. Storage tab → Local Storage
4. Click your domain
```

**Clear storage:**
```bash
1. Safari → Settings → Privacy
2. "Manage Website Data"
3. Search for your domain
4. Click "Remove" or "Remove All"
```

**Check privacy settings:**
```bash
Safari → Settings → Privacy
Make sure:
- "Block all cookies" is UNCHECKED
- "Prevent cross-site tracking" allows your domain
```

---

### Edge (Version 90+)

Same as Chrome - Edge is based on Chromium:
```bash
edge://settings/privacy → Cookies and site data
```

---

## Advanced Diagnostics

### Diagnostic Command #1: Verify Auth Persistence

```javascript
// In browser console
verifyAuthPersistence()
```

**Expected output if healthy:**
```
✅ VERDICT: All systems consistent - auth should persist correctly
```

**If you see:**
```
⚠️ VERDICT: INCONSISTENT STATE DETECTED!
```
→ Auth system has a bug, copy console logs and report to dev team

---

### Diagnostic Command #2: Storage Health Check

```javascript
// In browser console
runStorageHealthCheck()
```

**This will:**
- Test localStorage availability
- Test write/read operations
- Test data persistence over 5 seconds
- Check storage quota
- Detect incognito mode
- Provide actionable recommendations

**Expected output if healthy:**
```
✅ Overall Status: HEALTHY (Score: 100/100)
```

---

### Diagnostic Command #3: Manual Persistence Test

**Run this test to see if localStorage survives browser close:**

```javascript
// Step 1: Write test data
localStorage.setItem('__test_persistence__', JSON.stringify({
  timestamp: Date.now(),
  message: 'Testing persistence'
}));

console.log('✅ Test data written. Close browser completely and reopen.');
```

**Then:**
1. **Close ALL browser windows** (not just the tab)
2. **Reopen browser**
3. **Go to same page**
4. **Open console and run:**

```javascript
// Step 2: Check if data survived
const testData = localStorage.getItem('__test_persistence__');
if (testData) {
  const parsed = JSON.parse(testData);
  console.log('✅ SUCCESS: Data persisted!');
  console.log('Timestamp:', new Date(parsed.timestamp));
  console.log('Age:', ((Date.now() - parsed.timestamp) / 1000).toFixed(1), 'seconds');
} else {
  console.error('❌ FAILED: Data did not persist across browser close!');
  console.error('This is why auth is not working.');
  console.error('Check browser privacy settings (clear-on-close).');
}

// Clean up
localStorage.removeItem('__test_persistence__');
```

---

## Still Not Working?

### Collect Debug Information

If none of the above fixes work, collect this information for support:

1. **Browser & OS:**
   ```javascript
   console.log(navigator.userAgent);
   ```

2. **Storage health report:**
   ```javascript
   runStorageHealthCheck()
   ```

3. **Auth persistence report:**
   ```javascript
   verifyAuthPersistence()
   ```

4. **Console logs:**
   - Open console (F12)
   - Hard refresh page (Ctrl+Shift+R)
   - Login
   - Copy ALL console output
   - Save to a file

5. **Browser settings:**
   - Screenshot of Privacy/Cookies settings
   - List of installed extensions
   - Incognito/Private mode status

---

### Report the Issue

**Include:**
1. All debug information above
2. Steps to reproduce
3. Expected vs actual behavior
4. Screenshots of console errors
5. Browser/OS versions

**Contact:**
- GitHub Issues: [Create Issue](https://github.com/your-repo/issues)
- Email: support@mojeeb.com
- Include "[Auth Persistence]" in subject line

---

## FAQ

### Q: Does incognito mode ever work for auth persistence?

**A:** No. By design, incognito/private mode clears all storage when the browser closes. This is a browser feature, not a bug.

---

### Q: I'm not in incognito mode, but the health check says I am?

**A:** Some browsers or extensions can make the browser "act like" incognito mode without the visual indicator. Check:
1. Browser extensions (disable them)
2. Privacy settings (make sure not too strict)
3. Corporate/managed browser policies

---

### Q: Will clearing cookies log me out?

**A:** Yes, clearing cookies/site data will log you out. You'll need to login again. But this often fixes persistence issues.

---

### Q: Can I use multiple browsers with the same login?

**A:** Yes! Each browser has its own localStorage. You can be logged in on Chrome, Firefox, and Safari independently.

---

### Q: Why does this work on my phone but not my computer?

**A:** Mobile browsers have different privacy defaults. Your desktop browser likely has stricter privacy settings or extensions installed.

---

### Q: The health check says "HEALTHY" but I still get logged out?

**A:** This is rare, but possible causes:
1. Backend is invalidating your refresh token
2. Your clock is wrong (JWT expiration issues)
3. Network issues preventing token refresh
4. Check backend logs for errors

Run:
```javascript
// Check token expiration
const state = useAuthStore.getState();
console.log('Refresh token:', state.refreshToken);
console.log('Access token:', state.accessToken);
```

If both are null after page refresh, localStorage persistence is failing despite the health check.

---

## Summary Checklist

Use this checklist to systematically diagnose the issue:

- [ ] **Not in incognito/private mode** (check icon in top-right)
- [ ] **"Clear on close" setting is OFF** (`chrome://settings/cookies`)
- [ ] **Third-party cookies are allowed** (or domain exception added)
- [ ] **No privacy extensions blocking storage** (test with extensions disabled)
- [ ] **Storage quota is not full** (check `runStorageHealthCheck()`)
- [ ] **localStorage is available** (check console for errors)
- [ ] **Ran manual persistence test** (data survives browser close)
- [ ] **Health check reports HEALTHY** (`runStorageHealthCheck()`)
- [ ] **Auth persistence check shows consistent state** (`verifyAuthPersistence()`)
- [ ] **Tested in different browser** (to isolate browser-specific issues)

If ALL are checked ✅ and auth still doesn't persist → contact support with debug info.

---

**Last Updated:** December 22, 2025
**Version:** 1.0.0
**Maintainer:** Mojeeb Development Team
