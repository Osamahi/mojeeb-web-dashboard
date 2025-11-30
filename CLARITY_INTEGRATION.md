# Microsoft Clarity Integration Guide

## Overview

Microsoft Clarity is integrated into the Mojeeb Dashboard to provide:
- **Session Recordings** - Watch user sessions to understand behavior
- **Heatmaps** - Visualize where users click and scroll
- **Rage Clicks** - Identify frustrating UI elements
- **UX Analytics** - Understand user journeys and drop-off points

## Setup

### 1. Environment Configuration

Add your Clarity Project ID to `.env`:

```env
VITE_CLARITY_PROJECT_ID=ue397uqzfs
```

The integration is already configured and will:
- ✅ Only run in production (skipped in development)
- ✅ Automatically initialize on app startup
- ✅ Identify authenticated users by ID (privacy-safe)
- ✅ Clear user data on logout

### 2. Privacy & Security

#### Automatic Privacy Protections

The integration includes built-in privacy safeguards:

1. **Development Mode**: Clarity is disabled in development to avoid polluting analytics
2. **User Identification**: Only user IDs are sent (never emails or names)
3. **Automatic Logout**: User identification is cleared on logout

#### Manual Data Masking (Optional)

To mask sensitive form fields or data from recordings:

```tsx
// Add data-clarity-mask attribute to sensitive inputs
<input
  type="password"
  data-clarity-mask="true"
  placeholder="Password"
/>

// Or use className for multiple fields
<div className="clarity-mask">
  <input type="text" placeholder="Credit Card" />
  <input type="text" placeholder="SSN" />
</div>
```

**Recommended fields to mask:**
- Passwords
- Credit card numbers
- API keys or tokens
- Personal identification numbers (SSN, passport, etc.)
- Health or financial data

## Usage

### Basic Tracking (Automatic)

Clarity automatically tracks:
- Page views
- Clicks
- Scrolls
- Form interactions
- Navigation patterns

**No code changes needed** - it works out of the box!

### User Identification (Automatic)

When users log in, they're automatically identified by their user ID:

```typescript
// This happens automatically in authStore.ts:49
identifyClarityUser(user.id);
```

### Custom Event Tracking (Optional)

Track specific user actions:

```typescript
import { trackClarityEvent } from '@/lib/clarity';

// Track when user exports data
trackClarityEvent('data_export');

// Track when user completes onboarding
trackClarityEvent('onboarding_complete');

// Track feature usage
trackClarityEvent('feature_used_advanced_search');
```

### Session Tagging (Optional)

Tag sessions with metadata for segmentation:

```typescript
import { tagClaritySession } from '@/lib/clarity';

// Tag user's subscription tier
tagClaritySession('subscription_tier', 'premium');

// Tag feature usage
tagClaritySession('feature', 'export_conversations');

// Tag user type
tagClaritySession('user_type', 'power_user');
```

### Upgrade Important Sessions (Optional)

Force recording of critical user flows:

```typescript
import { upgradeClaritySession } from '@/lib/clarity';

// In critical pages (e.g., checkout, onboarding)
upgradeClaritySession();
```

## Accessing Clarity Dashboard

1. Go to [Microsoft Clarity Dashboard](https://clarity.microsoft.com/)
2. Sign in with your Microsoft account
3. Select "Mojeeb Dashboard" project
4. View:
   - **Recordings** - Watch individual user sessions
   - **Heatmaps** - See click and scroll patterns
   - **Insights** - Rage clicks, dead clicks, excessive scrolling

## Key Features

### 1. Session Recordings

Watch real user sessions to:
- Understand user behavior
- Identify usability issues
- Debug production problems
- Validate design decisions

**Filter sessions by:**
- User ID
- Page visited
- Date range
- Device type
- Custom tags

### 2. Heatmaps

Visual representation of:
- **Click maps** - Where users click
- **Scroll maps** - How far users scroll
- **Area maps** - Most engaging page sections

### 3. Rage Click Detection

Automatically identifies when users:
- Rapidly click the same element (frustration)
- Click non-clickable elements (confusion)
- Excessively scroll (looking for content)

### 4. Dead Click Detection

Finds non-functional UI elements that users try to click.

## Performance Impact

Clarity is designed to be lightweight:
- **Script size**: ~10KB gzipped
- **Performance impact**: Negligible (<5ms)
- **No blocking**: Async loading
- **Core Web Vitals**: No negative impact

## Privacy Compliance

### GDPR Compliance

Clarity is GDPR compliant when configured correctly:

1. ✅ **Data minimization** - Only user IDs tracked (no PII)
2. ✅ **User consent** - Implement cookie consent if required
3. ✅ **Data retention** - Configure in Clarity dashboard
4. ✅ **Right to deletion** - Can delete user data via dashboard

### Cookie Consent Integration (Optional)

If your app has cookie consent:

```typescript
import { setClarityConsent } from '@/lib/clarity';

// When user accepts cookies
setClarityConsent(true);

// When user rejects cookies
setClarityConsent(false);
```

## Troubleshooting

### Clarity not recording sessions

1. **Check Project ID**: Verify `VITE_CLARITY_PROJECT_ID` is set correctly
2. **Check environment**: Clarity only runs in production, not development
3. **Check browser console**: Look for initialization logs
4. **Wait 5-10 minutes**: Sessions may take time to appear in dashboard

### User not identified in recordings

1. **Check login flow**: User must be authenticated
2. **Check authStore**: `identifyClarityUser()` is called on login
3. **Check browser console**: Look for identification logs

### Sensitive data visible in recordings

1. **Add masking**: Use `data-clarity-mask="true"` on sensitive fields
2. **Update privacy settings**: Configure in Clarity dashboard
3. **Review recordings**: Verify masked data appears as asterisks

## API Reference

### Core Functions

```typescript
// Initialize Clarity (automatic on app startup)
initializeClarity(): void

// Check if Clarity is active
isClarityActive(): boolean

// Identify user (automatic on login)
identifyClarityUser(userId: string, customId?: string): void

// Tag session with metadata
tagClaritySession(key: string, value: string): void

// Track custom event
trackClarityEvent(eventName: string): void

// Upgrade session for detailed tracking
upgradeClaritySession(): void

// Set cookie consent
setClarityConsent(hasConsent: boolean): void

// Clear user identification (automatic on logout)
clearClarityUser(): void

// Get current session ID
getClaritySessionId(): string | null
```

## Best Practices

### DO:
- ✅ Tag important user flows for easy filtering
- ✅ Mask sensitive form fields
- ✅ Review rage clicks to improve UX
- ✅ Use heatmaps to optimize layouts
- ✅ Track custom events for key actions
- ✅ Segment sessions by user type or feature

### DON'T:
- ❌ Record sensitive personal information (PII)
- ❌ Track users without proper consent (if required)
- ❌ Over-track (too many custom events)
- ❌ Ignore privacy regulations
- ❌ Share session links publicly (may contain user data)

## Support & Resources

- **Clarity Documentation**: https://docs.microsoft.com/en-us/clarity/
- **Clarity Dashboard**: https://clarity.microsoft.com/
- **Internal Support**: Contact dev team

## Migration Notes

### From Script Tag to NPM Package

This implementation uses the official `@microsoft/clarity` npm package instead of a script tag for:
- Better TypeScript support
- Easier testing and debugging
- Centralized configuration
- Version control

### Upgrading

To update Clarity:

```bash
npm update @microsoft/clarity
```

---

**Last Updated**: January 2025
**Project ID**: ue397uqzfs
**Status**: ✅ Production Ready
