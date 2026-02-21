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

  /**
   * Facebook JS SDK
   * Used for WhatsApp Embedded Signup (FB.login with config_id)
   */
  FB: {
    login: (
      callback: (response: {
        status: 'connected' | 'not_authorized' | 'unknown';
        authResponse?: {
          code?: string;
          accessToken?: string;
          userID?: string;
        };
      }) => void,
      options: {
        config_id: string;
        response_type: string;
        override_default_response_type: boolean;
        extras?: Record<string, unknown>;
      }
    ) => void;
    getLoginStatus: (callback: (response: {
      status: 'connected' | 'not_authorized' | 'unknown';
      authResponse?: {
        code?: string;
        accessToken?: string;
        userID?: string;
      };
    }) => void) => void;
  };
}
