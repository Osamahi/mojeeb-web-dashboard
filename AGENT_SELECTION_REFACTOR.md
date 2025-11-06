# Universal Agent Selection Refactor

## Overview

This document outlines the comprehensive refactor of the global agent selection system in mojeeb-dashboard to eliminate flickering, duplicate fetching, and manual dependency tracking.

**Status**: ✅ Completed (2025-01-06)
**Enhanced**: ✅ Conversations Migrated to React Query (2025-01-06)

**Problem Solved**: Page flickering, duplicate logging, cascading re-renders, and race conditions when switching agents or refreshing the page.

**Additional Enhancements**: Complete migration of conversation data management from Zustand to React Query with real-time subscriptions.

---

## 🎯 Architecture Vision

### Before (BROKEN)
```
❌ Mixed State Management
┌─────────────────────────────────────────┐
│  Zustand: globalSelectedAgent           │ ← Single source of truth
└─────────────────────────────────────────┘
            ↓
    Manual Callbacks & Invalidation
            ↓
┌─────────────────────┬─────────────────────┐
│ React Query (Some)  │ Zustand (Others)    │ ← Mixed patterns
│ - Team              │ - Conversations     │
│ - Knowledge Bases   │ (manual refetch)    │
└─────────────────────┴─────────────────────┘
            ↓
Multiple useEffect hooks watching agentId
Multiple manual refetch calls
Duplicate code everywhere
```

### After (CLEAN)
```
✅ Pure Reactive Architecture
┌─────────────────────────────────────────┐
│  Zustand: globalSelectedAgent (UI only) │ ← Single source of truth
└─────────────────────────────────────────┘
            ↓
    Automatic React Query Reactivity
            ↓
┌─────────────────────────────────────────┐
│    React Query: ALL Server Data         │
│  - Conversations ['conversations', agentId]
│  - Knowledge Bases ['knowledge-bases', agentId]
│  - Team Members ['team-members', agentId]
└─────────────────────────────────────────┘
            ↓
Query keys include agentId → Automatic refetch
NO manual useEffect, NO callbacks, NO invalidation
```

---

## 🔴 Problems Identified

### 1. Circular Re-render Loop
- **Location**: `DashboardLayout.tsx:34` and `AgentsPage.tsx:42`
- **Issue**: Unstable function dependencies in useEffect arrays
- **Result**: Multiple re-renders causing flickering

### 2. Duplicate Agent Fetching
- **Locations**:
  - `DashboardLayout.tsx:21-25` (React Query)
  - `AgentsPage.tsx:22-35` (React Query with same key + logging)
- **Issue**: Same `['agents']` query key used twice
- **Result**: Duplicate API calls and console.log spam

### 3. Mixed State Management
- **Issue**: Conversations use Zustand store, Team/Studio use React Query
- **Result**: Inconsistent patterns, manual refetch logic needed

### 4. Manual Dependency Tracking
- **Locations**: 6 files with duplicate `useEffect` watching `agentId`
- **Issue**: Manual tracking of what React Query should do automatically
- **Result**: Code duplication, maintenance burden

### 5. Blind Invalidation
- **Location**: `useAgentDataReload.ts`
- **Issue**: Invalidates ALL queries regardless of need
- **Result**: Unnecessary refetches, performance hit

### 6. Incomplete Query Keys
- **Issue**: Most queries don't include `agentId` in their keys
- **Result**: React Query can't auto-refetch when agent changes

---

## 📋 Implementation Steps

### ✅ Step 1: Create Universal Agent Context Hook
**File**: `/src/hooks/useAgentContext.ts`

```typescript
import { useAgentStore } from '@/features/agents/stores/agentStore';

export function useAgentContext() {
  const globalSelectedAgent = useAgentStore((state) => state.globalSelectedAgent);

  return {
    agent: globalSelectedAgent,
    agentId: globalSelectedAgent?.id,
    isAgentSelected: !!globalSelectedAgent,
  };
}
```

**Purpose**: Single import point for agent context across all components

---

### ✅ Step 2: Create Query Key Factory
**File**: `/src/lib/queryKeys.ts`

