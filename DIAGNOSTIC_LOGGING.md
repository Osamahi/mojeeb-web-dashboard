# Diagnostic Logging Guide

## Overview

Comprehensive diagnostic logging has been added to track and debug any future authentication issues, particularly random sign-outs on page refresh.

---

## 🔍 What's Being Monitored

### 1. **Auth Store State Changes** (`authStore.ts`)

#### Rehydration Logging
```
💧 [AuthStore] Rehydrating from localStorage at [timestamp]
   ✅ Found persisted refreshToken and user
      User: user@example.com
      User ID: [uuid]
      Refresh Token: [first-10-chars]... ([length] chars)
   ✅ Setting isAuthenticated = true (AuthInitializer will validate tokens)
   🏁 Rehydration complete: isAuthenticated = true
```

#### Login/SetAuth Logging
```
🔐 [AuthStore] setAuth called at [timestamp]
   User: user@example.com
   User ID: [uuid]
   Access Token: [first-10-chars]... ([length] chars)
   Refresh Token: [first-10-chars]... ([length] chars)
   ✅ Auth state set, isAuthenticated = true
```

#### Token Updates
```
📦 [AuthStore] setTokens called at [timestamp]
   Old Access Token: [preview] or null
   New Access Token: [preview] ([length] chars)
   New Refresh Token: [preview] ([length] chars)
   ✅ AuthStore state updated
```

#### Logout Logging (WITH STACK TRACE)
```
🚪 [AuthStore] logout called at [timestamp]
   Current user: user@example.com
   Current isAuthenticated: true
   📍 Logout triggered from:
   [FULL STACK TRACE - shows exactly what triggered logout]

   📊 localStorage state before logout:
      mojeeb-auth-storage: EXISTS ([length] chars)
      accessToken: EXISTS ([length] chars)
      refreshToken: EXISTS ([length] chars)

   🧹 Force clearing Zustand persist storage...

   📊 localStorage state after logout:
      mojeeb-auth-storage: CLEARED ✅
      accessToken: CLEARED ✅
      refreshToken: CLEARED ✅

   🧹 Clearing AgentStore...
   🧹 Clearing ConversationStore...
   ✅ User logged out, all stores cleared
```

#### Unexpected Sign-Out Detection (CRITICAL)
```
🚨 [AuthStore] UNEXPECTED SIGN-OUT DETECTED at [timestamp]
   isAuthenticated changed: true → false
   Current user: user@example.com or null
   Current refreshToken: EXISTS or MISSING
   📍 Sign-out triggered from:
   [FULL STACK TRACE]
   ⚠️ This might indicate a bug - check the stack trace above!
```

---

### 2. **Protected Route Access** (`router.tsx`)

```
🛡️ [ProtectedRoute] Access check at [timestamp]
   isAuthenticated: true
   refreshToken: EXISTS
   user: user@example.com
   Current URL: /conversations
   ✅ [ProtectedRoute] Access granted - rendering protected content
```

**OR if redirecting:**

```
🛡️ [ProtectedRoute] Access check at [timestamp]
   isAuthenticated: false
   refreshToken: MISSING
   user: MISSING
   Current URL: /conversations
   ⚠️ [ProtectedRoute] NOT AUTHENTICATED - Redirecting to /login
   📍 Redirect triggered from: /conversations
```

---

### 3. **Public Route Access** (`router.tsx`)

```
🌐 [PublicRoute] Access check at [timestamp]
   isAuthenticated: true
   user: user@example.com
   allowAuthenticatedAccess: false
   Current URL: /login
   ⚠️ [PublicRoute] User already authenticated - Redirecting to /conversations
   📍 Redirect triggered from: /login
```

---

### 4. **localStorage Monitoring** (`storageMonitor.ts`)

#### Storage Write Operations
```
📝 [StorageMonitor] localStorage.setItem at [timestamp]
   Key: accessToken
   Value length: 392 chars
   Value preview: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   📍 Called from:
   [FULL STACK TRACE - shows exactly what code wrote to localStorage]
```

