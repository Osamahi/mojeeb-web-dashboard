# Analytics Architecture Overview

Clean, maintainable, type-safe analytics system for Mojeeb Dashboard.

---

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         React Components                         │
│  (SignUpPage, StepSuccess, SubscriptionSuccess, etc.)           │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ useAnalytics() hook
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     AnalyticsService (Singleton)                 │
│                                                                   │
│  • Orchestrates all providers                                   │
│  • Enriches events with userId                                  │
│  • Handles errors gracefully                                    │
│  • Maintains user session                                       │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ Distributes to all providers
                            │
      ┌─────────────────────┼─────────────────────┐
      │                     │                     │
      ▼                     ▼                     ▼
┌──────────────┐  ┌──────────────────┐  ┌──────────────┐
│ GTMProvider  │  │ MetaPixelProvider│  │ConsoleProvider│
│              │  │                  │  │              │
│ • dataLayer  │  │ • fbq('track')   │  │ • Debug logs │
│ • GTM events │  │ • Standard events│  │ • Dev mode   │
│              │  │ • Custom events  │  │              │
└──────┬───────┘  └────────┬─────────┘  └──────┬───────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌──────────────┐  ┌──────────────────┐  ┌──────────────┐
│ Google Tag   │  │  Meta Pixel      │  │   Browser    │
│  Manager     │  │  (Facebook Ads)  │  │   Console    │
└──────────────┘  └──────────────────┘  └──────────────┘
```

---

## 🏗️ Folder Structure

```
src/lib/analytics/
│
├── index.ts                          # Public API - Single export point
│   ├── analytics (service)
│   ├── useAnalytics (hook)
│   └── Types (for TypeScript)
│
├── types.ts                          # Type Definitions
│   ├── AnalyticsEventMap            # Event name → payload mapping
│   ├── Event interfaces             # SignupCompletedEvent, etc.
│   └── AnalyticsProvider interface  # Contract for providers
│
├── config.ts                         # Centralized Configuration
│   ├── enabledProviders             # ['gtm', 'metaPixel']
│   ├── debug mode                   # Auto-enabled in dev
│   └── Provider configs             # Pixel IDs, container IDs
│
├── core/
│   └── AnalyticsService.ts          # Main Orchestrator
│       ├── initialize()             # Setup providers
│       ├── track()                  # Send to all providers
│       ├── identify()               # Set current user
│       └── reset()                  # Clear session
│
├── providers/
│   ├── GTMProvider.ts               # Google Tag Manager
│   │   └── window.dataLayer.push()
│   │
│   ├── MetaPixelProvider.ts         # Facebook Pixel
│   │   ├── Standard events → fbq('track')
│   │   └── Custom events → fbq('trackCustom')
│   │
│   └── ConsoleProvider.ts           # Development Logging
│       └── console.log() (debug mode only)
│
└── hooks/
    └── useAnalytics.ts              # React Hook
        ├── track()                  # Type-safe tracking
        ├── identify()               # User identification
        └── reset()                  # Session reset
```

---

## 🎯 Data Flow

### Example: User Signs Up

```
1. User submits signup form
   ↓
2. Component calls track()
   ↓
   const { track } = useAnalytics();
   track('signup_completed', {
     userId: '123',
     email: 'user@example.com',
     name: 'John Doe',
     signupMethod: 'email'
   });
   ↓
3. AnalyticsService receives event
   • Enriches with userId (if identified)
   • Adds timestamp
   ↓
4. Distributes to all enabled providers in parallel
   ↓
   ┌─────────────────┬─────────────────┬─────────────────┐
   │                 │                 │                 │
   ▼                 ▼                 ▼                 ▼
GTMProvider     MetaPixelProvider  ConsoleProvider
   │                 │                 │
   │                 │                 │
window.dataLayer   window.fbq()    console.log()
   │                 │                 │
   ▼                 ▼                 ▼
