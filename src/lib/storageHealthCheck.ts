/**
 * localStorage Health Check Utility
 *
 * Comprehensive diagnostic tool to detect localStorage availability,
 * persistence issues, and browser restrictions.
 *
 * Use cases:
 * - Detect incognito/private browsing mode
 * - Detect "clear on close" browser settings
 * - Identify storage quota issues
 * - Test actual write → read → persist cycle
 *
 * @author Mojeeb Team
 * @version 1.0.0
 * @created December 22, 2025
 */

export interface StorageHealthReport {
  available: boolean;
  writable: boolean;
  readable: boolean;
  persistent: boolean;
  quota: {
    used: number; // MB
    total: number; // MB
    percentUsed: number;
  } | null;
  incognitoDetected: boolean;
  clearOnCloseDetected: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
  healthScore: number; // 0-100
  verdict: 'HEALTHY' | 'DEGRADED' | 'FAILED' | 'UNKNOWN';
}

const TEST_KEY = '__mojeeb_storage_health_test__';
const PERSISTENCE_TEST_KEY = '__mojeeb_persistence_test__';
const PERSISTENCE_TEST_DURATION = 5000; // 5 seconds

/**
 * Run a comprehensive localStorage health check
 * @returns Promise<StorageHealthReport>
 */
export async function runStorageHealthCheck(): Promise<StorageHealthReport> {
  const report: StorageHealthReport = {
    available: false,
    writable: false,
    readable: false,
    persistent: false,
    quota: null,
    incognitoDetected: false,
    clearOnCloseDetected: false,
    errors: [],
    warnings: [],
    recommendations: [],
    healthScore: 0,
    verdict: 'UNKNOWN',
  };

  console.log('\n🏥 [Storage Health Check] Starting comprehensive diagnostics...\n');

  // Test 1: Availability
  report.available = testAvailability(report);

  // Test 2: Write capability
  if (report.available) {
    report.writable = testWrite(report);
  }

  // Test 3: Read capability
  if (report.writable) {
    report.readable = testRead(report);
  }

  // Test 4: Persistence over time
  if (report.readable) {
    report.persistent = await testPersistence(report);
  }

  // Test 5: Storage quota
  report.quota = await testQuota(report);

  // Test 6: Incognito detection (enhanced)
  report.incognitoDetected = detectIncognito(report);

  // Test 7: Clear-on-close detection (heuristic)
  report.clearOnCloseDetected = detectClearOnClose(report);

  // Calculate health score
  report.healthScore = calculateHealthScore(report);

  // Determine verdict
  report.verdict = determineVerdict(report);

  // Generate recommendations
  generateRecommendations(report);

  // Print detailed report
  printDetailedReport(report);

  return report;
}

/**
 * Test if localStorage API is available
 */
function testAvailability(report: StorageHealthReport): boolean {
  try {
    const isAvailable = typeof window !== 'undefined' &&
                       typeof window.localStorage !== 'undefined' &&
                       window.localStorage !== null;

    if (isAvailable) {
      console.log('✅ Test 1: localStorage API is available');
    } else {
      console.error('❌ Test 1: localStorage API is NOT available');
      report.errors.push('localStorage API is not available in this environment');
    }

    return isAvailable;
  } catch (error) {
    console.error('❌ Test 1: FAILED - Error checking availability:', error);
    report.errors.push(`Availability check failed: ${error}`);
    return false;
  }
}

/**
 * Test if we can write to localStorage
 */
function testWrite(report: StorageHealthReport): boolean {
  try {
    const testValue = JSON.stringify({
      test: true,
      timestamp: Date.now(),
      message: 'Mojeeb storage health check',
    });

    localStorage.setItem(TEST_KEY, testValue);
    console.log('✅ Test 2: Successfully wrote to localStorage');
    return true;
  } catch (error) {
    console.error('❌ Test 2: FAILED - Cannot write to localStorage:', error);

    if (error instanceof Error) {
      if (error.name === 'QuotaExceededError') {
        report.errors.push('Storage quota exceeded - localStorage is full');
        report.recommendations.push('Clear old data from localStorage to free up space');
      } else if (error.message.includes('private')) {
        report.errors.push('localStorage disabled in private/incognito mode');
        report.incognitoDetected = true;
      } else {
        report.errors.push(`Write failed: ${error.message}`);
      }
    } else {
      report.errors.push('Unknown write error occurred');
    }

    return false;
  }
}

