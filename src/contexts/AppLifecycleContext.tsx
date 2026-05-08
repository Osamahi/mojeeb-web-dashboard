import { createContext, useContext, useEffect, useLayoutEffect, useState, useRef, ReactNode } from 'react';

interface AppLifecycleContextValue {
  isVisible: boolean;
  isHidden: boolean;
}

const AppLifecycleContext = createContext<AppLifecycleContextValue | undefined>(undefined);

interface AppLifecycleProviderProps {
  children: ReactNode;
}

/**
 * Global App Lifecycle Provider
 *
 * Manages a SINGLE `visibilitychange` event listener for the entire app.
 * Components subscribe to app resume/background events via hooks.
 *
 * Benefits:
 * - Single event listener (vs multiple per-component listeners)
 * - Centralized visibility state
 * - Better performance and memory efficiency
 * - Consistent behavior across mobile and desktop
 *
 * @example
 * ```tsx
 * // In App.tsx
 * <AppLifecycleProvider>
 *   <YourApp />
 * </AppLifecycleProvider>
 *
 * // In components
 * useOnAppResume(() => {
 *   console.log('App resumed from background');
 * });
 * ```
 */
export function AppLifecycleProvider({ children }: AppLifecycleProviderProps) {
  const [isVisible, setIsVisible] = useState(
    typeof document !== 'undefined' ? document.visibilityState === 'visible' : true
  );

  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = document.visibilityState === 'visible';
      setIsVisible(visible);

      if (import.meta.env.DEV) {
        console.log(
          `[AppLifecycleProvider] Visibility changed: ${visible ? 'visible' : 'hidden'} at ${new Date().toISOString()}`
        );
      }
    };

    // Also listen for pageshow event (for back-forward cache on mobile Safari)
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        setIsVisible(true);
        if (import.meta.env.DEV) {
          console.log('[AppLifecycleProvider] Page restored from bfcache');
        }
      }
    };

    // Single global listener for entire app
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

  return (
    <AppLifecycleContext.Provider value={{ isVisible, isHidden: !isVisible }}>
      {children}
    </AppLifecycleContext.Provider>
  );
}

/**
 * Hook to access current app visibility state
 *
 * @returns {AppLifecycleContextValue} Current visibility state
 *
 * @example
 * ```tsx
 * const { isVisible, isHidden } = useAppVisibility();
 * if (isVisible) {
 *   // App is in foreground
 * }
 * ```
 */
export function useAppVisibility(): AppLifecycleContextValue {
  const context = useContext(AppLifecycleContext);
  if (!context) {
    throw new Error('useAppVisibility must be used within AppLifecycleProvider');
  }
  return context;
}

/**
 * Minimum hidden duration (ms) before a hidden→visible transition counts as
 * a real "app resume" worth notifying subscribers about. Anything shorter is
 * treated as a transient flicker (focus loss, OS notifications, devtools
 * docking) and ignored.
 *
 * Why this matters: on initial page load we frequently see a sub-second
 * hidden→visible flip that is NOT user-meaningful. Without this guard,
 * subscribers (auth refresh, websocket reconnect) fire spuriously on every
 * page load and stack on top of their initial-mount logic.
 */
const MIN_BACKGROUND_DURATION_MS = 30_000;

/**
 * Hook to run a callback when the app resumes from a real backgrounding
 * (hidden for at least {@link MIN_BACKGROUND_DURATION_MS}).
 *
 * @param callback - Function to execute when app becomes visible after a
 *   real backgrounding. NOT fired for sub-30s visibility flickers.
 *
 * @example
 * ```tsx
 * useOnAppResume(() => {
 *   // Refresh tokens
 *   // Reconnect WebSocket
 *   // Refetch data
 * });
 * ```
 */
export function useOnAppResume(callback: () => void | Promise<void>) {
  const { isVisible } = useAppVisibility();
  const callbackRef = useRef(callback);
  const prevVisibleRef = useRef(isVisible);
  const hiddenAtRef = useRef<number | null>(null);

  // Keep callback ref up to date — runs synchronously before paint.
  // useLayoutEffect ensures the ref is current before any effects run.
  useLayoutEffect(() => {
    callbackRef.current = callback;
  }); // No deps — updates every render (safe; just a ref assignment).

  useEffect(() => {
    const wasVisible = prevVisibleRef.current;

    if (wasVisible && !isVisible) {
      // Going to background — record when.
      hiddenAtRef.current = Date.now();
    } else if (!wasVisible && isVisible) {
      // Coming back from background — only fire if it lasted long enough.
      const hiddenFor = hiddenAtRef.current
        ? Date.now() - hiddenAtRef.current
        : 0;
      hiddenAtRef.current = null;

      if (hiddenFor >= MIN_BACKGROUND_DURATION_MS) {
        if (import.meta.env.DEV) {
          console.log(
            `[useOnAppResume] App resumed after ${Math.round(hiddenFor / 1000)}s — executing callback`,
          );
        }
        callbackRef.current();
      } else if (import.meta.env.DEV) {
        console.log(
          `[useOnAppResume] Visibility flicker (${hiddenFor}ms < ${MIN_BACKGROUND_DURATION_MS}ms) — ignored`,
        );
      }
    }

    prevVisibleRef.current = isVisible;
  }, [isVisible]);
}

/**
 * Hook to run a callback when the app goes to background
 *
 * @param callback - Function to execute when app becomes hidden
 *
 * @example
 * ```tsx
 * useOnAppBackground(() => {
 *   // Pause animations
 *   // Save state
 *   // Close connections
 * });
 * ```
 */
export function useOnAppBackground(callback: () => void | Promise<void>) {
  const { isVisible } = useAppVisibility();
  const callbackRef = useRef(callback);
  const prevVisibleRef = useRef(isVisible);

  // Keep callback ref up to date - runs synchronously before paint
  // Uses useLayoutEffect to ensure ref is updated before any effects that depend on it
  useLayoutEffect(() => {
    callbackRef.current = callback;
  }); // No deps - updates every render (safe because it's just a ref assignment)

  // Trigger callback when transitioning from visible → hidden
  useEffect(() => {
    const wasVisible = prevVisibleRef.current;
    const isNowHidden = !isVisible;

    if (wasVisible && isNowHidden) {
      if (import.meta.env.DEV) {
        console.log('[useOnAppBackground] App backgrounded - executing callback');
      }
      callbackRef.current();
    }

    prevVisibleRef.current = isVisible;
  }, [isVisible]);
}
