# Analytics Migration Guide

Complete guide for migrating from old tracking code to the new unified analytics system.

## Overview

**Old System:**
- 2 separate files: `gtmTracking.ts`, `metaPixelTracking.ts`
- Duplicate imports and function calls in every component
- No type safety
- Hard to maintain and extend

**New System:**
- Single unified API
- Type-safe events with autocomplete
- Easy to add new platforms
- Centralized configuration

---

## Migration Steps

### Step 1: Initialize Analytics Service

**File:** `src/main.tsx`

```typescript
// Add this import
import { analytics } from '@/lib/analytics';

// Initialize before ReactDOM.createRoot
analytics.initialize();

createRoot(document.getElementById('root')!).render(
  // ... your app
);
```

---

### Step 2: Migrate Component Tracking Calls

#### Example 1: SignUpPage.tsx

**Before:**
```typescript
import { trackSignupSuccess } from '@/utils/gtmTracking';
import { trackSignupCompleted } from '@/utils/metaPixelTracking';

const onSubmit = async (data: SignUpForm) => {
  const authResponse = await authService.register(data);

  // Two separate calls
  trackSignupSuccess(
    authResponse.user.id,
    authResponse.user.email,
    authResponse.user.name,
    'email'
  );
  trackSignupCompleted(
    authResponse.user.id,
    authResponse.user.email,
    'email'
  );
};
```

**After:**
```typescript
import { useAnalytics } from '@/lib/analytics';

const { track } = useAnalytics();

const onSubmit = async (data: SignUpForm) => {
  const authResponse = await authService.register(data);

  // Single call, type-safe, sends to all providers
  track('signup_completed', {
    userId: authResponse.user.id,
    email: authResponse.user.email,
    name: authResponse.user.name,
    signupMethod: 'email',
  });
};
```

---

#### Example 2: SocialLoginButtons.tsx

**Before:**
```typescript
import { trackSignupSuccess } from '@/utils/gtmTracking';
import { trackSignupCompleted } from '@/utils/metaPixelTracking';

const googleLogin = useGoogleLogin({
  onSuccess: async (tokenResponse) => {
    const authResponse = await authService.loginWithGoogle(...);

    trackSignupSuccess(
      authResponse.user.id,
      authResponse.user.email,
      authResponse.user.name,
      'google'
    );
    trackSignupCompleted(
      authResponse.user.id,
      authResponse.user.email,
      'google'
    );
  },
});
```

**After:**
```typescript
import { useAnalytics } from '@/lib/analytics';

const { track } = useAnalytics();

const googleLogin = useGoogleLogin({
  onSuccess: async (tokenResponse) => {
    const authResponse = await authService.loginWithGoogle(...);

    track('signup_completed', {
      userId: authResponse.user.id,
      email: authResponse.user.email,
      name: authResponse.user.name,
      signupMethod: 'google',
    });
  },
});
```

---

#### Example 3: StepSuccess.tsx (Agent Creation)

**Before:**
```typescript
import { trackAgentCreated as trackAgentCreatedGTM } from '@/utils/gtmTracking';
import { trackAgentCreated as trackAgentCreatedMeta } from '@/utils/metaPixelTracking';

onSuccess: (data) => {
  trackAgentCreatedGTM(data.agent.id, agentName);
  trackAgentCreatedMeta(data.agent.id, agentName);
}
```

**After:**
```typescript
import { useAnalytics } from '@/lib/analytics';

const { track } = useAnalytics();

onSuccess: (data) => {
  track('agent_created', {
    agentId: data.agent.id,
    agentName: agentName,
    userId: currentUser.id, // Auto-added if user is identified
  });
}
```

---

#### Example 4: SubscriptionSuccessPage.tsx

**Before:**
```typescript
import { trackSubscriptionPurchase } from '@/utils/metaPixelTracking';

useEffect(() => {
  if (subscription && subscription.status === 'active' && !hasTrackedPurchase.current) {
    hasTrackedPurchase.current = true;

    trackSubscriptionPurchase(
      subscription.planName,
      subscription.amount,
      subscription.currency
    );
  }
}, [subscription]);
```

