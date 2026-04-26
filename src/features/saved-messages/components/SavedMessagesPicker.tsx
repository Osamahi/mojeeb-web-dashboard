/**
 * SavedMessagesPicker
 * Popover anchored to the message composer.
 * - Lists agent's saved messages (title + shortcut chip + content preview)
 * - Filter is driven by the composer text after `/` (no search input here)
 * - Hover row → edit/delete icons
 * - Last row is always "Create new shortcut" — opens the form modal
 * - Click row inserts content into composer via onSelect
 * - Keyboard: Up/Down navigate, Enter selects (insert OR open create modal), Esc closes
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSavedMessages } from '../hooks/useSavedMessages';
import type { SavedMessage } from '../types/savedMessages.types';
import { SavedMessageFormModal } from './SavedMessageFormModal';
import { DeleteSavedMessageModal } from './DeleteSavedMessageModal';

interface SavedMessagesPickerProps {
  agentId: string;
  /** Called with content to insert into composer */
  onSelect: (content: string) => void;
  /** Close the popover */
  onClose: () => void;
  /** Filter from the composer (text typed after `/`). Updates live. */
  initialFilter?: string;
  /**
   * 'button' = opened via mini icon → full CRUD (edit/delete/create row).
   * 'slash'  = opened via `/` in composer → read-only pick-and-insert.
   */
  mode?: 'button' | 'slash';
  /** Override the default popover anchor classes (bottom-full + side). */
  anchorClassName?: string;
}

// Sentinel index that means the "create" row is highlighted
const CREATE_INDEX = -1;

export function SavedMessagesPicker({
  agentId,
  onSelect,
  onClose,
  initialFilter = '',
  mode = 'button',
  anchorClassName,
}: SavedMessagesPickerProps) {
  const isSlashMode = mode === 'slash';
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);

  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [editing, setEditing] = useState<SavedMessage | null>(null);
  const [deleting, setDeleting] = useState<SavedMessage | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data: messages = [], isLoading } = useSavedMessages(agentId);

  const filtered = useMemo(() => {
    const q = initialFilter.trim().toLowerCase();
    if (!q) return messages;
    return messages.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.shortcut.toLowerCase().includes(q) ||
        m.content.toLowerCase().includes(q)
    );
  }, [messages, initialFilter]);

  // Keep highlight in range when filtered changes; clamp into the message list,
  // or fall back to the "create" row when in button mode and there are no messages.
  useEffect(() => {
    if (filtered.length === 0) {
      setHighlightedIndex(isSlashMode ? 0 : CREATE_INDEX);
    } else if (highlightedIndex >= filtered.length || highlightedIndex < 0) {
      setHighlightedIndex(0);
    }
  }, [filtered.length, highlightedIndex, isSlashMode]);

  // Click outside closes (but ignore clicks while a modal is open — its portal
  // lives elsewhere in the DOM)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (containerRef.current && containerRef.current.contains(target)) return;
      if (showCreate || editing || deleting) return;
      onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose, showCreate, editing, deleting]);

  const handleSelect = (m: SavedMessage) => {
    onSelect(m.content);
    onClose();
  };

  const handleOpenCreate = () => setShowCreate(true);

  // Keyboard navigation is forwarded from the composer (focus stays in textarea
  // so the user can keep typing). We hook onto window keydown when open.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Suspend keyboard handling while a child modal is open — its inputs
      // need Enter/Esc/Arrows to behave normally.
      if (showCreate || editing || deleting) return;
      // Don't hijack typing; only act on nav/select keys.
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((i) => {
          if (isSlashMode) {
            if (filtered.length === 0) return 0;
            return Math.min(i + 1, filtered.length - 1);
          }
          if (i === CREATE_INDEX) return filtered.length === 0 ? CREATE_INDEX : 0;
          if (i + 1 >= filtered.length) return CREATE_INDEX;
          return i + 1;
        });
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((i) => {
          if (isSlashMode) {
            return Math.max(i - 1, 0);
          }
          if (i === CREATE_INDEX) return filtered.length > 0 ? filtered.length - 1 : CREATE_INDEX;
          if (i - 1 < 0) return CREATE_INDEX;
          return i - 1;
        });
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (!isSlashMode && highlightedIndex === CREATE_INDEX) {
          handleOpenCreate();
        } else {
          const target = filtered[highlightedIndex];
          if (target) handleSelect(target);
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, highlightedIndex, onClose, isSlashMode, showCreate, editing, deleting]);

  return (
    <>
      <div
        ref={containerRef}
        className={cn(
          'absolute z-50 w-[300px] max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-lg border border-neutral-200 overflow-hidden',
          anchorClassName ?? 'bottom-full ltr:left-0 rtl:right-0 mb-2'
        )}
      >
        <div className="max-h-[320px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 text-neutral-400 animate-spin" />
            </div>
          ) : (
            <ul role="listbox">
              {filtered.length === 0 ? (
                <li className="px-4 py-6 text-center text-sm text-neutral-500">
                  {messages.length === 0
                    ? t('saved_messages.empty_state')
                    : t('saved_messages.no_results')}
                </li>
              ) : (
                filtered.map((m, idx) => (
                  <li
                    key={m.id}
                    role="option"
                    aria-selected={idx === highlightedIndex}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    onClick={() => handleSelect(m)}
                    className={cn(
                      'group px-4 py-2.5 cursor-pointer flex items-start gap-2 transition-colors',
                      idx > 0 && 'border-t border-neutral-100',
                      idx === highlightedIndex
                        ? 'bg-neutral-50'
                        : 'hover:bg-neutral-50'
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-neutral-900 font-mono truncate">
                        /{m.shortcut}
                      </div>
                      <div className="text-xs text-neutral-500 truncate mt-0.5">
                        {m.content}
                      </div>
                    </div>
                    {!isSlashMode && (
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditing(m);
                          }}
                          className="p-1 rounded text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200"
                          title={t('common.edit')}
                          aria-label={t('common.edit')}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleting(m);
                          }}
                          className="p-1 rounded text-neutral-500 hover:text-red-600 hover:bg-red-50"
                          title={t('common.delete')}
                          aria-label={t('common.delete')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </li>
                ))
              )}

              {/* Pinned create row — only in button mode */}
              {!isSlashMode && (
                <li
                  role="option"
                  aria-selected={highlightedIndex === CREATE_INDEX}
                  onMouseEnter={() => setHighlightedIndex(CREATE_INDEX)}
                  onClick={handleOpenCreate}
                  className={cn(
                    'border-t border-neutral-100 px-4 py-2.5 cursor-pointer flex items-center gap-2 text-xs font-medium transition-colors',
                    highlightedIndex === CREATE_INDEX
                      ? 'bg-neutral-50 text-neutral-900'
                      : 'text-neutral-700 hover:bg-neutral-50'
                  )}
                >
                  <Plus className="w-3.5 h-3.5" />
                  {t('saved_messages.create_row')}
                </li>
              )}
            </ul>
          )}
        </div>
      </div>

      {/* Modals — rendered via BaseModal portal */}
      <SavedMessageFormModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        agentId={agentId}
      />
      <SavedMessageFormModal
        isOpen={!!editing}
        onClose={() => setEditing(null)}
        agentId={agentId}
        message={editing}
      />
      <DeleteSavedMessageModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        agentId={agentId}
        message={deleting}
      />
    </>
  );
}