```typescript
export const queryKeys = {
  // Agent-scoped queries
  agents: () => ['agents'] as const,
  agent: (agentId: string | undefined) => ['agent', agentId] as const,
  conversations: (agentId: string | undefined) => ['conversations', agentId] as const,
  knowledgeBases: (agentId: string | undefined) => ['knowledge-bases', agentId] as const,
  teamMembers: (agentId: string | undefined) => ['team-members', agentId] as const,
  teamStats: (agentId: string | undefined) => ['team-stats', agentId] as const,

  // Conversation-scoped queries
  messages: (conversationId: string | undefined, agentId: string | undefined) =>
    ['messages', conversationId, agentId] as const,
};
```

**Purpose**:
- Centralized, typed query key definitions
- Ensures consistency across entire app
- TypeScript autocomplete for query keys

---

### ✅ Step 3: Create Conversations Query Hook
**File**: `/src/features/conversations/hooks/useConversations.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { useAgentContext } from '@/hooks/useAgentContext';
import { queryKeys } from '@/lib/queryKeys';
import { conversationService } from '../services/conversationService';

export function useConversations() {
  const { agentId } = useAgentContext();

  return useQuery({
    queryKey: queryKeys.conversations(agentId),
    queryFn: () => conversationService.fetchConversations({ agentId: agentId! }),
    enabled: !!agentId,
    staleTime: 30 * 1000, // 30 seconds
  });
}
```

**Purpose**:
- Migrate conversations from Zustand to React Query
- Automatic refetch when `agentId` changes
- Proper caching and loading states

---

### ✅ Step 4: Delete Manual Invalidation Hook
**Deleted File**: `/src/features/agents/hooks/useAgentDataReload.ts`

**Reason**: React Query automatically refetches when query keys change. No manual invalidation needed.

**Code Removed**: ~45 lines of blind invalidation logic

---

### ✅ Step 5: Fix DashboardLayout Dependencies
**File**: `DashboardLayout.tsx`

**Changes**:
- Remove `onAgentSwitch` callback
- Remove unstable dependencies from useEffect
- Keep single source of agent fetching

**Before**:
```typescript
const reloadAgentData = useAgentDataReload();

// ...

}, [isLoading, agents, setAgents, initializeAgentSelection]);
//                     ^^^^^^^^  ^^^^^^^^^^^^^^^^^^^^^^^^ ← UNSTABLE
```

**After**:
```typescript
// No callback needed

// ...

// eslint-disable-next-line react-hooks/exhaustive-deps
}, [isLoading, agents]);
// Zustand functions are stable - no need in dependency array
```

---

### ✅ Step 6: Remove Duplicate Fetching in AgentsPage
**File**: `AgentsPage.tsx`

**Changes**:
- Delete duplicate `useQuery(['agents'])` hook
- Delete `useEffect` syncing agents to store
- Remove all `console.log` statements
- Change to read-only consumer of store

**Before**:
```typescript
const { data: agents, isLoading, error } = useQuery({
  queryKey: ['agents'],
  queryFn: async () => {
    console.log('Fetching agents...');  // ← SPAM
    // ...
  },
});

useEffect(() => {
  if (agents) {
    setAgents(agents);  // ← DUPLICATE
  }
}, [agents, setAgents]);
```

**After**:
```typescript
const agents = useAgentStore((state) => state.agents);
const isLoading = useAgentStore((state) => state.isLoading);
// Read from store only - DashboardLayout handles fetching
```

---

### ✅ Step 7: Simplify GlobalAgentSelector
**File**: `GlobalAgentSelector.tsx`

**Changes**:
- Remove `onAgentSwitch?: () => void` callback prop
- Component becomes pure UI - no side effects

**Before**:
```typescript
interface GlobalAgentSelectorProps {
  onAgentSwitch?: () => void;
}

const handleAgentSelect = async (agentId: string) => {
  await switchAgent(agentId);
  onAgentSwitch?.();  // ← Manual callback
};
```

**After**:
```typescript
interface GlobalAgentSelectorProps {
  // No callback prop
}

const handleAgentSelect = async (agentId: string) => {
  await switchAgent(agentId);
  // React Query handles refetch automatically
};
```

---

### ✅ Step 8: Update ConversationsPage
**File**: `ConversationsPage.tsx`

**Changes**:
- Use new `useConversations()` hook
- Remove manual `useEffect` watching `agentId`
- Simplify component logic

**Before**:
```typescript
const { conversations, fetchConversations } = useConversationStore();

useEffect(() => {
  selectConversation(null);
  setShowChat(false);
}, [globalSelectedAgent?.id, selectConversation]);  // ← Manual tracking
```

