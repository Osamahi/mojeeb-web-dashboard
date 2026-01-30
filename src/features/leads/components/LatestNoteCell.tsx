/**
 * LatestNoteCell Component
 * Displays the latest note preview for a lead with loading state
 */

import { useAuthStore } from '@/features/auth/stores/authStore';
import { useTranslation } from 'react-i18next';
import { useIsAddingNote } from '../hooks/useNoteLoadingState';
import { getNoteAuthorName, formatNoteDate } from '../utils/formatting';
import type { Lead } from '../types';

interface LatestNoteCellProps {
  lead: Lead;
  onAddNoteClick: (leadId: string, name: string) => void;
}

export function LatestNoteCell({ lead, onAddNoteClick }: LatestNoteCellProps) {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const isAddingNote = useIsAddingNote(lead.id);

  // Find the latest user note (non-deleted)
  const latestNote = lead.notes && lead.notes.length > 0
    ? [...lead.notes]
        .filter(note => note.noteType === 'user_note' && !note.isDeleted)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    : null;

  return (
    <div className="py-1 max-w-xs">
      {isAddingNote ? (
        // 🔄 LOADING STATE: Show visual skeleton while note is being saved
        <div className="ltr:text-left rtl:text-right w-full -mx-2 px-2 py-1 rounded">
          <div className="flex flex-col gap-1 animate-pulse">
            <div className="h-[13px] bg-neutral-200 rounded w-3/4"></div>
            <div className="h-[12px] bg-neutral-100 rounded w-1/2"></div>
          </div>
        </div>
      ) : latestNote ? (
        // ✅ SHOW NOTE: Display the latest note
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddNoteClick(lead.id, lead.name || '');
          }}
          className="ltr:text-left rtl:text-right w-full hover:bg-neutral-50 -mx-2 px-2 py-1 rounded transition-colors"
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-[13px] text-neutral-900 truncate">{latestNote.text}</span>
            <span className="text-[12px] text-neutral-500">
              {getNoteAuthorName(latestNote.userName, latestNote.userId, user?.id)} · {formatNoteDate(latestNote.createdAt, true)}
            </span>
          </div>
        </button>
      ) : (
        // 📝 NO NOTE: Show "Add note" button
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddNoteClick(lead.id, lead.name || '');
          }}
          className="text-sm text-neutral-400 hover:text-neutral-600 transition-colors ltr:text-left rtl:text-right w-full"
        >
          {t('leads.add_note')}
        </button>
      )}
    </div>
  );
}