/**
 * Test if we can read from localStorage
 */
function testRead(report: StorageHealthReport): boolean {
  try {
    const value = localStorage.getItem(TEST_KEY);

    if (value === null) {
      console.error('❌ Test 3: FAILED - Wrote data but read returned null');
      report.errors.push('Data was written but immediately lost (possible privacy mode)');
      return false;
    }

    // Verify data integrity
    try {
      const parsed = JSON.parse(value);
      if (parsed.test === true && parsed.message === 'Mojeeb storage health check') {
        console.log('✅ Test 3: Successfully read and verified data from localStorage');

        // Clean up
        localStorage.removeItem(TEST_KEY);
        return true;
      } else {
        console.error('❌ Test 3: FAILED - Data corrupted during read');
        report.errors.push('Data corruption detected during read operation');
        return false;
      }
    } catch (parseError) {
      console.error('❌ Test 3: FAILED - Could not parse stored data');
      report.errors.push('Stored data is not valid JSON - corruption detected');
      return false;
    }
  } catch (error) {
    console.error('❌ Test 3: FAILED - Error reading from localStorage:', error);
    report.errors.push(`Read failed: ${error}`);
    return false;
  }
}

/**
 * Test if data persists over time (5 second test)
 * This can detect some (but not all) persistence issues
 */
async function testPersistence(report: StorageHealthReport): Promise<boolean> {
  try {
    const testValue = JSON.stringify({
      timestamp: Date.now(),
      testId: Math.random().toString(36).substring(7),
    });

    // Write test data
    localStorage.setItem(PERSISTENCE_TEST_KEY, testValue);
    console.log(`⏳ Test 4: Testing persistence over ${PERSISTENCE_TEST_DURATION}ms...`);

    // Wait 5 seconds
    await new Promise(resolve => setTimeout(resolve, PERSISTENCE_TEST_DURATION));

    // Try to read back
    const readValue = localStorage.getItem(PERSISTENCE_TEST_KEY);

    if (readValue === testValue) {
      console.log(`✅ Test 4: Data persisted successfully over ${PERSISTENCE_TEST_DURATION}ms`);
      localStorage.removeItem(PERSISTENCE_TEST_KEY);
      return true;
    } else {
      console.error('❌ Test 4: FAILED - Data did not persist over time');
      report.errors.push('Data does not persist over time (possible privacy mode)');
      report.warnings.push('localStorage may clear data unexpectedly');
      return false;
    }
  } catch (error) {
    console.error('❌ Test 4: FAILED - Error during persistence test:', error);
    report.errors.push(`Persistence test failed: ${error}`);
    return false;
  }
}

/**
 * Test storage quota and usage
 */
async function testQuota(report: StorageHealthReport): Promise<StorageHealthReport['quota']> {
  try {
    if (!navigator.storage || !navigator.storage.estimate) {
      console.warn('⚠️ Test 5: Storage quota API not available');
      report.warnings.push('Cannot check storage quota (older browser)');
      return null;
    }

    const estimate = await navigator.storage.estimate();
    const quota = {
      used: Number(((estimate.usage || 0) / 1024 / 1024).toFixed(2)),
      total: Number(((estimate.quota || 0) / 1024 / 1024).toFixed(2)),
      percentUsed: Number((((estimate.usage || 0) / (estimate.quota || 1)) * 100).toFixed(1)),
    };

    console.log(`✅ Test 5: Storage quota check completed`);
    console.log(`   Used: ${quota.used} MB / ${quota.total} MB (${quota.percentUsed}%)`);

    if (quota.percentUsed > 90) {
      report.errors.push('Storage is critically full (>90%)');
      report.recommendations.push('Clear browser data immediately to prevent auth failures');
    } else if (quota.percentUsed > 75) {
      report.warnings.push('Storage is getting full (>75%)');
      report.recommendations.push('Consider clearing old data to prevent future issues');
    }

    return quota;
  } catch (error) {
    console.error('❌ Test 5: FAILED - Error checking quota:', error);
    report.warnings.push('Could not determine storage quota');
    return null;
  }
}

