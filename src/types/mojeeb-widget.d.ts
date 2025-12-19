/**
 * TypeScript type definitions for Mojeeb Widget
 * https://mojeebcdn.z7.web.core.windows.net/mojeeb-widget.js
 */

interface MojeebWidgetAPI {
  /**
   * Attach the widget to a specific button element
   * @param selector - CSS selector for the button element
   */
  attach: (selector: string) => void;

  /**
   * Open the chat widget
   */
  open: () => void;

  /**
   * Close the chat widget
   */
  close: () => void;

  /**
   * Toggle the chat widget open/closed
   */
  toggle: () => void;

  /**
   * Send a message programmatically
   * @param message - The message to send
   */
  sendMessage?: (message: string) => void;

  /**
   * Check if widget is currently open
   */
  isOpen?: () => boolean;
}

interface Window {
  MojeebWidget?: MojeebWidgetAPI;
}