**After**:
```typescript
const { data: conversations, isLoading } = useConversations();
// Automatic refetch when agent changes - no useEffect needed
```

---

### ✅ Step 9: Standardize Query Keys
**Files**: `StudioPage.tsx`, `TeamPage.tsx`

**Changes**:
- Use centralized `queryKeys` factory
- Use `useAgentContext()` instead of direct store access

**Before**:
```typescript
const globalSelectedAgent = useAgentStore((state) => state.globalSelectedAgent);

useQuery({
  queryKey: ['knowledgeBases', globalSelectedAgent?.id],
  // ...
});
```

**After**:
```typescript
const { agentId } = useAgentContext();

useQuery({
  queryKey: queryKeys.knowledgeBases(agentId),
  // ...
});
```

---

## 📊 Results

### Code Metrics

**Phase 1 - Agent Selection Refactor**:
- **Lines Removed**: ~200+ lines
  - `useAgentDataReload.ts`: 45 lines deleted
  - Duplicate fetching in `AgentsPage`: 15 lines removed
  - Manual `useEffect` hooks: 80 lines removed
  - Callback logic: 30 lines removed
  - Console logs: 10 lines removed
- **Files Modified**: 8 files
- **Files Created**: 3 new utility files
- **Files Deleted**: 1 obsolete hook

**Phase 2 - Conversation Migration**:
- **Lines Removed**: 183 lines (85% reduction in conversationStore)
- **Files Modified**: 2 files
- **Files Created**: 1 new hook (useConversationSubscription)

**Total Impact**:
- **~380+ lines removed** across entire refactor
- **11 files modified or created**
- **Consistent architecture** across all agent-scoped data

### Performance Improvements
- ✅ Only affected queries refetch (not blind invalidation)
- ✅ Proper React Query caching reduces API calls
- ✅ No more cascading useEffect triggers
- ✅ Eliminated race conditions with persist middleware

### Bug Fixes
- ✅ **No more flickering** on page refresh
- ✅ **No more duplicate logging** in console
- ✅ **No more cascading re-renders** when switching agents
- ✅ **Stable dependencies** in useEffect hooks

### Developer Experience
- ✅ Single pattern for all agent-scoped data
- ✅ TypeScript query key autocomplete
- ✅ No manual refetch logic needed
- ✅ Automatic reactivity - just works™

---

## 🎯 New Data Flow

```
User selects agent in GlobalAgentSelector
              ↓
switchAgent(agentId) updates Zustand store
              ↓
globalSelectedAgent changes in store
              ↓
All components using useAgentContext() re-render
              ↓
React Query detects query key changes
              ↓
Automatic refetch of affected queries ONLY:
  - ['conversations', newAgentId]
  - ['knowledge-bases', newAgentId]
  - ['team-members', newAgentId]
              ↓
UI updates with fresh data
              ↓
✨ DONE - Zero manual code needed
```

---

## 📚 Best Practices Established

### 1. Agent Context Usage
```typescript
// ✅ DO: Use useAgentContext hook
const { agent, agentId, isAgentSelected } = useAgentContext();

// ❌ DON'T: Access store directly in components
const globalSelectedAgent = useAgentStore((state) => state.globalSelectedAgent);
```

### 2. Query Key Construction
```typescript
// ✅ DO: Use queryKeys factory
useQuery({
  queryKey: queryKeys.conversations(agentId),
  // ...
});

// ❌ DON'T: Hardcode query keys
useQuery({
  queryKey: ['conversations', agentId],
  // ...
});
```

### 3. Agent-Scoped Queries
```typescript
// ✅ DO: Include agentId in query key + enabled check
const { agentId } = useAgentContext();

useQuery({
  queryKey: queryKeys.knowledgeBases(agentId),
  queryFn: () => agentService.getKnowledgeBases(agentId!),
  enabled: !!agentId,
});

// ❌ DON'T: Forget enabled check or agentId in key
```

### 4. No Manual Invalidation
```typescript
// ✅ DO: Let React Query handle refetch automatically
// Query keys change → automatic refetch

// ❌ DON'T: Manually invalidate queries
queryClient.invalidateQueries({ queryKey: ['conversations'] });
```

### 5. No Manual useEffect Tracking
```typescript
// ✅ DO: React Query handles dependencies
const { data: conversations } = useConversations();
// Refetches automatically when agent changes

// ❌ DON'T: Watch agentId in useEffect
useEffect(() => {
  fetchConversations(agentId);
}, [agentId]);
```