dataLayer.push({   fbq('track',    📊 [Analytics]
  event:          'CompleteReg',    signup_completed
  'signup_       {                   { userId: ... }
   completed',     content_name:
  userId: '123',   'User Signup',
  email: '...',    status: 'comp',
  name: '...',     user_id: '123',
  signupMethod:    signup_method:
   'email'          'email'
})                 })
```

---

## 🔑 Key Design Patterns

### 1. **Singleton Pattern**
```typescript
// AnalyticsService.ts
class AnalyticsService { ... }
export const analytics = new AnalyticsService(); // Single instance
```

### 2. **Provider Pattern**
```typescript
interface AnalyticsProvider {
  name: string;
  isEnabled: boolean;
  initialize(): void;
  track(eventName, payload): void;
  identify(userId, traits): void;
  reset(): void;
}
```

### 3. **Type-safe Event Registry**
```typescript
interface AnalyticsEventMap {
  signup_completed: SignupCompletedEvent;
  agent_created: AgentCreatedEvent;
  // ... etc
}

// Enforces correct payload for each event name
track<T extends keyof AnalyticsEventMap>(
  eventName: T,
  payload: AnalyticsEventMap[T]
): void;
```

### 4. **Error Isolation**
```typescript
// If one provider fails, others continue
providers.forEach(provider => {
  try {
    provider.track(eventName, payload);
  } catch (error) {
    console.error(`${provider.name} failed:`, error);
    // Other providers unaffected
  }
});
```

---

## 📈 Comparison: Old vs New

### Code Quality

| Metric | Old System | New System | Improvement |
|--------|-----------|------------|-------------|
| **Files** | 2 util files | 1 lib folder | Centralized |
| **Imports per component** | 2-3 | 1 | -67% |
| **Function calls per event** | 2+ | 1 | -50% |
| **Type safety** | None | Full | ∞% |
| **Autocomplete** | No | Yes | ✅ |
| **Testing** | Hard | Easy | ✅ |

### Maintenance

| Task | Old System | New System |
|------|-----------|------------|
| **Add new event** | Add function to 2 files | Add 1 type definition |
| **Add new platform** | Touch every component | Add 1 provider class |
| **Change event data** | Update all call sites | Update 1 type definition |
| **Debug tracking** | Check 2+ files | Single debug flag |
| **Test tracking** | Mock 2+ modules | Mock 1 service |

### Developer Experience

**Old Code (Per Component):**
```typescript
// SignUpPage.tsx
import { trackSignupSuccess } from '@/utils/gtmTracking';        // Import 1
import { trackSignupCompleted } from '@/utils/metaPixelTracking'; // Import 2

trackSignupSuccess(userId, email, name, 'email');     // Call 1
trackSignupCompleted(userId, email, 'email');         // Call 2
```
- No autocomplete
- Easy to typo
- Parameters differ between platforms
- Hard to remember parameter order

**New Code (Per Component):**
```typescript
import { useAnalytics } from '@/lib/analytics';  // Single import

const { track } = useAnalytics();

track('signup_completed', {  // ← Autocomplete suggests event names
  userId,                    // ← Autocomplete suggests required fields
  email,                     // ← TypeScript errors if field missing
  name,                      // ← Consistent across all platforms
  signupMethod: 'email',     // ← Type-checked enum
});
```
- Full autocomplete
- Compile-time validation
- Single source of truth
- Self-documenting

---

## 🚀 Extensibility

### Adding a New Provider (e.g., Google Analytics 4)

**Step 1:** Create provider class
```typescript
// providers/GA4Provider.ts
export class GA4Provider implements AnalyticsProvider {
  name = 'Google Analytics 4';
  isEnabled = true;

  initialize() {
    // Initialize gtag
  }

  track(eventName, payload) {
    gtag('event', eventName, payload);
  }

  identify(userId, traits) {
    gtag('set', 'user_properties', traits);
  }

  reset() {
    // Clear user data
  }
}
```

**Step 2:** Register in service
```typescript
// core/AnalyticsService.ts
this.providers = [
  new GTMProvider(),
  new MetaPixelProvider(),
  new GA4Provider(),  // ← Add here
  new ConsoleProvider(),
];
```

**Step 3:** Add config
```typescript
// config.ts
export const analyticsConfig = {
  enabledProviders: ['gtm', 'metaPixel', 'ga4'],
  ga4: {
    measurementId: 'G-XXXXXXXXXX',
  },
};
```

**Done!** All existing tracking calls now send to GA4 automatically.

---

### Adding a New Event

**Step 1:** Define type
```typescript
// types.ts
export interface DocumentUploadedEvent {
  documentId: string;
  documentType: string;
  sizeBytes: number;
  agentId: string;
  userId: string;
}

