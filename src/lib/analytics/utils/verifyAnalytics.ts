/**
 * Analytics Verification Helper
 * Provides runtime verification functions for debugging analytics
 *
 * Usage: Open browser console and run:
 * - window.__verifyAnalytics()
 * - window.__testMetaPixel()
 * - window.__testGTM()
 */

import { analytics } from '../core/AnalyticsService';

/**
 * Comprehensive analytics status check
 */
function verifyAnalytics(): void {
  console.log('\n=== 🔍 ANALYTICS VERIFICATION ===\n');

  const status = analytics.getStatus();

  console.log('📊 Service Status:');
  console.log('  isInitialized:', status.isInitialized ? '✅ YES' : '❌ NO');
  console.log('  currentUserId:', status.currentUserId || '(none)');
  console.log('');

  console.log('📦 Providers:');
  status.providers.forEach(provider => {
    const icon = provider.enabled ? '✅' : '❌';
    console.log(`  ${icon} ${provider.name}: ${provider.enabled ? 'ENABLED' : 'DISABLED'}`);
  });
  console.log('');

  console.log('🌐 Browser Environment:');
  console.log('  typeof window:', typeof window);
  console.log('  typeof window.fbq:', typeof window !== 'undefined' && window.fbq ? '✅ function' : '❌ undefined');
  console.log('  typeof window.dataLayer:', typeof window !== 'undefined' && window.dataLayer ? '✅ object' : '❌ undefined');
  console.log('');

  if (typeof window !== 'undefined' && window.dataLayer) {
    console.log('🔍 GTM dataLayer contents:', window.dataLayer);
  }

  console.log('\n=== ✅ VERIFICATION COMPLETE ===\n');
}

/**
 * Test Meta Pixel with a manual event
 */
function testMetaPixel(): void {
  console.log('\n=== 🧪 TESTING META PIXEL ===\n');

  if (typeof window === 'undefined') {
    console.error('❌ window is undefined - cannot test Meta Pixel');
    return;
  }

  if (!window.fbq) {
    console.error('❌ window.fbq not found - Meta Pixel not loaded');
    return;
  }

  console.log('✅ window.fbq is available');
  console.log('📤 Sending test custom event: TestEventFromConsole');

  try {
    window.fbq('trackCustom', 'TestEventFromConsole', {
      test: true,
      timestamp: new Date().toISOString(),
      source: 'manual_console_test',
    });
    console.log('✅ Test event sent successfully!');
    console.log('🔍 Check Meta Events Manager:');
    console.log('   https://business.facebook.com/events_manager2/list/pixel/2334159923685300');
    console.log('   Look in "Custom Events" tab for: TestEventFromConsole');
  } catch (error) {
    console.error('❌ Error sending test event:', error);
  }

  console.log('\n=== ✅ TEST COMPLETE ===\n');
}

/**
 * Test GTM with a manual event
 */
function testGTM(): void {
  console.log('\n=== 🧪 TESTING GOOGLE TAG MANAGER ===\n');

  if (typeof window === 'undefined') {
    console.error('❌ window is undefined - cannot test GTM');
    return;
  }

  if (!window.dataLayer) {
    console.error('❌ window.dataLayer not found - GTM not loaded');
    return;
  }

  console.log('✅ window.dataLayer is available');
  console.log('📤 Pushing test event to dataLayer');

  try {
    window.dataLayer.push({
      event: 'test_event_from_console',
      test: true,
      timestamp: new Date().toISOString(),
      source: 'manual_console_test',
    });
    console.log('✅ Test event pushed to dataLayer successfully!');
    console.log('📊 dataLayer contents:', window.dataLayer);
  } catch (error) {
    console.error('❌ Error pushing to dataLayer:', error);
  }

  console.log('\n=== ✅ TEST COMPLETE ===\n');
}

/**
 * Test agent_created event through the full analytics pipeline
 */
function testAgentCreatedEvent(): void {
  console.log('\n=== 🧪 TESTING agent_created EVENT ===\n');

  console.log('📤 Triggering agent_created event through analytics service...');

  try {
    analytics.track('agent_created', {
      agentId: 'test-agent-' + Date.now(),
      agentName: 'Test Agent from Console',
      userId: 'test-user-' + Date.now(),
    });

    console.log('✅ Event sent through analytics pipeline!');
    console.log('🔍 Check console logs above for detailed tracking flow');
    console.log('🔍 Check Meta Events Manager for "AgentCreated" custom event');
    console.log('🔍 Check GTM for "agent_created" event in dataLayer');
  } catch (error) {
    console.error('❌ Error sending event:', error);
  }

  console.log('\n=== ✅ TEST COMPLETE ===\n');
}

/**
 * Export verification functions to window for browser console access
 */
export function initializeVerificationHelpers(): void {
  if (typeof window !== 'undefined') {
    (window as any).__verifyAnalytics = verifyAnalytics;
    (window as any).__testMetaPixel = testMetaPixel;
    (window as any).__testGTM = testGTM;
    (window as any).__testAgentCreated = testAgentCreatedEvent;

    console.log('🔧 Analytics verification helpers loaded!');
    console.log('');
    console.log('Available commands:');
    console.log('  window.__verifyAnalytics()   - Check analytics service status');
    console.log('  window.__testMetaPixel()     - Send test event to Meta Pixel');
    console.log('  window.__testGTM()           - Send test event to GTM');
    console.log('  window.__testAgentCreated()  - Test agent_created event flow');
    console.log('');
  }
}
