/**
 * useStudioSearch
 *
 * Owns the global Studio-page search: state, match-list across Instructions /
 * Knowledge / Attachments, prev/next navigation, and the auto-scroll effect.
 *
 * Returns everything the search bar UI and the section components need:
 *   - the live query + setter
 *   - the global match list and the active match cursor
 *   - prev/next callbacks
 *   - per-section helpers (`isCurrentItem`) so cards know when to auto-expand
 *   - `shouldShow` — whether the bar is worth rendering (>= 500 words of total
 *     searchable text). Below that, search is noise.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Agent, KnowledgeBase } from '../types/agent.types';
import type { Attachment } from '@/features/attachments/types/attachment.types';
import { buildMatchKey, countMatches, stripHtml } from '../utils/highlightSearch';

export type StudioSearchSection = 'instruction' | 'knowledge' | 'attachment';

export interface StudioSearchMatch {
  matchKey: string;
  section: StudioSearchSection;
  itemId: string;
}

export interface UseStudioSearchInput {
  agent: Agent | undefined;
  knowledgeBases: KnowledgeBase[] | undefined;
  attachments: Attachment[] | undefined;
}

export interface UseStudioSearchResult {
  // State
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // Open/closed UI state — bar is collapsed by default, toggled from a
  // toolbar button. Closing also clears the query so highlights disappear.
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;

  // Derived
  matches: StudioSearchMatch[];
  itemsWithMatches: number;
  currentMatchIndex: number;
  currentMatch: StudioSearchMatch | null;
  currentMatchKey: string | null;

  // Whether to surface the search affordance at all (toolbar button + bar).
  shouldShow: boolean;

  // Navigation
  goToPrevMatch: () => void;
  goToNextMatch: () => void;

  // Per-item helper used by section components to drive `forceExpanded`
  isCurrentItem: (section: StudioSearchSection, itemId: string) => boolean;
}

const SEARCH_VISIBILITY_WORD_THRESHOLD = 500;

const countWords = (s: string): number =>
  s.trim().split(/\s+/).filter(Boolean).length;

export function useStudioSearch({
  agent,
  knowledgeBases,
  attachments,
}: UseStudioSearchInput): UseStudioSearchResult {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => {
    setIsOpen(false);
    setSearchQuery(''); // Closing the bar also clears highlights
  }, []);
  const toggle = useCallback(() => {
    setIsOpen((v) => {
      if (v) setSearchQuery('');
      return !v;
    });
  }, []);

  // Total searchable word count — drives whether the search bar is rendered.
  const totalWords = useMemo(() => {
    const promptWords = countWords(agent?.personaPrompt ?? '');
    const kbWords = (knowledgeBases ?? []).reduce(
      (sum, kb) =>
        sum + countWords(stripHtml(kb.content ?? '')) + countWords(kb.name ?? ''),
      0,
    );
    const attachmentWords = (attachments ?? []).reduce(
      (sum, a) => sum + countWords(a.name ?? '') + countWords(a.triggerPrompt ?? ''),
      0,
    );
    return promptWords + kbWords + attachmentWords;
  }, [agent, knowledgeBases, attachments]);

  const shouldShow = totalWords >= SEARCH_VISIBILITY_WORD_THRESHOLD;

  // Flat global match list across all sections.
  const matches = useMemo<StudioSearchMatch[]>(() => {
    const q = searchQuery.trim();
    if (!q) return [];
    const out: StudioSearchMatch[] = [];

    const pushOccurrences = (
      itemId: string,
      field: 'title' | 'content',
      text: string,
      section: StudioSearchSection,
    ) => {
      const n = countMatches(text, q);
      for (let i = 0; i < n; i++) {
        out.push({ matchKey: buildMatchKey(itemId, field, i), section, itemId });
      }
    };

    if (agent) {
      const itemId = `instruction:${agent.id}`;
      pushOccurrences(itemId, 'title', agent.name ?? '', 'instruction');
      pushOccurrences(itemId, 'content', agent.personaPrompt ?? '', 'instruction');
    }

    knowledgeBases?.forEach((kb) => {
      pushOccurrences(kb.id, 'title', kb.name ?? '', 'knowledge');
      pushOccurrences(kb.id, 'content', stripHtml(kb.content ?? ''), 'knowledge');
    });

    attachments?.forEach((att) => {
      const itemId = `attachment:${att.id}`;
      pushOccurrences(itemId, 'title', att.name ?? '', 'attachment');
      pushOccurrences(itemId, 'content', att.triggerPrompt ?? '', 'attachment');
    });

    return out;
  }, [searchQuery, agent, knowledgeBases, attachments]);

  const itemsWithMatches = useMemo(() => {
    if (matches.length === 0) return 0;
    return new Set(matches.map((m) => m.itemId)).size;
  }, [matches]);

  const currentMatch = matches[currentMatchIndex] ?? null;
  const currentMatchKey = currentMatch?.matchKey ?? null;

  // Reset cursor when query or match-list size changes.
  useEffect(() => {
    setCurrentMatchIndex(0);
  }, [searchQuery, matches.length]);

  // Smooth-scroll the active <mark> into view after navigation.
  useEffect(() => {
    if (!currentMatchKey) return;
    const t = setTimeout(() => {
      const el = document.querySelector(
        `[data-match-key="${currentMatchKey}"]`,
      ) as HTMLElement | null;
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 60);
    return () => clearTimeout(t);
  }, [currentMatchKey]);

  const goToPrevMatch = useCallback(() => {
    if (matches.length === 0) return;
    setCurrentMatchIndex((i) => (i - 1 + matches.length) % matches.length);
  }, [matches.length]);

  const goToNextMatch = useCallback(() => {
    if (matches.length === 0) return;
    setCurrentMatchIndex((i) => (i + 1) % matches.length);
  }, [matches.length]);

  const isCurrentItem = useCallback(
    (section: StudioSearchSection, itemId: string) =>
      currentMatch?.section === section && currentMatch.itemId === itemId,
    [currentMatch],
  );

  return {
    searchQuery,
    setSearchQuery,
    isOpen,
    open,
    close,
    toggle,
    matches,
    itemsWithMatches,
    currentMatchIndex,
    currentMatch,
    currentMatchKey,
    shouldShow,
    goToPrevMatch,
    goToNextMatch,
    isCurrentItem,
  };
}