export interface AnalyticsEventMap {
  // ... existing events
  document_uploaded: DocumentUploadedEvent;
}
```

**Step 2:** Use in components
```typescript
const { track } = useAnalytics();

track('document_uploaded', {
  documentId: doc.id,
  documentType: doc.type,
  sizeBytes: doc.size,
  agentId: agent.id,
  userId: user.id,
});
```

**Done!** Event automatically sends to all providers with type safety.

---

## 🧪 Testing Strategy

### Unit Testing Components

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

describe('SignUpPage', () => {
  it('tracks signup event', async () => {
    const { track } = useAnalytics();

    // Trigger signup
    await userSignUp({ email: 'test@example.com' });

    // Verify tracking
    expect(analytics.track).toHaveBeenCalledWith('signup_completed', {
      userId: expect.any(String),
      email: 'test@example.com',
      name: expect.any(String),
      signupMethod: 'email',
    });
  });
});
```

### Integration Testing Providers

```typescript
describe('GTMProvider', () => {
  it('sends events to dataLayer', () => {
    const provider = new GTMProvider();
    provider.initialize();

    provider.track('signup_completed', {
      userId: '123',
      email: 'test@example.com',
      name: 'Test User',
      signupMethod: 'email',
    });

    expect(window.dataLayer).toContainEqual(
      expect.objectContaining({
        event: 'signup_completed',
        userId: '123',
      })
    );
  });
});
```

---

## 🔒 Security & Privacy

### Data Minimization
```typescript
// ✅ Good - Only send necessary data
track('agent_created', {
  agentId: agent.id,
  agentName: agent.name,  // OK - user-provided
  userId: user.id,
});

// ❌ Bad - Don't send sensitive data
track('agent_created', {
  agentId: agent.id,
  apiKey: agent.apiKey,      // ❌ Never send secrets
  password: user.password,   // ❌ Never send credentials
});
```

### GDPR Compliance
- User IDs are UUIDs (not PII)
- Email addresses hashed by Meta Pixel automatically
- User can opt out by disabling providers in config
- Reset session on logout

---

## 📊 Monitoring & Debugging

### Debug Mode (Development)
```typescript
// config.ts
debug: import.meta.env.DEV, // Auto-enabled in development
```

**Console output:**
```
📊 [Analytics] signup_completed
  Payload: { userId: '123', email: '...', ... }
  Timestamp: 2025-01-02T14:30:00.000Z

[GTM] signup_completed { event: 'signup_completed', ... }
[Meta Pixel] Standard Event: CompleteRegistration { ... }
```

### Production Monitoring
- Check Meta Events Manager for real-time events
- Use GTM Preview Mode for debugging
- Monitor provider.isEnabled status
- Track error rates per provider

---

## 🎓 Best Practices

1. ✅ **Initialize once** in `main.tsx` before app renders
2. ✅ **Use the hook** in components, not direct imports
3. ✅ **Identify users** early (in AuthInitializer)
4. ✅ **Track actions, not renders** (user intent, not lifecycle)
5. ✅ **Be specific** with event names (`agent_created` not `action`)
6. ✅ **Include userId** in all events when logged in
7. ✅ **Test locally** with debug mode before deploying
8. ✅ **Document events** in types.ts with JSDoc comments

---

## 📚 Resources

- [README.md](src/lib/analytics/README.md) - Full documentation
- [MIGRATION_GUIDE.md](ANALYTICS_MIGRATION_GUIDE.md) - Step-by-step migration
- [types.ts](src/lib/analytics/types.ts) - All event definitions
- [config.ts](src/lib/analytics/config.ts) - Configuration reference

---

## 🎯 Success Criteria

Analytics system is successful when:

✅ **Developer Experience**
- Single import per component
- Autocomplete for all events
- Type errors for missing fields
- Easy to add new events

✅ **Maintainability**
- New platform = 1 provider class
- New event = 1 type definition
- Change event data = update 1 file
- Debug mode shows all events

✅ **Reliability**
- Failed provider doesn't affect others
- Missing pixel script doesn't crash app
- Events still tracked if GTM blocked
- Graceful degradation

✅ **Performance**
- Non-blocking async calls
- No duplicate events
- Minimal bundle size impact
- Fast initialization

✅ **Data Quality**
- 100% event tracking coverage
- Consistent data across platforms
- No missing userId fields
- Accurate timestamps