/**
 * Enhanced incognito/private mode detection
 * Uses multiple heuristics for better accuracy
 */
function detectIncognito(report: StorageHealthReport): boolean {
  console.log('🔍 Test 6: Enhanced incognito/private mode detection...');

  let incognitoDetected = false;
  const indicators: string[] = [];

  // Heuristic 1: localStorage null or disabled
  if (window.localStorage === null) {
    indicators.push('localStorage is null');
    incognitoDetected = true;
  }

  // Heuristic 2: Empty localStorage AND empty sessionStorage
  if (window.localStorage && window.localStorage.length === 0 &&
      window.sessionStorage && window.sessionStorage.length === 0) {
    indicators.push('Both storages empty (possible fresh incognito)');
  }

  // Heuristic 3: Write/read test failed
  if (!report.writable || !report.readable) {
    indicators.push('Write or read test failed');
    incognitoDetected = true;
  }

  // Heuristic 4: FileSystem API check (some browsers restrict in incognito)
  try {
    if ('requestFileSystem' in window || 'webkitRequestFileSystem' in window) {
      // @ts-ignore
      const requestFS = window.requestFileSystem || window.webkitRequestFileSystem;
      if (!requestFS) {
        indicators.push('FileSystem API restricted');
      }
    }
  } catch (e) {
    indicators.push('FileSystem API error (possible incognito)');
  }

  // Heuristic 5: IndexedDB check
  try {
    if (!window.indexedDB || window.indexedDB === null) {
      indicators.push('IndexedDB unavailable');
      incognitoDetected = true;
    }
  } catch (e) {
    indicators.push('IndexedDB check failed');
  }

  if (incognitoDetected) {
    console.error('🔒 Test 6: Incognito/Private mode DETECTED');
    console.error(`   Indicators: ${indicators.join(', ')}`);
    report.errors.push('Browser is in incognito/private mode');
    report.recommendations.push('Exit private browsing mode for auth persistence');
  } else if (indicators.length > 0) {
    console.warn('⚠️ Test 6: Possible incognito mode (inconclusive)');
    console.warn(`   Indicators: ${indicators.join(', ')}`);
    report.warnings.push('Possible incognito mode detected (inconclusive)');
  } else {
    console.log('✅ Test 6: Normal browsing mode detected');
  }

  return incognitoDetected;
}

/**
 * Detect if browser has "clear on close" setting enabled
 * This is a heuristic - cannot be 100% accurate without browser cooperation
 */
function detectClearOnClose(report: StorageHealthReport): boolean {
  console.log('🔍 Test 7: Clear-on-close detection (heuristic)...');

  // Check if there's a test marker from a previous session
  const previousTestMarker = localStorage.getItem('__mojeeb_session_persistence_marker__');

  if (!previousTestMarker) {
    // No marker found - could be:
    // 1. First time running this check
    // 2. Browser clears on close
    // 3. User manually cleared data

    // Set a marker for next session
    localStorage.setItem('__mojeeb_session_persistence_marker__', Date.now().toString());

    console.warn('⚠️ Test 7: Cannot determine clear-on-close (first run)');
    report.warnings.push('First run - will test persistence in next session');
    return false;
  } else {
    // Marker exists - localStorage persisted across sessions
    console.log('✅ Test 7: localStorage persisted from previous session');
    console.log(`   Previous marker: ${new Date(parseInt(previousTestMarker)).toISOString()}`);

    // Update marker for next check
    localStorage.setItem('__mojeeb_session_persistence_marker__', Date.now().toString());
    return false;
  }
}

