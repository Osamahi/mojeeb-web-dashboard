/**
 * StudioSearchBar
 *
 * Presentational wrapper around the search input + match counter + prev/next
 * buttons. State and behavior live in `useStudioSearch`; this component just
 * binds it to the UI.
 *
 * Mounted by the parent only when the bar should be open — auto-focuses the
 * input on mount.
 *
 * Keyboard:
 *   - Enter      → next match
 *   - Shift+Enter → previous match
 *   - Esc        → close the bar (clears query)
 */

import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, ChevronDown, ChevronUp, X } from 'lucide-react';
import type { UseStudioSearchResult } from '../hooks/useStudioSearch';

type Props = Pick<
  UseStudioSearchResult,
  | 'searchQuery'
  | 'setSearchQuery'
  | 'matches'
  | 'itemsWithMatches'
  | 'currentMatchIndex'
  | 'goToPrevMatch'
  | 'goToNextMatch'
> & {
  onClose: () => void;
};

export function StudioSearchBar({
  searchQuery,
  setSearchQuery,
  matches,
  itemsWithMatches,
  currentMatchIndex,
  goToPrevMatch,
  goToNextMatch,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus on mount — bar is mounted only when opened.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="relative">
      <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
      <input
        ref={inputRef}
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            e.shiftKey ? goToPrevMatch() : goToNextMatch();
          } else if (e.key === 'Escape') {
            onClose();
          }
        }}
        placeholder={t('studio.search_placeholder', 'Search instructions, knowledge & attachments…')}
        aria-label={t('studio.search_aria', 'Search studio')}
        className="w-full ps-9 pe-44 py-2 rounded-lg text-sm bg-white border border-neutral-200 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-mojeeb/20 focus:border-brand-mojeeb transition-colors"
      />

      <div className="absolute end-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {searchQuery && (
          <span className="text-xs text-neutral-500 px-1.5 whitespace-nowrap">
            {matches.length === 0
              ? t('studio.search_no_matches', 'No matches')
              : t('studio.search_match_count', '{{current}} of {{total}} ({{items}} items)', {
                  current: currentMatchIndex + 1,
                  total: matches.length,
                  items: itemsWithMatches,
                })}
          </span>
        )}
        <button
          type="button"
          onClick={goToPrevMatch}
          disabled={matches.length === 0}
          aria-label={t('studio.search_prev', 'Previous match')}
          className="p-1 rounded hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={goToNextMatch}
          disabled={matches.length === 0}
          aria-label={t('studio.search_next', 'Next match')}
          className="p-1 rounded hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('studio.search_close', 'Close search')}
          className="p-1 rounded hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
