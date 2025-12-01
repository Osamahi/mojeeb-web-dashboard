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
 * Hook to run a callback when the app resumes from background
 *
 * @param callback - Function to execute when app becomes visible
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

  // Keep callback ref up to date - runs synchronously before paint
  // Uses useLayoutEffect to ensure ref is updated before any effects that depend on it
  useLayoutEffect(() => {
    callbackRef.current = callback;
  }); // No deps - updates every render (safe because it's just a ref assignment)

  // Trigger callback when transitioning from hidden → visible
  useEffect(() => {
    const wasHidden = !prevVisibleRef.current;
    const isNowVisible = isVisible;

    if (wasHidden && isNowVisible) {
      if (import.meta.env.DEV) {
        console.log('[useOnAppResume] App resumed - executing callback');
      }
      callbackRef.current();
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