#### Storage Delete Operations
```
🗑️ [StorageMonitor] localStorage.removeItem at [timestamp]
   Key: mojeeb-auth-storage
   📍 Called from:
   [FULL STACK TRACE]
```

#### Storage Clear Operations
```
🧹 [StorageMonitor] localStorage.clear at [timestamp]
   ⚠️ All localStorage being cleared!
   📍 Called from:
   [FULL STACK TRACE]
```

#### Cross-Tab Storage Events
```
🔄 [StorageMonitor] Storage event from another tab at [timestamp]
   Key: accessToken
   Old value: [preview]...
   New value: null
   URL: https://localhost:3002/
```

---

## 🎯 How to Use This for Debugging

### Scenario 1: Random Sign-Out After Refresh

**Steps:**
1. Open DevTools Console
2. Press F5 to refresh
3. Look for the log sequence:

**Expected (GOOD):**
```
💧 [AuthStore] Rehydrating...
   ✅ Found persisted refreshToken and user
   ✅ Setting isAuthenticated = true
🛡️ [ProtectedRoute] Access granted
🔄 [AuthInitializer] Both tokens present
```

**If Bug Occurs (BAD):**
```
💧 [AuthStore] Rehydrating...
   ❌ No refresh token or user found
   ❌ Setting isAuthenticated = false
🛡️ [ProtectedRoute] NOT AUTHENTICATED - Redirecting to /login
```

**Look for:**
- Did localStorage have `mojeeb-auth-storage` before refresh?
- Was there a `localStorage.removeItem` call we didn't expect?
- Check StorageMonitor logs for unexpected deletions

---

### Scenario 2: Unexpected Sign-Out During Session

**If you get signed out randomly:**

1. **Check for red error log:**
```
🚨 [AuthStore] UNEXPECTED SIGN-OUT DETECTED
```

2. **Examine the stack trace** - it shows exactly what triggered the sign-out

3. **Check localStorage state** - were tokens actually deleted?

4. **Look for StorageMonitor logs** - did something else clear localStorage?

---

### Scenario 3: Logout Not Working Properly

**Check the logout sequence:**

```
🚪 [AuthStore] logout called
   📊 localStorage state before logout:
      mojeeb-auth-storage: EXISTS ✅
   📊 localStorage state after logout:
      mojeeb-auth-storage: CLEARED ✅
```

**If tokens aren't cleared:**
```
   📊 localStorage state after logout:
      mojeeb-auth-storage: STILL EXISTS ⚠️
```

---

### Scenario 4: Redirect Loop

**Look for rapid alternating logs:**

```
🛡️ [ProtectedRoute] Redirecting to /login
🌐 [PublicRoute] Redirecting to /conversations
🛡️ [ProtectedRoute] Redirecting to /login  ← LOOP!
```

**Indicates:**
- Race condition between routes
- Inconsistent auth state
- Check rehydration logs to see state mismatch

---

## 🔧 Diagnostic Checklist

When investigating a sign-out issue, check these in order:

### 1. Rehydration Phase
- [ ] Did rehydration find `refreshToken`?
- [ ] Did rehydration find `user`?
- [ ] Was `isAuthenticated` set correctly?

### 2. localStorage State
- [ ] Does `mojeeb-auth-storage` exist in localStorage?
- [ ] Does `accessToken` exist in localStorage?
- [ ] Does `refreshToken` exist in localStorage?

### 3. Stack Traces
- [ ] What triggered the logout? (check stack trace)
- [ ] Was it expected (user clicked logout button)?
- [ ] Was it unexpected (API error, refresh, etc.)?

### 4. Token Lifecycle
- [ ] When were tokens last written to localStorage?
- [ ] When were tokens last deleted from localStorage?
- [ ] Any cross-tab storage events?

---

## 📊 Log Categories

