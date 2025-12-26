/**
 * Window interface extensions
 * Extends the global Window interface with browser-specific APIs
 */

interface Window {
  /**
   * WebKit-prefixed AudioContext (Safari compatibility)
   */
  webkitAudioContext?: typeof AudioContext;

  /**
   * Google Tag Manager dataLayer
   * Used to push analytics events to GTM
   */
  dataLayer: Array<Record<string, unknown>>;
}
