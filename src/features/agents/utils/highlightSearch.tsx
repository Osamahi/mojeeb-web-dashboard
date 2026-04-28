/**
 * Search highlighting utilities for the Knowledge Base list.
 *
 * Two functions:
 *   - highlightPlainText: returns React nodes with matches wrapped in <mark>.
 *   - highlightHtml: returns an HTML string with matches wrapped in <mark>,
 *     walking only text nodes so we never inject inside tag attributes.
 *
 * Both tag the "current" match with data-current-match="true" so the parent
 * can scroll it into view, and assign each match a globally unique key so
 * the parent can route prev/next navigation.
 */

import type { ReactNode } from 'react';

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Build a key for a match instance — stable across renders for the same input. */
export function buildMatchKey(itemId: string, field: 'title' | 'content', occurrence: number): string {
  return `${itemId}:${field}:${occurrence}`;
}

interface HighlightOptions {
  itemId: string;
  field: 'title' | 'content';
  query: string;
  currentMatchKey: string | null;
}

/**
 * Highlight matches in plain text. Returns an array of React nodes.
 * The match that equals `currentMatchKey` gets a stronger style.
 */
export function highlightPlainText(text: string, opts: HighlightOptions): ReactNode {
  const { itemId, field, query, currentMatchKey } = opts;
  if (!query) return text;

  const re = new RegExp(escapeRegex(query), 'gi');
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let occurrence = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const key = buildMatchKey(itemId, field, occurrence);
    const isCurrent = key === currentMatchKey;
    nodes.push(
      <mark
        key={key}
        data-match-key={key}
        data-current-match={isCurrent || undefined}
        className={
          isCurrent
            ? 'bg-brand-mojeeb text-white rounded px-0.5'
            : 'bg-brand-mojeeb/20 text-brand-mojeeb-hover rounded px-0.5'
        }
      >
        {match[0]}
      </mark>
    );
    lastIndex = match.index + match[0].length;
    occurrence += 1;
    // Avoid infinite loop on zero-length matches (shouldn't happen with our input)
    if (match.index === re.lastIndex) re.lastIndex++;
  }
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return nodes.length === 0 ? text : nodes;
}

/**
 * Walk an HTML string's text nodes and wrap matches in <mark>.
 * Uses DOMParser for correctness — no regex on tag-bearing strings.
 */
export function highlightHtml(html: string, opts: HighlightOptions): string {
  const { itemId, field, query, currentMatchKey } = opts;
  if (!query) return html;

  // Parse into a detached document so we can walk text nodes safely.
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div id="__root">${html}</div>`, 'text/html');
  const root = doc.getElementById('__root');
  if (!root) return html;

  const re = new RegExp(escapeRegex(query), 'gi');
  let occurrence = 0;

  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      // Skip text inside <mark> nodes from a previous pass (we always start fresh anyway)
      const parent = node.parentElement;
      if (parent && parent.tagName === 'MARK') return NodeFilter.FILTER_REJECT;
      return node.nodeValue && node.nodeValue.length > 0
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    },
  });

  const textNodes: Text[] = [];
  let n: Node | null = walker.nextNode();
  while (n) {
    textNodes.push(n as Text);
    n = walker.nextNode();
  }

  for (const textNode of textNodes) {
    const text = textNode.nodeValue ?? '';
    re.lastIndex = 0;
    if (!re.test(text)) continue;
    re.lastIndex = 0;

    const fragment = doc.createDocumentFragment();
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = re.exec(text)) !== null) {
      if (match.index > lastIndex) {
        fragment.appendChild(doc.createTextNode(text.slice(lastIndex, match.index)));
      }
      const key = buildMatchKey(itemId, field, occurrence);
      const isCurrent = key === currentMatchKey;
      const mark = doc.createElement('mark');
      mark.setAttribute('data-match-key', key);
      if (isCurrent) mark.setAttribute('data-current-match', 'true');
      mark.className = isCurrent
        ? 'bg-brand-mojeeb text-white rounded px-0.5'
        : 'bg-brand-mojeeb/20 text-brand-mojeeb-hover rounded px-0.5';
      mark.textContent = match[0];
      fragment.appendChild(mark);
      lastIndex = match.index + match[0].length;
      occurrence += 1;
      if (match.index === re.lastIndex) re.lastIndex++;
    }
    if (lastIndex < text.length) {
      fragment.appendChild(doc.createTextNode(text.slice(lastIndex)));
    }
    textNode.parentNode?.replaceChild(fragment, textNode);
  }

  return root.innerHTML;
}

/** Count case-insensitive occurrences of `query` in `text`. */
export function countMatches(text: string, query: string): number {
  if (!query || !text) return 0;
  const re = new RegExp(escapeRegex(query), 'gi');
  return (text.match(re) ?? []).length;
}

/** Strip HTML tags so we can count matches in HTML content. */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}
