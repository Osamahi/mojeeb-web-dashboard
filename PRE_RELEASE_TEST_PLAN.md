# Pre-Release Test Plan: Random Sign-Out Fix

## 🎯 Test Objective

Verify that the random sign-out issue on page refresh has been completely resolved and that the new diagnostic logging is working correctly.

---

## ✅ Pre-Test Setup

### 1. Open the Dashboard
- URL: `https://localhost:3002/`
- Browser: Use Chrome/Safari (test both if possible)

### 2. Open DevTools Console
- Press **F12** (or **Cmd+Option+I** on Mac)
- Go to **Console** tab
- Enable "Preserve log" to keep logs across refreshes
- Clear console before each test scenario

### 3. Verify Diagnostic Logging is Active

Look for these initialization logs on first load:
```
🔍 [Development] Initializing storage monitoring for auth debugging...
🔍 [StorageMonitor] Starting localStorage monitoring...
✅ [StorageMonitor] Monitoring active for: mojeeb-auth-storage, accessToken, refreshToken
🔍 [AuthStore] Monitoring isAuthenticated for unexpected sign-outs...
```

If you see these ✅ **diagnostic logging is working!**

---

## 🧪 Test Scenarios

### Test 1: Normal Login Flow ✅

**Steps:**
1. Clear console
2. Navigate to `/login`
3. Enter credentials and login
4. Watch console logs

**Expected Logs:**
```
🔐 [AuthStore] setAuth called
   User: your@email.com
   Access Token: [preview]... (392 chars)
   Refresh Token: [preview]... (86 chars)
   ✅ Auth state set, isAuthenticated = true

📝 [StorageMonitor] localStorage.setItem
   Key: accessToken
   Value length: 392 chars

📝 [StorageMonitor] localStorage.setItem
   Key: refreshToken
   Value length: 86 chars

🛡️ [ProtectedRoute] Access check
   isAuthenticated: true
   refreshToken: EXISTS
   user: your@email.com
   ✅ Access granted
```

**Pass Criteria:**
- [x] Successfully logged in
- [x] All tokens stored in localStorage
- [x] Redirected to `/conversations`
- [x] No errors in console

---

### Test 2: Single Page Refresh ✅ (CRITICAL)

**Steps:**
1. After logging in, clear console
2. Press **F5** to refresh
3. Watch console logs

**Expected Logs:**
```
💧 [AuthStore] Rehydrating from localStorage
   ✅ Found persisted refreshToken and user
      User: your@email.com
      User ID: [uuid]
      Refresh Token: [preview]... (86 chars)
   ✅ Setting isAuthenticated = true (AuthInitializer will validate tokens)
   🏁 Rehydration complete: isAuthenticated = true

🛡️ [ProtectedRoute] Access check
   isAuthenticated: true
   refreshToken: EXISTS
   user: your@email.com
   ✅ Access granted

🔄 [AuthInitializer] Initializing
   isAuthenticated: true
   ✅ User is authenticated, validating tokens...
   📊 Token status:
      Access Token: EXISTS (392 chars)
      Refresh Token: EXISTS (86 chars)
   ✅ CASE 1: Both tokens present - initialization complete
```

**Pass Criteria:**
- [x] Remained logged in after refresh
- [x] No redirect to `/login`
- [x] `isAuthenticated` remained `true`
- [x] Both tokens still present
- [x] **NO 🚨 UNEXPECTED SIGN-OUT DETECTED** error

---

### Test 3: Rapid Refresh Test (20x) ✅ (CRITICAL)

**Steps:**
1. After logging in, clear console
2. **Spam F5 key rapidly 20 times** (or more)
3. Check if you remain logged in

**Expected Behavior:**
- Should remain logged in after all refreshes
- Console shows identical rehydration logs each time
- No sign-outs occur

**Pass Criteria:**
- [x] Remained logged in after all 20+ refreshes
- [x] No random redirects to `/login`
- [x] Consistent console logs on each refresh
- [x] **NO 🚨 UNEXPECTED SIGN-OUT DETECTED** errors

**If Test Fails:**
- Check console for 🚨 UNEXPECTED SIGN-OUT DETECTED
- Look for stack trace showing what caused it
- Check StorageMonitor logs for unexpected deletions

---

### Test 4: Logout Flow ✅

**Steps:**
1. While logged in, clear console
2. Click the logout button
3. Watch console logs

**Expected Logs:**
```
🚪 [AuthStore] logout called
   Current user: your@email.com
   Current isAuthenticated: true
   📍 Logout triggered from:
   at LogoutButton.onClick (...)
   at HTMLButtonElement.callCallback (...)

   📊 localStorage state before logout:
      mojeeb-auth-storage: EXISTS (XXX chars)
      accessToken: EXISTS (392 chars)
      refreshToken: EXISTS (86 chars)

   🧹 Force clearing Zustand persist storage...

🗑️ [StorageMonitor] localStorage.removeItem
   Key: mojeeb-auth-storage

🗑️ [StorageMonitor] localStorage.removeItem
   Key: accessToken

   📊 localStorage state after logout:
      mojeeb-auth-storage: CLEARED ✅
      accessToken: CLEARED ✅
      refreshToken: CLEARED ✅

   ✅ User logged out, all stores cleared

🌐 [PublicRoute] Access check
   isAuthenticated: false
   user: MISSING
```

