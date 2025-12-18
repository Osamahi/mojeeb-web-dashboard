/**
 * Storage Monitor - Diagnostic tool to track localStorage changes
 * Helps identify what's modifying auth tokens and when
 */

let isMonitoring = false;

export function startStorageMonitoring() {
  if (isMonitoring) return;
  isMonitoring = true;

  console.log('🔍 [StorageMonitor] Starting localStorage monitoring...');

  // Monitor direct localStorage changes
  const originalSetItem = localStorage.setItem;
  const originalRemoveItem = localStorage.removeItem;
  const originalClear = localStorage.clear;

  localStorage.setItem = function (key: string, value: string) {
    if (key === 'mojeeb-auth-storage' || key === 'accessToken' || key === 'refreshToken') {
      const stack = new Error().stack;
      console.log(`\n📝 [StorageMonitor] localStorage.setItem at ${new Date().toISOString()}`);
      console.log(`   Key: ${key}`);
      console.log(`   Value length: ${value?.length || 0} chars`);
      console.log(`   Value preview: ${value?.substring(0, 50)}...`);
      console.log(`   📍 Called from:\n${stack}`);
    }
    return originalSetItem.apply(this, [key, value]);
  };

  localStorage.removeItem = function (key: string) {
    if (key === 'mojeeb-auth-storage' || key === 'accessToken' || key === 'refreshToken') {
      const stack = new Error().stack;
      console.log(`\n🗑️ [StorageMonitor] localStorage.removeItem at ${new Date().toISOString()}`);
      console.log(`   Key: ${key}`);
      console.log(`   📍 Called from:\n${stack}`);
    }
    return originalRemoveItem.apply(this, [key]);
  };

  localStorage.clear = function () {
    const stack = new Error().stack;
    console.log(`\n🧹 [StorageMonitor] localStorage.clear at ${new Date().toISOString()}`);
    console.log(`   ⚠️ All localStorage being cleared!`);
    console.log(`   📍 Called from:\n${stack}`);
    return originalClear.apply(this);
  };

  // Monitor storage events (changes from other tabs)
  window.addEventListener('storage', (event) => {
    if (event.key === 'mojeeb-auth-storage' || event.key === 'accessToken' || event.key === 'refreshToken') {
      console.log(`\n🔄 [StorageMonitor] Storage event from another tab at ${new Date().toISOString()}`);
      console.log(`   Key: ${event.key}`);
      console.log(`   Old value: ${event.oldValue ? `${event.oldValue.substring(0, 30)}...` : 'null'}`);
      console.log(`   New value: ${event.newValue ? `${event.newValue.substring(0, 30)}...` : 'null'}`);
      console.log(`   URL: ${event.url}`);
    }
  });

  console.log('✅ [StorageMonitor] Monitoring active for: mojeeb-auth-storage, accessToken, refreshToken');
}

export function stopStorageMonitoring() {
  isMonitoring = false;
  console.log('🛑 [StorageMonitor] Monitoring stopped');
}

// Track auth state changes in Zustand
export function logAuthStateChange(
  oldState: { isAuthenticated: boolean; user: any; refreshToken: any },
  newState: { isAuthenticated: boolean; user: any; refreshToken: any }
) {
  if (
    oldState.isAuthenticated !== newState.isAuthenticated ||
    oldState.user !== newState.user ||
    oldState.refreshToken !== newState.refreshToken
  ) {
    const stack = new Error().stack;
    console.log(`\n🔄 [AuthStateChange] Zustand state changed at ${new Date().toISOString()}`);
    console.log(`   isAuthenticated: ${oldState.isAuthenticated} → ${newState.isAuthenticated}`);
    console.log(`   user: ${oldState.user ? 'EXISTS' : 'null'} → ${newState.user ? 'EXISTS' : 'null'}`);
    console.log(`   refreshToken: ${oldState.refreshToken ? 'EXISTS' : 'null'} → ${newState.refreshToken ? 'EXISTS' : 'null'}`);
    console.log(`   📍 Changed by:\n${stack}`);
  }
}
