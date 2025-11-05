/**
 * Text Formatting Utilities
 * Parse and format message text (bold, italic, links, RTL detection)
 */

/**
 * Detect if text is primarily Arabic (for RTL direction)
 */
export const isArabicText = (text: string): boolean => {
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
  return arabicRegex.test(text);
};

/**
 * Parse formatted text (bold, italic, links)
 * Returns HTML string
 */
export const parseFormattedText = (text: string, textColor: string = '#000000'): string => {
  let formatted = text;

  // Escape HTML first
  formatted = formatted
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Bold: **text**
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Italic: *text*
  formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // URLs: Auto-detect and make clickable
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  formatted = formatted.replace(
    urlRegex,
    `<a href="$1" target="_blank" rel="noopener noreferrer" style="color: ${textColor}; text-decoration: underline;">$1</a>`
  );

  // Phone numbers (Egyptian format): 01xxxxxxxxx
  const phoneRegex = /\b(01[0-9]{9})\b/g;
  formatted = formatted.replace(
    phoneRegex,
    `<a href="tel:$1" style="color: ${textColor}; text-decoration: underline;">$1</a>`
  );

  // WhatsApp numbers: "واتساب: 01234567890" or "WhatsApp: 01234567890"
  const whatsappRegex = /(واتساب|WhatsApp):\s*(01[0-9]{9})/gi;
  formatted = formatted.replace(
    whatsappRegex,
    (match, prefix, number) =>
      `${prefix}: <a href="https://wa.me/2${number}" target="_blank" rel="noopener noreferrer" style="color: ${textColor}; text-decoration: underline;">${number}</a>`
  );

  return formatted;
};

/**
 * Strip HTML tags from formatted text
 */
export const stripHtmlTags = (html: string): string => {
  return html.replace(/<[^>]*>/g, '');
};

/**
 * Truncate text to specified length
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Get initials from name
 */
export const getInitials = (name: string): string => {
  if (!name) return '?';
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
};