| Icon | Category | Severity | What It Means |
|------|----------|----------|---------------|
| 💧 | Rehydration | INFO | Zustand persist loading state |
| 🔐 | Auth | INFO | Login/auth state changes |
| 📦 | Tokens | INFO | Token updates |
| 🚪 | Logout | INFO | User logout |
| 🛡️ | Protected Route | INFO | Route access check |
| 🌐 | Public Route | INFO | Public page access |
| 📝 | Storage Write | DEBUG | localStorage.setItem |
| 🗑️ | Storage Delete | DEBUG | localStorage.removeItem |
| 🔄 | Storage Event | DEBUG | Cross-tab changes |
| 🚨 | CRITICAL | ERROR | Unexpected sign-out |
| ⚠️ | Warning | WARN | Potential issue |

---

## 🎛️ Controlling Logging

### Enable/Disable

Logging is **automatically enabled in development mode only**.

To disable logging, edit `/src/main.tsx`:

```typescript
// Comment out this section to disable
if (import.meta.env.DEV) {
  console.log('🔍 [Development] Initializing storage monitoring...');
  startStorageMonitoring();
}
```

### Production

All diagnostic logs are **automatically disabled in production** via:
- `import.meta.env.DEV` checks in code
- Only active when running `npm run dev`
- Not included in production builds

---

## 🐛 Reporting Issues

If you encounter a sign-out issue:

1. **Open DevTools Console** before reproducing the issue
2. **Reproduce the issue** (refresh, navigate, etc.)
3. **Copy ALL console logs** (especially stack traces)
4. **Check localStorage** in Application tab
5. **Include these in bug report:**
   - Full console logs
   - localStorage state (screenshot)
   - Steps to reproduce
   - Browser & version

---

## 📁 Files with Diagnostic Logging

| File | What's Logged |
|------|---------------|
| `authStore.ts` | Rehydration, login, logout, token changes, unexpected sign-outs |
| `router.tsx` | ProtectedRoute & PublicRoute access checks, redirects |
| `storageMonitor.ts` | All localStorage operations on auth keys |
| `main.tsx` | Storage monitor initialization |
| `AuthInitializer.tsx` | Token validation flow (existing logs) |

---

## 🎓 Examples

### Example 1: Normal Login Flow
```
🔐 [AuthStore] setAuth called
   User: user@example.com
   ✅ Auth state set, isAuthenticated = true

📝 [StorageMonitor] localStorage.setItem
   Key: accessToken
   Value length: 392 chars

📝 [StorageMonitor] localStorage.setItem
   Key: refreshToken
   Value length: 86 chars

🛡️ [ProtectedRoute] Access granted
   isAuthenticated: true
   refreshToken: EXISTS
```

### Example 2: Normal Logout Flow
```
🚪 [AuthStore] logout called
   Current user: user@example.com
   📍 Logout triggered from:
   at LogoutButton.onClick (...)

   📊 localStorage state before logout:
      all tokens: EXISTS ✅

🗑️ [StorageMonitor] localStorage.removeItem
   Key: mojeeb-auth-storage

   📊 localStorage state after logout:
      all tokens: CLEARED ✅
```

### Example 3: Bug Detection (Unexpected Sign-Out)
```
🚨 [AuthStore] UNEXPECTED SIGN-OUT DETECTED
   isAuthenticated changed: true → false
   Current user: user@example.com
   Current refreshToken: MISSING ⚠️
   📍 Sign-out triggered from:
   at SomeComponent.useEffect (...)  ← BUG LOCATION!
```

---

## 🔍 Advanced Debugging

### Monitor Zustand Devtools

Install [Redux DevTools Extension](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd) to see Zustand state changes in real-time.

### Network Tab

Check for failed API requests:
- 401 Unauthorized (token expired)
- 403 Forbidden (invalid token)
- Network errors

### Application Tab

Inspect localStorage directly:
- `mojeeb-auth-storage` - Zustand persist data (JSON)
- `accessToken` - JWT access token
- `refreshToken` - Refresh token

---

## ✅ Success Criteria

After the fix, you should see:

1. **Consistent rehydration** - Same logs every refresh
2. **No unexpected sign-outs** - No 🚨 error logs
3. **Clean logout** - All tokens cleared
4. **No redirect loops** - Single redirect path

---

**Last Updated:** December 18, 2025
**Version:** 1.0.0
