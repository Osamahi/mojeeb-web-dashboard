/**
 * Session helper for tracking ephemeral state (cleared on browser close/tab close)
 * Used for "once per session" behaviors like modals
 */

const PHONE_MODAL_SHOWN_KEY = 'phone-modal-shown';

class SessionHelper {
  /**
   * Check if phone modal has been shown this session
   */
  hasShownPhoneModalThisSession(): boolean {
    return sessionStorage.getItem(PHONE_MODAL_SHOWN_KEY) === 'true';
  }

  /**
   * Mark phone modal as shown for this session
   */
  markPhoneModalShown(): void {
    sessionStorage.setItem(PHONE_MODAL_SHOWN_KEY, 'true');
  }

  /**
   * Reset session tracking (call on logout)
   */
  resetSession(): void {
    sessionStorage.removeItem(PHONE_MODAL_SHOWN_KEY);
  }

  /**
   * Clear phone collection tracking (call when phone is successfully added)
   */
  clearPhoneTracking(): void {
    sessionStorage.removeItem(PHONE_MODAL_SHOWN_KEY);
  }
}

export const sessionHelper = new SessionHelper();