---

## 🔄 Migration Guide

### For New Features Requiring Agent Context

1. **Import the agent context hook**:
   ```typescript
   import { useAgentContext } from '@/hooks/useAgentContext';
   ```

2. **Use in your component**:
   ```typescript
   const { agent, agentId, isAgentSelected } = useAgentContext();
   ```

3. **For queries, use the query key factory**:
   ```typescript
   import { queryKeys } from '@/lib/queryKeys';

   useQuery({
     queryKey: queryKeys.yourQuery(agentId),
     queryFn: () => yourService.getData(agentId!),
     enabled: !!agentId,
   });
   ```

4. **No manual refetch logic needed** - React Query handles it automatically

### For Existing Features

- Replace direct `useAgentStore` calls with `useAgentContext()`
- Migrate Zustand data fetching to React Query with proper query keys
- Remove manual `useEffect` hooks watching `agentId`
- Use `queryKeys` factory for all query keys

---

## 🧪 Testing Checklist

- [x] Agent switching updates all dependent pages
- [x] Page refresh doesn't cause flickering
- [x] No duplicate API calls in network tab
- [x] No console.log spam
- [x] Conversations load correctly when switching agents
- [x] Knowledge bases load correctly when switching agents
- [x] Team members load correctly when switching agents
- [x] Loading states display properly
- [x] Error states display properly
- [x] No memory leaks (React Query cleanup working)

---

## 📝 Related Files

### Created Files
- `/src/hooks/useAgentContext.ts` - Universal agent context hook
- `/src/lib/queryKeys.ts` - Centralized query key factory
- `/src/features/conversations/hooks/useConversations.ts` - Conversations React Query hook

### Modified Files
- `/src/components/layout/DashboardLayout.tsx` - Removed callback, fixed dependencies
- `/src/features/agents/pages/AgentsPage.tsx` - Removed duplicate fetching
- `/src/features/agents/components/GlobalAgentSelector.tsx` - Removed callback prop
- `/src/pages/ConversationsPage.tsx` - Use new hooks
- `/src/features/agents/pages/StudioPage.tsx` - Use query key factory
- `/src/features/team/pages/TeamPage.tsx` - Use useAgentContext

### Deleted Files
- `/src/features/agents/hooks/useAgentDataReload.ts` - Obsolete manual invalidation hook

---

## 🎉 Phase 2: Conversation Migration to React Query

### Overview

After successfully refactoring the agent selection system, we completed the migration of conversation data management from Zustand to React Query. This eliminates duplicate state management and provides true reactive data flow for conversations.

### Changes Implemented

#### 1. Created useConversationSubscription Hook
**File**: `/src/features/conversations/hooks/useConversationSubscription.ts`

- Manages real-time Supabase subscriptions for conversations
- Automatically updates React Query cache on INSERT/UPDATE/DELETE events
- Handles subscription lifecycle (subscribe on mount, unsubscribe on unmount)
- Prevents memory leaks with proper cleanup

**Features**:
```typescript
- Automatic cache updates for real-time events
- Optimistic UI updates
- Proper conversation sorting by last_message_at
- Preserves customer_metadata from old conversations
- Moves updated conversations to top when new messages arrive
```

#### 2. Updated ConversationList Component
**File**: `/src/features/conversations/components/ConversationList/ConversationList.tsx`

**Before** (Zustand-based):
```typescript
const {
  conversations,
  isLoading,
  fetchConversations,
  subscribe,
  unsubscribe,
} = useConversationStore();

useEffect(() => {
  fetchConversations(agentId, true);
  subscribe(agentId);
  return () => unsubscribe();
}, [agentId]);
```

**After** (React Query-based):
```typescript
const { data: conversations = [], isLoading, refetch } = useConversations();
useConversationSubscription();

// No manual useEffect needed - React Query handles everything
```

**Benefits**:
- ✅ Automatic refetch when agent changes
- ✅ No manual subscription management in component
- ✅ Proper loading and error states from React Query
- ✅ Simple refresh with `refetch()`
- ✅ Eliminated ~50 lines of manual fetching/subscription code

#### 3. Simplified conversationStore to UI-Only State
**File**: `/src/features/conversations/stores/conversationStore.ts`

**Before**: 215 lines with data fetching, subscriptions, pagination, error handling

**After**: 32 lines with only UI state management

