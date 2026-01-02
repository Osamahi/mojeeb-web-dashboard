# Analytics Library

Unified, type-safe analytics tracking for Mojeeb Dashboard.

## Features

✅ **Type-safe** - Autocomplete for event names and parameters
✅ **Single API** - One function to track all events across all platforms
✅ **Provider pattern** - Easy to add/remove tracking platforms
✅ **Centralized config** - All IDs and settings in one place
✅ **React hook** - Clean component integration
✅ **Testable** - Easy to mock for unit tests
✅ **Debug mode** - Console logging in development

## Quick Start

### 1. Initialize (App Entry Point)

```typescript
// src/main.tsx
import { analytics } from '@/lib/analytics';

// Initialize once on app startup
analytics.initialize();
```

### 2. Track Events (Components)

```typescript
import { useAnalytics } from '@/lib/analytics';

function SignUpPage() {
  const { track } = useAnalytics();

  const handleSignup = async (data: SignUpForm) => {
    const response = await authService.register(data);

    // Track signup - type-safe, sends to all providers
    track('signup_completed', {
      userId: response.user.id,
      email: response.user.email,
      name: response.user.name,
      signupMethod: 'email',
    });
  };
}
```

### 3. Identify Users

```typescript
import { useAnalytics } from '@/lib/analytics';

function AuthInitializer() {
  const { identify } = useAnalytics();

  useEffect(() => {
    if (user) {
      identify(user.id, {
        email: user.email,
        name: user.name,
      });
    }
  }, [user, identify]);
}
```

### 4. Reset on Logout

```typescript
import { useAnalytics } from '@/lib/analytics';

function LogoutButton() {
  const { reset } = useAnalytics();

  const handleLogout = () => {
    authService.logout();
    reset(); // Clear analytics session
  };
}
```

## Available Events

All events are strongly typed. See `types.ts` for full definitions.

### Authentication
- `signup_completed` - User registration completed
- `login` - User login

### Agents
- `agent_created` - AI agent created
- `agent_deleted` - AI agent deleted

### Subscriptions
- `checkout_initiated` - User clicked "Pay with Stripe"
- `subscription_purchased` - Payment completed
- `subscription_canceled` - Subscription canceled
- `subscription_upgraded` - Plan upgraded
- `subscription_downgraded` - Plan downgraded

### Knowledge Base
- `knowledge_base_created` - KB document uploaded

### Integrations
- `integration_connected` - Platform connected (WhatsApp, Facebook, etc.)

### Leads
- `lead_captured` - Lead generation form submitted

### Page Views
- `page_view` - Page navigation

## Adding a New Event

### 1. Define Event Type

```typescript
// types.ts
export interface MyNewEvent {
  someId: string;
  someValue: number;
  userId: string;
}

export interface AnalyticsEventMap {
  // ... existing events
  my_new_event: MyNewEvent;
}
```

### 2. Use in Components

```typescript
const { track } = useAnalytics();

track('my_new_event', {
  someId: '123',
  someValue: 42,
  userId: user.id,
});
```

That's it! Event automatically sends to all enabled providers.

## Adding a New Provider

### 1. Create Provider Class

```typescript
// providers/LinkedInProvider.ts
import type { AnalyticsProvider } from '../types';

export class LinkedInProvider implements AnalyticsProvider {
  name = 'LinkedIn';
  isEnabled = true;

  initialize() {
    // Initialize LinkedIn Insight Tag
  }

  track(eventName, payload) {
    // Send to LinkedIn
  }

  identify(userId, traits) {
    // Identify user
  }

  reset() {
    // Reset session
  }
}
```

### 2. Register in Service

```typescript
// core/AnalyticsService.ts
this.providers = [
  new GTMProvider(),
  new MetaPixelProvider(),
  new LinkedInProvider(), // ← Add here
  new ConsoleProvider(),
];
```

### 3. Add Configuration

```typescript
// config.ts
export const analyticsConfig = {
  enabledProviders: ['gtm', 'metaPixel', 'linkedIn'],
  linkedIn: {
    partnerId: 'XXXXXXX',
  },
};
```

## Configuration

Edit `config.ts` to:
- Enable/disable providers globally
- Set tracking IDs (pixel ID, measurement ID, etc.)
- Toggle debug mode