**After:**
```typescript
import { useAnalytics } from '@/lib/analytics';

const { track } = useAnalytics();

useEffect(() => {
  if (subscription && subscription.status === 'active' && !hasTrackedPurchase.current) {
    hasTrackedPurchase.current = true;

    track('subscription_purchased', {
      subscriptionId: subscription.id,
      planName: subscription.planName,
      planCode: subscription.planCode,
      amount: subscription.amount,
      currency: subscription.currency,
      billingInterval: subscription.billingInterval,
      paymentMethod: subscription.paymentMethod,
      userId: currentUser.id,
    });
  }
}, [subscription]);
```

---

#### Example 5: useCreateCheckoutMutation.ts

**Before:**
```typescript
import { trackCheckoutInitiated } from '@/utils/metaPixelTracking';
import { usePlanStore } from '@/features/subscriptions/stores/planStore';

mutationFn: async (request: CreateCheckoutRequest) => {
  const plans = usePlanStore.getState().plans;
  const plan = plans.find((p) => p.id === request.planId);

  if (plan) {
    const pricing = plan.pricing[request.currency];
    const price = request.billingInterval === 'monthly' ? pricing?.monthly : pricing?.annual;

    if (price) {
      trackCheckoutInitiated(plan.name, price, request.currency);
    }
  }

  return billingService.createCheckoutSession(request);
}
```

**After:**
```typescript
import { analytics } from '@/lib/analytics';
import { usePlanStore } from '@/features/subscriptions/stores/planStore';

mutationFn: async (request: CreateCheckoutRequest) => {
  const plans = usePlanStore.getState().plans;
  const plan = plans.find((p) => p.id === request.planId);

  if (plan) {
    const pricing = plan.pricing[request.currency];
    const price = request.billingInterval === 'monthly' ? pricing?.monthly : pricing?.annual;

    if (price) {
      analytics.track('checkout_initiated', {
        planId: plan.id,
        planName: plan.name,
        planCode: plan.code,
        amount: price,
        currency: request.currency,
        billingInterval: request.billingInterval,
        userId: currentUser.id,
      });
    }
  }

  return billingService.createCheckoutSession(request);
}
```

---

### Step 3: Add User Identification

**File:** `src/features/auth/components/AuthInitializer.tsx` (or similar)

```typescript
import { useAnalytics } from '@/lib/analytics';
import { useAuthStore } from '@/features/auth/stores/authStore';

export function AuthInitializer() {
  const { identify, reset } = useAnalytics();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user) {
      // Identify user - adds userId to all subsequent events
      identify(user.id, {
        email: user.email,
        name: user.name,
        role: user.role,
      });
    } else {
      // Reset on logout
      reset();
    }
  }, [user, identify, reset]);

  return null;
}
```

Add to your app:
```typescript
// src/App.tsx
import { AuthInitializer } from '@/features/auth/components/AuthInitializer';

function App() {
  return (
    <>
      <AuthInitializer />
      {/* ... rest of app */}
    </>
  );
}
```

---

### Step 4: Remove Old Tracking Files

After migration is complete and tested:

```bash
# Delete old tracking utilities
rm src/utils/gtmTracking.ts
rm src/utils/metaPixelTracking.ts

# Search for any remaining imports
grep -r "gtmTracking\|metaPixelTracking" src/
# Should return no results
```

---

## Complete File Changes Summary

### Files to Modify

1. ✅ `src/main.tsx` - Initialize analytics
2. ✅ `src/features/auth/pages/SignUpPage.tsx` - Replace tracking calls
3. ✅ `src/features/auth/components/SocialLoginButtons.tsx` - Replace tracking calls
4. ✅ `src/features/onboarding/components/StepSuccess.tsx` - Replace tracking calls
5. ✅ `src/features/billing/pages/SubscriptionSuccessPage.tsx` - Replace tracking calls
6. ✅ `src/features/billing/hooks/useCreateCheckoutMutation.ts` - Replace tracking calls
7. ✅ `src/App.tsx` or `src/features/auth/components/AuthInitializer.tsx` - Add user identification

