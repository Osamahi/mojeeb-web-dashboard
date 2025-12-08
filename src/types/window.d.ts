/**
 * Window interface extensions
 * Extends the global Window interface with browser-specific APIs
 */

interface Window {
  /**
   * WebKit-prefixed AudioContext (Safari compatibility)
   */
  webkitAudioContext?: typeof AudioContext;
}