```typescript
interface ConversationStore {
  // UI State Only
  selectedConversation: Conversation | null;

  // Actions
  selectConversation: (conversation: Conversation | null) => void;
  clearSelection: () => void;
}
```

**Code Reduction**: **183 lines removed** (~85% reduction)

### Architecture Improvement

```
Before (Mixed State):
┌─────────────────────────────────────────┐
│  conversationStore (Zustand)            │
│  - conversations (data)                 │ ← Server data in Zustand
│  - selectedConversation (UI state)      │
│  - fetchConversations()                 │
│  - subscribe/unsubscribe                │
│  - handleRealtimeEvent()                │
└─────────────────────────────────────────┘

After (Separated Concerns):
┌─────────────────────────────────────────┐
│  React Query                             │
│  - useConversations() hook              │ ← Server data in React Query
│  - Automatic caching & refetching       │
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│  useConversationSubscription()          │ ← Real-time in separate hook
│  - Supabase channel management          │
│  - Updates React Query cache            │
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│  conversationStore (Zustand)            │
│  - selectedConversation (UI only)       │ ← UI state only
└─────────────────────────────────────────┘
```

### Real-Time Data Flow

```
Supabase Real-Time Event (INSERT/UPDATE/DELETE)
              ↓
useConversationSubscription receives event
              ↓
Updates React Query cache via queryClient.setQueryData()
              ↓
React Query notifies all components using useConversations()
              ↓
UI updates automatically with new data
              ↓
✨ No manual state management needed
```

### Files Modified

| File | Type | Changes |
|------|------|---------|
| `useConversationSubscription.ts` | NEW | Real-time subscription hook (122 lines) |
| `ConversationList.tsx` | UPDATED | Migrated to React Query hooks |
| `conversationStore.ts` | UPDATED | Reduced from 215 → 32 lines (85% reduction) |

### Benefits Achieved

**Code Quality**:
- **183 lines removed** from conversationStore
- **Eliminated manual subscription management** in components
- **Single source of truth** for conversation data
- **Consistent error handling** via React Query

**Developer Experience**:
- Simple hook: `const { data: conversations } = useConversations()`
- Automatic refetch when agent changes
- No manual useEffect dependencies to maintain
- TypeScript types flow through from React Query

**Performance**:
- Proper caching with React Query
- Optimistic UI updates for real-time events
- Efficient re-renders only when data changes
- No duplicate fetches or race conditions

**Maintainability**:
- Clear separation of concerns (data vs UI state)
- Real-time logic isolated in dedicated hook
- Easy to test each piece independently
- Follows React Query best practices

### Testing Checklist

- [x] Conversations load correctly on page mount
- [x] Conversations refetch when switching agents
- [x] Real-time INSERT events add new conversations to top
- [x] Real-time UPDATE events update existing conversations
- [x] Real-time DELETE events remove conversations
- [x] Selected conversation state persists across agent switches
- [x] Refresh button works correctly
- [x] Loading states display properly
- [x] Error states display with retry option
- [x] No memory leaks from subscriptions
- [x] No duplicate API calls

---

## 🚀 Future Enhancements

### URL-Based Agent Selection (Optional)
Add route params for deep linking:
```typescript
// Route definition
{
  path: 'conversations/:agentId',
  element: <ConversationsPage />,
}

// Sync URL with globalSelectedAgent
useEffect(() => {
  if (agentIdFromUrl && agentIdFromUrl !== globalSelectedAgent?.id) {
    switchAgent(agentIdFromUrl);
  }
}, [agentIdFromUrl, globalSelectedAgent]);
```

### Infinite Scroll with React Query
Implement pagination with `useInfiniteQuery`:
```typescript
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useInfiniteQuery({
  queryKey: queryKeys.conversations(agentId),
  queryFn: ({ pageParam = 0 }) =>
    conversationService.fetchConversations({
      agentId,
      offset: pageParam,
      limit: 20
    }),
  getNextPageParam: (lastPage, pages) =>
    lastPage.length === 20 ? pages.length * 20 : undefined,
});
```

---

## 📖 References

- [React Query Documentation](https://tanstack.com/query/latest)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [Mojeeb Project Guidelines](./CLAUDE.md)

---

**Last Updated**: January 6, 2025
**Version**: 2.0.0
**Author**: Claude Code

**Changelog**:
- v1.0.0 (2025-01-06): Initial agent selection refactor
- v2.0.0 (2025-01-06): Conversation migration to React Query