**Pass Criteria:**
- [x] Successfully logged out
- [x] All tokens cleared from localStorage
- [x] Redirected to `/login`
- [x] Stack trace shows logout button as trigger
- [x] Before/after localStorage state verified

---

### Test 5: Logout + Immediate Refresh ✅

**Steps:**
1. While logged in, click logout
2. **Immediately press F5** (within 1 second)
3. Check if you stay logged out

**Expected Behavior:**
- Should remain on `/login` page
- Should NOT redirect back to `/conversations`
- No redirect loop

**Expected Logs:**
```
💧 [AuthStore] Rehydrating from localStorage
   ❌ No refresh token or user found in persisted state
      Refresh Token: missing
      User: missing
   ❌ Setting isAuthenticated = false
   🏁 Rehydration complete: isAuthenticated = false

🌐 [PublicRoute] Access check
   isAuthenticated: false
   user: MISSING
   ✅ Access granted - rendering public content
```

**Pass Criteria:**
- [x] Remained logged out after refresh
- [x] Stayed on `/login` page
- [x] No redirect loop
- [x] localStorage properly cleared

---

### Test 6: Multi-Tab Consistency ✅

**Steps:**
1. Login in Tab 1
2. Open Tab 2 at `https://localhost:3002/`
3. Both tabs should be logged in
4. Logout in Tab 1
5. Refresh Tab 2

**Expected Behavior:**
- Tab 2 should see the storage event and logout
- After refresh, Tab 2 should redirect to `/login`

**Expected Logs (Tab 2):**
```
🔄 [StorageMonitor] Storage event from another tab
   Key: accessToken
   Old value: [preview]...
   New value: null
   URL: https://localhost:3002/

💧 [AuthStore] Rehydrating from localStorage
   ❌ No refresh token or user found
   ❌ Setting isAuthenticated = false
```

**Pass Criteria:**
- [x] Tab 2 detects logout from Tab 1
- [x] Tab 2 redirects to `/login` after refresh
- [x] No inconsistent state across tabs

---

### Test 7: Network Throttling (Slow 3G) ✅

**Steps:**
1. Open DevTools → Network tab
2. Set throttling to **"Slow 3G"**
3. Login
4. Refresh page multiple times (5-10 times)

**Expected Behavior:**
- Should remain logged in despite slow network
- Might take longer to load, but no sign-outs

**Pass Criteria:**
- [x] Remained logged in with slow network
- [x] No timeouts causing sign-outs
- [x] Consistent behavior despite latency

---

### Test 8: Private/Incognito Mode ✅

**Steps:**
1. Open dashboard in private/incognito window
2. Login
3. Refresh page 5+ times

**Expected Behavior:**
- Should work identically to normal mode
- Some browsers restrict storage in private mode

**Pass Criteria:**
- [x] Login works in private mode
- [x] Refresh works in private mode
- [x] If fails, check for browser restrictions

---

### Test 9: Navigate Between Pages ✅

**Steps:**
1. Login
2. Navigate to different pages:
   - `/conversations`
   - `/agents`
   - `/settings`
   - `/connections`
3. Refresh on each page

**Expected Behavior:**
- Should remain logged in on all pages
- Each protected route shows access granted logs

**Expected Logs (on each navigation):**
```
🛡️ [ProtectedRoute] Access check
   isAuthenticated: true
   refreshToken: EXISTS
   user: your@email.com
   Current URL: /agents
   ✅ Access granted
```

**Pass Criteria:**
- [x] Remained logged in on all pages
- [x] Refresh works on all pages
- [x] No unexpected sign-outs

---

### Test 10: Token Refresh Flow ✅ (If Applicable)

**Steps:**
1. Login
2. Wait 15+ minutes (access token expiry)
3. Make an API call or refresh page
4. Watch for token refresh

**Expected Logs:**
```
📦 [AuthStore] setTokens called
   Old Access Token: [old-preview]...
   New Access Token: [new-preview]... (392 chars)
   New Refresh Token: [preview]... (86 chars)
   ✅ AuthStore state updated
```

**Pass Criteria:**
- [x] Tokens refreshed successfully
- [x] No sign-out during refresh
- [x] User experience uninterrupted

---

## 🚨 Bug Detection Tests

### Test 11: Unexpected Sign-Out Detection ⚠️

**Purpose:** Verify that diagnostic logging catches unexpected sign-outs