### Files to Delete (after migration)

1. ❌ `src/utils/gtmTracking.ts`
2. ❌ `src/utils/metaPixelTracking.ts`

---

## Testing Checklist

After migration, test each tracking event:

### Authentication
- [ ] Sign up with email → Check `signup_completed` in console
- [ ] Sign up with Google → Check `signup_completed` in console
- [ ] Login → Check user identification in console

### Onboarding
- [ ] Create agent → Check `agent_created` in console

### Subscription
- [ ] Click "Pay with Stripe" → Check `checkout_initiated` in console
- [ ] Complete payment → Check `subscription_purchased` in console

### Meta Events Manager
- [ ] Open [Meta Events Manager](https://business.facebook.com/events_manager2/)
- [ ] Check **Test Events** tab
- [ ] Verify all events appear in real-time

### Google Tag Manager
- [ ] Open [GTM Preview Mode](https://tagmanager.google.com/)
- [ ] Check dataLayer events
- [ ] Verify all events fire correctly

---

## Common Issues & Solutions

### Issue: TypeScript errors on event names

**Solution:** Make sure you're using the exact event names defined in `types.ts`:
```typescript
// ✅ Correct
track('signup_completed', { ... });

// ❌ Wrong
track('signupCompleted', { ... });
track('signup-completed', { ... });
```

---

### Issue: Events not appearing in Meta Pixel

**Solution:** Check:
1. Meta Pixel script loaded in `index.html`
2. Provider enabled in `config.ts`
3. Debug console shows `[Meta Pixel]` logs
4. Check browser console for errors

---

### Issue: Missing userId in events

**Solution:** Make sure `AuthInitializer` is added and user is identified:
```typescript
const { identify } = useAnalytics();
identify(user.id, { email: user.email });
```

---

### Issue: Duplicate events firing

**Solution:** Remove old tracking imports. Search for:
```bash
grep -r "import.*gtmTracking\|import.*metaPixelTracking" src/
```

---

## Rollback Plan

If you need to rollback:

1. Keep old tracking files (`gtmTracking.ts`, `metaPixelTracking.ts`)
2. Don't delete them until migration is fully tested
3. Use feature flag to switch between old/new:

```typescript
// Feature flag approach
const USE_NEW_ANALYTICS = import.meta.env.VITE_NEW_ANALYTICS === 'true';

if (USE_NEW_ANALYTICS) {
  track('signup_completed', { ... });
} else {
  trackSignupSuccess(...);
  trackSignupCompleted(...);
}
```

---

## Timeline

Recommended migration timeline:

- **Week 1:** Create new analytics system (✅ Done)
- **Week 2:** Migrate authentication tracking + test
- **Week 3:** Migrate subscription tracking + test
- **Week 4:** Migrate remaining events + test
- **Week 5:** Monitor production, verify data
- **Week 6:** Remove old tracking files

---

## Support

For questions or issues:
1. Check the [README.md](src/lib/analytics/README.md)
2. Review this migration guide
3. Check browser console for debug logs
4. Verify Meta Events Manager shows events

---

## Benefits After Migration

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Lines of tracking code** | ~15 per component | ~5 per component | -67% |
| **Import statements** | 2-3 per component | 1 per component | -50% |
| **Function calls per event** | 2+ | 1 | -50% |
| **Type safety** | None | Full | ∞% |
| **New platform onboarding** | Touch all components | Add 1 provider | -95% |
| **Testing complexity** | High | Low | -80% |

---

**Migration is complete when:**
✅ All tracking calls use `useAnalytics()` hook
✅ Old tracking files deleted
✅ All tests pass
✅ Meta Events Manager shows events
✅ GTM Preview shows events
✅ No TypeScript errors
✅ Production monitoring confirms data flow