```typescript
// config.ts
export const analyticsConfig: AnalyticsConfig = {
  enabledProviders: [
    'gtm',
    'metaPixel',
    // 'googleAnalytics', // Uncomment to enable
  ],
  debug: import.meta.env.DEV, // Auto-enabled in development
  gtm: {
    containerId: 'GTM-PQZD9VM8',
  },
  metaPixel: {
    pixelId: '2334159923685300',
  },
};
```

## Testing

### Mock in Unit Tests

```typescript
import { analytics } from '@/lib/analytics';

// Mock the service
vi.mock('@/lib/analytics', () => ({
  analytics: {
    track: vi.fn(),
    identify: vi.fn(),
    reset: vi.fn(),
  },
}));

// Test
it('tracks signup event', () => {
  const { track } = useAnalytics();
  track('signup_completed', { userId: '123', ... });

  expect(analytics.track).toHaveBeenCalledWith('signup_completed', {
    userId: '123',
    ...
  });
});
```

## Migration from Old Code

### Before (Old Code)
```typescript
import { trackSignupSuccess } from '@/utils/gtmTracking';
import { trackSignupCompleted } from '@/utils/metaPixelTracking';

// Duplicate calls, different parameters
trackSignupSuccess(userId, email, name, 'email');
trackSignupCompleted(userId, email, 'email');
```

### After (New Code)
```typescript
import { useAnalytics } from '@/lib/analytics';

const { track } = useAnalytics();

// Single call, type-safe, sends to all providers
track('signup_completed', {
  userId,
  email,
  name,
  signupMethod: 'email',
});
```

## Architecture

```
src/lib/analytics/
├── index.ts                      # Public API
├── types.ts                      # Event types & interfaces
├── config.ts                     # Configuration
├── core/
│   └── AnalyticsService.ts       # Main orchestrator
├── providers/
│   ├── GTMProvider.ts            # Google Tag Manager
│   ├── MetaPixelProvider.ts      # Facebook Pixel
│   └── ConsoleProvider.ts        # Debug logging
└── hooks/
    └── useAnalytics.ts           # React hook
```

## Benefits Over Old Code

| Aspect | Old Code | New Code |
|--------|----------|----------|
| **Imports** | 2+ per component | 1 per component |
| **Function calls** | 2+ per event | 1 per event |
| **Type safety** | ❌ None | ✅ Full autocomplete |
| **Add platform** | Touch every component | Add 1 provider class |
| **Add event** | Add 2+ functions | Add 1 type definition |
| **Testing** | Hard to mock | Easy to mock |
| **Naming** | Inconsistent | Consistent |
| **Debug** | Scattered console logs | Centralized debug mode |

## Debugging

Enable debug mode to see all events in console:

```typescript
// config.ts
debug: true, // or import.meta.env.DEV
```

Console output:
```
📊 [Analytics] signup_completed
  Payload: { userId: '123', email: '...', ... }
  Timestamp: 2025-01-02T14:30:00.000Z

[GTM] signup_completed { ... }
[Meta Pixel] Standard Event: CompleteRegistration { ... }
```

## Provider Status

| Provider | Status | Config Key |
|----------|--------|------------|
| Google Tag Manager | ✅ Active | `gtm` |
| Meta Pixel | ✅ Active | `metaPixel` |
| Google Analytics 4 | ⏳ Ready to add | `googleAnalytics` |
| LinkedIn Insight | ⏳ Ready to add | `linkedIn` |
| Twitter Pixel | ⏳ Ready to add | `twitter` |

## Best Practices

1. ✅ **Initialize once** in `main.tsx` before rendering
2. ✅ **Use the hook** in components, not direct imports
3. ✅ **Track user actions** (not page loads - use router integration)
4. ✅ **Include userId** in all events when user is logged in
5. ✅ **Use snake_case** for event names (e.g., `signup_completed`)
6. ✅ **Be specific** with event names (e.g., `subscription_purchased` not `purchase`)
7. ✅ **Test locally** with debug mode before deploying

## FAQ

**Q: Why not just use Google Tag Manager for everything?**
A: GTM adds latency and can be blocked by ad blockers. Direct tracking ensures higher data quality.

**Q: Can I disable a provider temporarily?**
A: Yes, edit `config.ts` and remove it from `enabledProviders` array.

**Q: How do I add Google Analytics 4?**
A: Create `GA4Provider.ts`, register in `AnalyticsService.ts`, add config to `config.ts`.

**Q: Will this slow down my app?**
A: No. All tracking is async and non-blocking. Failed providers don't affect others.

**Q: Can I track custom data?**
A: Yes! Add new event types to `types.ts` and they'll work automatically.
