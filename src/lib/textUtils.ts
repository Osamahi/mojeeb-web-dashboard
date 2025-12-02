/**
 * Text utilities for handling plain text and rich text content
 */

import DOMPurify from 'dompurify';

/**
 * Converts plain text with line breaks to HTML paragraphs
 * Handles both \n and \r\n line breaks
 */
export function plainTextToHtml(text: string): string {
  if (!text) return '<p></p>';

  const trimmed = text.trim();

  // Check if content is already HTML (has paragraph or other block tags)
  if (
    (trimmed.startsWith('<p>') || trimmed.startsWith('<ul>') ||
     trimmed.startsWith('<ol>') || trimmed.startsWith('<h')) &&
    (trimmed.endsWith('</p>') || trimmed.endsWith('</ul>') ||
     trimmed.endsWith('</ol>') || trimmed.match(/<\/h\d>$/))
  ) {
    return DOMPurify.sanitize(text);
  }

  // Split by line breaks, preserving structure
  const lines = text.split(/\r?\n/);

  // Group consecutive non-empty lines into paragraphs
  const paragraphs: string[] = [];
  let currentParagraph: string[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (trimmedLine.length > 0) {
      currentParagraph.push(trimmedLine);
    } else {
      // Empty line - close current paragraph if any
      if (currentParagraph.length > 0) {
        paragraphs.push(`<p>${currentParagraph.join(' ')}</p>`);
        currentParagraph = [];
      }
    }
  }

  // Don't forget the last paragraph
  if (currentParagraph.length > 0) {
    paragraphs.push(`<p>${currentParagraph.join(' ')}</p>`);
  }

  const html = paragraphs.length > 0 ? paragraphs.join('') : '<p></p>';
  return DOMPurify.sanitize(html);
}

/**
 * Strips HTML tags and converts to plain text
 * Useful for previews or character counting
 */
export function htmlToPlainText(html: string): string {
  if (!html) return '';

  // Remove HTML tags
  const text = html.replace(/<[^>]*>/g, '');

  // Decode HTML entities
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}
