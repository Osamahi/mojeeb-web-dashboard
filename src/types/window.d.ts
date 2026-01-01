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

  /**
   * Meta Pixel (Facebook Pixel) function
   * Used to track conversion events and custom events
   */
  fbq?: (
    command: 'init' | 'track' | 'trackCustom',
    eventName: string,
    parameters?: Record<string, unknown>
  ) => void;

  /**
   * Meta Pixel internal queue (for initialization)
   */
  _fbq?: typeof Window.prototype.fbq;
}
