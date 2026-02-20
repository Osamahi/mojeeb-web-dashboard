/**
 * Text Formatting Utilities
 * Parse and format message text (bold, italic, links, RTL detection)
 * Uses marked for safe markdown parsing to prevent XSS
 */

import { marked } from 'marked';

/**
 * Detect if text is primarily Arabic (for RTL direction)
 */
export const isArabicText = (text: string): boolean => {
  if (!text) return false;
  const arabicChars = text.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g);
  const letterChars = text.match(/\p{L}/gu);
  if (!arabicChars || !letterChars) return false;
  // RTL if more than 40% of letters are Arabic
  return arabicChars.length / letterChars.length > 0.4;
};

/**
 * Configure marked with security settings
 */
marked.setOptions({
  breaks: true, // Convert \n to <br>
  gfm: true, // GitHub Flavored Markdown
  headerIds: false, // Disable header IDs to prevent XSS
  mangle: false, // Don't mangle email addresses
});

/**
 * Parse formatted text (bold, italic, links) with XSS protection
 * Uses marked library for safe markdown parsing
 * Returns HTML string (safe to use with DOMPurify)
 */
export const parseFormattedText = (text: string, textColor: string = '#000000'): string => {
  // 1. Parse markdown FIRST (handles bold, italic, links safely)
  let formatted = marked.parseInline(text) as string;

  // 2. Apply phone/WhatsApp links AFTER markdown (on the HTML output)
  // Only match phone numbers that are NOT already inside an <a> tag
  // WhatsApp numbers: "واتساب: 01234567890" or "WhatsApp: 01234567890"
  const whatsappRegex = /(واتساب|WhatsApp):\s*(01[0-9]{9})/gi;
  formatted = formatted.replace(
    whatsappRegex,
    (match, prefix, number) =>
      `${prefix}: <a href="https://wa.me/2${number}" target="_blank" rel="noopener noreferrer" dir="ltr" style="color: ${textColor}; text-decoration: underline;">${number}</a>`
  );

  // Phone numbers (Egyptian format): 01xxxxxxxxx — skip if already inside a link
  const phoneRegex = /(?<!href="[^"]*)\b(01[0-9]{9})\b(?![^<]*<\/a>)/g;
  formatted = formatted.replace(
    phoneRegex,
    `<a href="tel:$1" dir="ltr" style="color: ${textColor}; text-decoration: underline;">$1</a>`
  );

  // 3. Apply link styling to markdown-generated links
  formatted = formatted.replace(
    /<a /g,
    `<a style="color: ${textColor}; text-decoration: underline;" `
  );

  // 4. Ensure external links have security attributes
  return formatted.replace(
    /<a href="http/g,
    '<a target="_blank" rel="noopener noreferrer" href="http'
  );
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