/**
 * Calculate overall health score (0-100)
 */
function calculateHealthScore(report: StorageHealthReport): number {
  let score = 0;

  if (report.available) score += 20;
  if (report.writable) score += 20;
  if (report.readable) score += 20;
  if (report.persistent) score += 20;
  if (!report.incognitoDetected) score += 10;
  if (report.quota && report.quota.percentUsed < 75) score += 10;

  return score;
}

/**
 * Determine overall verdict
 */
function determineVerdict(report: StorageHealthReport): StorageHealthReport['verdict'] {
  if (report.healthScore >= 90) return 'HEALTHY';
  if (report.healthScore >= 60) return 'DEGRADED';
  if (report.healthScore >= 30) return 'FAILED';
  return 'UNKNOWN';
}

/**
 * Generate actionable recommendations
 */
function generateRecommendations(report: StorageHealthReport): void {
  if (report.incognitoDetected) {
    report.recommendations.push('Exit incognito/private mode to enable auth persistence');
  }

  if (!report.persistent) {
    report.recommendations.push('Check browser privacy settings for "Clear cookies on close"');
    report.recommendations.push('Check for browser extensions that auto-clear storage');
  }

  if (!report.available || !report.writable) {
    report.recommendations.push('Try a different browser to isolate the issue');
  }

  if (report.quota && report.quota.percentUsed > 75) {
    report.recommendations.push('Clear browser data: Settings → Privacy → Clear browsing data');
  }

  if (report.verdict === 'HEALTHY') {
    report.recommendations.push('localStorage is healthy - if auth still fails, check backend logs');
  }
}

/**
 * Print detailed report to console
 */
function printDetailedReport(report: StorageHealthReport): void {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('🏥 STORAGE HEALTH CHECK REPORT');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Overall verdict
  const verdictEmoji = {
    HEALTHY: '✅',
    DEGRADED: '⚠️',
    FAILED: '❌',
    UNKNOWN: '❓',
  }[report.verdict];

  console.log(`${verdictEmoji} Overall Status: ${report.verdict} (Score: ${report.healthScore}/100)\n`);

  // Test results
  console.log('📋 Test Results:');
  console.log(`   ${report.available ? '✅' : '❌'} Available: ${report.available}`);
  console.log(`   ${report.writable ? '✅' : '❌'} Writable: ${report.writable}`);
  console.log(`   ${report.readable ? '✅' : '❌'} Readable: ${report.readable}`);
  console.log(`   ${report.persistent ? '✅' : '❌'} Persistent: ${report.persistent}`);
  console.log(`   ${!report.incognitoDetected ? '✅' : '❌'} Normal Mode: ${!report.incognitoDetected}`);

  if (report.quota) {
    const quotaStatus = report.quota.percentUsed < 75 ? '✅' : report.quota.percentUsed < 90 ? '⚠️' : '❌';
    console.log(`   ${quotaStatus} Storage: ${report.quota.used}MB / ${report.quota.total}MB (${report.quota.percentUsed}%)\n`);
  } else {
    console.log('   ❓ Storage: Unknown\n');
  }

  // Errors
  if (report.errors.length > 0) {
    console.log('❌ Errors:');
    report.errors.forEach(error => console.log(`   - ${error}`));
    console.log('');
  }

  // Warnings
  if (report.warnings.length > 0) {
    console.log('⚠️ Warnings:');
    report.warnings.forEach(warning => console.log(`   - ${warning}`));
    console.log('');
  }

  // Recommendations
  if (report.recommendations.length > 0) {
    console.log('💡 Recommendations:');
    report.recommendations.forEach(rec => console.log(`   - ${rec}`));
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════════\n');
}

/**
 * Quick health check (synchronous, less comprehensive)
 * Use this for fast checks without async operations
 */
export function quickStorageCheck(): boolean {
  try {
    const testKey = '__quick_test__';
    const testValue = 'test';

    localStorage.setItem(testKey, testValue);
    const readValue = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);

    return readValue === testValue;
  } catch {
    return false;
  }
}
