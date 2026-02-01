/**
 * Storage Monitor - Diagnostic tool to track localStorage changes
 * DEVELOPMENT ONLY - Disabled in production for security
 */

let isMonitoring = false;

export function startStorageMonitoring() {
  // SECURITY: Only enable in development mode
  if (!import.meta.env.DEV) return;
  if (isMonitoring) return;

  isMonitoring = true;

  if (import.meta.env.DEV) {
    console.log('[StorageMonitor] Starting monitoring (DEV mode)');
  }

  // Monitor direct localStorage changes
  const originalSetItem = localStorage.setItem;
  const originalRemoveItem = localStorage.removeItem;
  const originalClear = localStorage.clear;

  localStorage.setItem = function (key: string, value: string) {
    if (key === 'mojeeb-auth-storage' || key === 'accessToken' || key === 'refreshToken') {
      if (import.meta.env.DEV) {
        const stack = new Error().stack;
        console.log(`\n[StorageMonitor] localStorage.setItem: ${key}`);
        console.log(`Stack:\n${stack}`);
      }
    }
    return originalSetItem.apply(this, [key, value]);
  };

  localStorage.removeItem = function (key: string) {
    if (key === 'mojeeb-auth-storage' || key === 'accessToken' || key === 'refreshToken') {
      if (import.meta.env.DEV) {
        const stack = new Error().stack;
        console.log(`\n[StorageMonitor] localStorage.removeItem: ${key}`);
        console.log(`Stack:\n${stack}`);
      }
    }
    return originalRemoveItem.apply(this, [key]);
  };

  localStorage.clear = function () {
    if (import.meta.env.DEV) {
      const stack = new Error().stack;
      console.log(`\n[StorageMonitor] localStorage.clear`);
      console.log(`Stack:\n${stack}`);
    }
    return originalClear.apply(this);
  };

  // Monitor storage events (changes from other tabs)
  window.addEventListener('storage', (event) => {
    if (event.key === 'mojeeb-auth-storage' || event.key === 'accessToken' || event.key === 'refreshToken') {
      if (import.meta.env.DEV) {
        console.log(`[StorageMonitor] Storage event: ${event.key} changed`);
      }
    }
  });
}

export function stopStorageMonitoring() {
  isMonitoring = false;
  if (import.meta.env.DEV) {
    console.log('[StorageMonitor] Monitoring stopped');
  }
}

// Track auth state changes in Zustand (DEV only)
export function logAuthStateChange(
  oldState: { isAuthenticated: boolean; user: any; refreshToken: any },
  newState: { isAuthenticated: boolean; user: any; refreshToken: any }
) {
  if (!import.meta.env.DEV) return;

  if (
    oldState.isAuthenticated !== newState.isAuthenticated ||
    oldState.user !== newState.user ||
    oldState.refreshToken !== newState.refreshToken
  ) {
    console.log('[AuthStateChange] State updated');
  }
}
