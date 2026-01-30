/**
 * Lead Notes Section
 * Displays note history timeline with add/edit/delete functionality
 */

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDateLocale } from '@/lib/dateConfig';
import { Trash2, Edit2, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useLeadNotes,
  useCreateLeadNote,
  useUpdateLeadNote,
  useDeleteLeadNote,
} from '../hooks/useLeads';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { extractNameFromEmail, getNoteAuthorName } from '../utils/formatting';
import type { LeadNote } from '../types';

interface LeadNotesSectionProps {
  leadId: string;
  onNoteAdded?: () => void;
}

export function LeadNotesSection({ leadId, onNoteAdded }: LeadNotesSectionProps) {
  const { t } = useTranslation();
  const { formatDistanceToNow } = useDateLocale();
  const user = useAuthStore((state) => state.user);
  const { data: notes, isLoading } = useLeadNotes(leadId);
  const createMutation = useCreateLeadNote();
  const updateMutation = useUpdateLeadNote();
  const deleteMutation = useDeleteLeadNote();

  const [newNoteText, setNewNoteText] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

  // Ref for auto-focusing the add note textarea
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus textarea when component mounts
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Handle adding a new note (OPTIMISTIC UI)
  const handleAddNote = () => {
    if (!newNoteText.trim()) return;

    // ✅ OPTIMISTIC UI: Clear input and close modal IMMEDIATELY (before server responds)
    const noteText = newNoteText;
    setNewNoteText('');
    if (onNoteAdded) {
      onNoteAdded();
    }

    // 🚀 Background: Send request to server (user doesn't wait for this)
    createMutation.mutate({
      leadId,
      request: { text: noteText, noteType: 'user_note' },
    });
  };

  // Handle editing a note
  const handleStartEdit = (note: LeadNote) => {
    setEditingNoteId(note.id);
    setEditText(note.text);
  };

  const handleSaveEdit = (noteId: string) => {
    if (!editText.trim()) return;

    updateMutation.mutate(
      {
        leadId,
        noteId,
        request: { text: editText },
      },
      {
        onSuccess: () => {
          setEditingNoteId(null);
          setEditText('');
        },
      }
    );
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditText('');
  };

  // Handle deleting a note
  const handleDelete = (noteId: string) => {
    setNoteToDelete(noteId);
  };

  const handleConfirmDelete = () => {
    if (noteToDelete) {
      deleteMutation.mutate(
        { leadId, noteId: noteToDelete },
        {
          onSuccess: () => {
            setNoteToDelete(null);
          },
        }
      );
    }
  };

  // Check if user owns a note
  const isOwnNote = (note: LeadNote) => {
    return user?.id === note.userId;
  };

  // Get translated note text
  const getTranslatedNoteText = (note: LeadNote): string => {
    if (note.noteType === 'status_change' && note.metadata?.statusChange) {
      const { oldStatus, newStatus } = note.metadata.statusChange;
      return t('lead_notes.status_changed', {
        oldStatus: t(`leads.status_${oldStatus}`),
        newStatus: t(`leads.status_${newStatus}`)
      });
    }
    return note.text;
  };

  const hasNotes = !isLoading && notes && notes.length > 0;

  return (
    <div className="space-y-4">
      {/* Add Note Input - Always visible */}
      <div className="space-y-2">
        <textarea
          ref={textareaRef}
          value={newNoteText}
          onChange={(e) => setNewNoteText(e.target.value)}
          placeholder={t('lead_notes.add_placeholder')}
          rows={3}
          className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent resize-none text-sm"
        />
        <button
          onClick={handleAddNote}
          disabled={!newNoteText.trim()}
          className="px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {t('lead_notes.add_note')}
        </button>
      </div>

      {/* Notes Timeline - Animated expansion */}
      <AnimatePresence>
        {hasNotes && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="space-y-3">
              <p className="text-sm font-medium text-neutral-900">{t('lead_notes.activity_timeline')}</p>
              <div className="space-y-3">
                {notes?.map((note) => (
              <div
                key={note.id}
                className="border-l-2 border-neutral-200 pl-4 pb-3 relative group"
              >
                {/* Note Header */}
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-neutral-900">
                      {getNoteAuthorName(note.userName, note.userId, user?.id, t('common.you'))}
                    </span>
                    {note.noteType === 'status_change' && (
                      <span className="text-xs text-[#00D084] font-normal">
                        {t('lead_notes.status_update')}
                      </span>
                    )}
                    {note.isEdited && (
                      <span className="text-xs text-neutral-400">{t('lead_notes.edited')}</span>
                    )}
                  </div>

                  {/* Actions (only for own notes) */}
                  {isOwnNote(note) && note.noteType === 'user_note' && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {editingNoteId !== note.id && (
                        <>
                          <button
                            onClick={() => handleStartEdit(note)}
                            className="p-1 text-neutral-500 hover:text-neutral-900 transition-colors"
                            title={t('lead_notes.edit_note')}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(note.id)}
                            className="p-1 text-neutral-500 hover:text-red-600 transition-colors"
                            title={t('lead_notes.delete_note')}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Note Body */}
                {editingNoteId === note.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent resize-none text-sm"
                      rows={3}
                      autoFocus
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSaveEdit(note.id)}
                        disabled={!editText.trim() || updateMutation.isPending}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-neutral-900 text-white text-xs font-medium rounded hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Check className="w-3 h-3" />
                        {t('lead_notes.save')}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="inline-flex items-center gap-1 px-3 py-1 border border-neutral-300 text-neutral-700 text-xs font-medium rounded hover:bg-neutral-50 transition-colors"
                      >
                        <X className="w-3 h-3" />
                        {t('lead_notes.cancel')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-neutral-700 whitespace-pre-wrap">{getTranslatedNoteText(note)}</p>
                )}

                {/* Timestamp */}
                <p className="text-xs text-neutral-400 mt-1">
                  {formatDistanceToNow(new Date(note.createdAt), {
                    addSuffix: true
                  })}
                </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!noteToDelete}
        onClose={() => setNoteToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={t('lead_notes.delete_note_title')}
        message={t('lead_notes.delete_note_message')}
        confirmText={t('lead_notes.delete')}
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