**Steps:**
1. Login
2. Open browser DevTools → Console tab
3. Manually clear localStorage while logged in:
   ```javascript
   localStorage.removeItem('mojeeb-auth-storage')
   ```
4. Refresh page

**Expected Logs:**
```
🚨 [AuthStore] UNEXPECTED SIGN-OUT DETECTED
   isAuthenticated changed: true → false
   Current user: MISSING
   Current refreshToken: MISSING
   📍 Sign-out triggered from:
   [STACK TRACE]
```

**Pass Criteria:**
- [x] 🚨 alert logged to console
- [x] Stack trace captured
- [x] Current state dumped

---

### Test 12: localStorage Monitoring ✅

**Purpose:** Verify storage monitor captures all operations

**Steps:**
1. Login
2. Watch console for storage operations
3. Should see `localStorage.setItem` calls for tokens

**Expected Logs:**
```
📝 [StorageMonitor] localStorage.setItem
   Key: accessToken
   Value length: 392 chars
   Value preview: eyJhbGci...
   📍 Called from:
   at setApiTokens (tokenManager.ts:XX)
   at setAuth (authStore.ts:XX)
```

**Pass Criteria:**
- [x] All storage operations logged
- [x] Stack traces captured
- [x] Token keys monitored

---

## 📊 Test Results Summary

After completing all tests, fill out this checklist:

### Critical Tests (Must Pass)
- [ ] Test 1: Normal Login Flow
- [ ] Test 2: Single Page Refresh
- [ ] Test 3: Rapid Refresh (20x)
- [ ] Test 4: Logout Flow
- [ ] Test 5: Logout + Immediate Refresh

### Important Tests (Should Pass)
- [ ] Test 6: Multi-Tab Consistency
- [ ] Test 7: Network Throttling
- [ ] Test 8: Private/Incognito Mode
- [ ] Test 9: Navigate Between Pages
- [ ] Test 10: Token Refresh Flow

### Diagnostic Tests (Should Work)
- [ ] Test 11: Unexpected Sign-Out Detection
- [ ] Test 12: localStorage Monitoring

---

## ✅ Release Criteria

**Ready to release if:**
- ✅ All Critical Tests pass (Tests 1-5)
- ✅ At least 3/5 Important Tests pass
- ✅ Both Diagnostic Tests work
- ✅ No 🚨 UNEXPECTED SIGN-OUT DETECTED errors in normal usage
- ✅ Console logs are clean and informative

**NOT ready if:**
- ❌ Any Critical Test fails
- ❌ Unexpected sign-outs still occur
- ❌ Redirect loops happen
- ❌ Diagnostic logging not working

---

## 🐛 If Tests Fail

### Debugging Steps:
1. **Check console logs** - Look for 🚨 alerts
2. **Examine stack traces** - See what triggered the issue
3. **Check localStorage** - Verify token state in Application tab
4. **Review StorageMonitor logs** - See what modified storage
5. **Try different browsers** - Chrome, Safari, Firefox

### Common Issues:
| Issue | Likely Cause | Solution |
|-------|-------------|----------|
| Sign-out on refresh | Rehydration failed | Check rehydration logs |
| Redirect loop | Inconsistent auth state | Check ProtectedRoute/PublicRoute logs |
| Tokens not cleared | Logout not working | Check logout logs for verification |
| No logs appearing | Diagnostic disabled | Verify `import.meta.env.DEV` is true |

---

## 📝 Test Results Template

```
## Test Results - [Date]

**Tester:** [Your Name]
**Browser:** Chrome 120 / Safari 17 / Firefox 121
**Environment:** Development (localhost:3002)

### Critical Tests
- [x] Test 1: Normal Login - PASS
- [x] Test 2: Single Refresh - PASS
- [x] Test 3: Rapid Refresh (25 times) - PASS
- [x] Test 4: Logout - PASS
- [x] Test 5: Logout + Refresh - PASS

### Important Tests
- [x] Test 6: Multi-Tab - PASS
- [x] Test 7: Slow Network - PASS
- [x] Test 8: Private Mode - PASS
- [x] Test 9: Page Navigation - PASS
- [ ] Test 10: Token Refresh - SKIPPED (didn't wait 15min)

### Diagnostic Tests
- [x] Test 11: Unexpected Sign-Out Detection - PASS
- [x] Test 12: localStorage Monitoring - PASS

### Issues Found
- None

### Recommendation
✅ READY FOR RELEASE - All critical tests passed, no issues found
```

---

## 🚀 Next Steps After Testing

1. **If all tests pass:**
   - ✅ Mark as ready for production
   - Consider removing some verbose logging for production
   - Deploy to staging environment
   - Repeat critical tests in staging

2. **If tests fail:**
   - Document the failure in console logs
   - Create bug report with stack traces
   - Review DIAGNOSTIC_LOGGING.md for debugging guidance
   - Fix issues and re-test

---

**Good luck with testing! 🎯**

The diagnostic logging will help you identify any remaining issues quickly.
