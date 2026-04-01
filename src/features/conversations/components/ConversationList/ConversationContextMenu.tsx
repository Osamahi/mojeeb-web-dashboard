import { useEffect, useRef } from 'react';
import { Pin, PinOff, Mail, MailOpen, Trash2, AlertTriangle, CheckCircle, Bot, BotOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ConversationResponse } from '../../services/conversationApi';
import { useMarkConversationAsRead } from '../../hooks/useMarkConversationAsRead';
import { useMarkConversationAsUnread } from '../../hooks/useMarkConversationAsUnread';
import { usePinConversation } from '../../hooks/usePinConversation';
import { useUnpinConversation } from '../../hooks/useUnpinConversation';
import { useMarkConversationAsUrgent } from '../../hooks/useMarkConversationAsUrgent';
import { useMarkConversationAsResolved } from '../../hooks/useMarkConversationAsResolved';
import { useToggleAIMode } from '../../hooks/useToggleAIMode';

interface ConversationContextMenuProps {
  conversation: ConversationResponse;
  position: { x: number; y: number };
  onClose: () => void;
  canDelete?: boolean;
  onDelete?: () => void;
}

/**
 * Context menu for conversation actions
 * Triggered by right-click on conversation list items
 *
 * Features:
 * - Native right-click menu positioning
 * - "Mark as Unread" action (disabled when already unread)
 * - Conditional "Delete" action (SuperAdmin & Admin only, via props)
 * - Click outside to close
 * - ESC key to close
 * - Edge detection to prevent overflow
 */
export function ConversationContextMenu({
  conversation,
  position,
  onClose,
  canDelete = false,
  onDelete,
}: ConversationContextMenuProps) {
  const { t } = useTranslation();
  const menuRef = useRef<HTMLDivElement>(null);
  const { mutate: markAsRead, isPending: isPendingRead } = useMarkConversationAsRead();
  const { mutate: markAsUnread, isPending: isPendingUnread } = useMarkConversationAsUnread();
  const { mutate: pin, isPending: isPendingPin } = usePinConversation();
  const { mutate: unpin, isPending: isPendingUnpin } = useUnpinConversation();
  const { mutate: markAsUrgent, isPending: isPendingUrgent } = useMarkConversationAsUrgent();
  const { mutate: markAsResolved, isPending: isPendingResolved } = useMarkConversationAsResolved();
  const { mutate: toggleAI, isPending: isPendingAI } = useToggleAIMode();

  const isPending = isPendingRead || isPendingUnread || isPendingPin || isPendingUnpin || isPendingUrgent || isPendingResolved || isPendingAI;
  const isUnread = !conversation.is_read;
  const isPinned = conversation.is_pinned;
  const isAIEnabled = conversation.is_ai;
  const hasUnhappySentiment = conversation.sentiment !== undefined && conversation.sentiment !== null && (conversation.sentiment === 1 || conversation.sentiment === 2);
  const hasAttentionFlags = conversation.urgent || conversation.requires_human_attention || conversation.am_not_sure_how_to_answer || hasUnhappySentiment;

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Add slight delay to prevent immediate close from the click that opened the menu
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Adjust position to prevent overflow
  useEffect(() => {
    if (menuRef.current) {
      const menu = menuRef.current;
      const rect = menu.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = position.x;
      let adjustedY = position.y;

      // Adjust horizontal position if menu overflows right edge
      if (rect.right > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 10;
      }

      // Adjust vertical position if menu overflows bottom edge
      if (rect.bottom > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 10;
      }

      menu.style.left = `${adjustedX}px`;
      menu.style.top = `${adjustedY}px`;
    }
  }, [position]);

  const handleToggleAIMode = () => {
    if (isPending) return;
    onClose();
    toggleAI({ conversationId: conversation.id, isAI: !isAIEnabled });
  };

  const handleToggleUrgentStatus = () => {
    if (isPending) return;
    onClose();
    if (hasAttentionFlags) {
      markAsResolved(conversation.id);
    } else {
      markAsUrgent(conversation.id);
    }
  };

  const handleToggleReadStatus = () => {
    if (isPending) return;
    onClose();
    if (isUnread) {
      markAsRead(conversation.id);
    } else {
      markAsUnread(conversation.id);
    }
  };

  const handleTogglePinStatus = () => {
    if (isPending) return;
    onClose();
    if (isPinned) {
      unpin(conversation.id);
    } else {
      pin(conversation.id);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Context Menu */}
      <div
        ref={menuRef}
        className="fixed z-[9999] min-w-[180px] rounded-lg border border-neutral-200 bg-white shadow-lg"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
        role="menu"
        aria-label="Conversation actions"
      >
        <div className="py-1">
          <button
            onClick={handleTogglePinStatus}
            disabled={isPending}
            className={`w-full px-4 py-2 text-start text-sm transition-colors flex items-center gap-2 ${
              isPending
                ? 'cursor-not-allowed text-neutral-400'
                : 'text-neutral-700 hover:bg-neutral-50'
            }`}
            title={
              isPinned
                ? t('conversation_context_menu.unpin_tooltip')
                : t('conversation_context_menu.pin_tooltip')
            }
            role="menuitem"
          >
            {isPinned
              ? <><PinOff className="w-4 h-4" />{t('conversation_context_menu.unpin')}</>
              : <><Pin className="w-4 h-4" />{t('conversation_context_menu.pin')}</>}
          </button>
          <button
            onClick={handleToggleReadStatus}
            disabled={isPending}
            className={`w-full px-4 py-2 text-start text-sm transition-colors flex items-center gap-2 ${
              isPending
                ? 'cursor-not-allowed text-neutral-400'
                : 'text-neutral-700 hover:bg-neutral-50'
            }`}
            title={
              isUnread
                ? t('conversation_context_menu.mark_as_read_tooltip')
                : t('conversation_context_menu.mark_as_unread_tooltip')
            }
            role="menuitem"
          >
            {isUnread
              ? <><MailOpen className="w-4 h-4" />{t('conversation_context_menu.mark_as_read')}</>
              : <><Mail className="w-4 h-4" />{t('conversation_context_menu.mark_as_unread')}</>}
          </button>
          <button
            onClick={handleToggleAIMode}
            disabled={isPending}
            className={`w-full px-4 py-2 text-start text-sm transition-colors flex items-center gap-2 ${
              isPending
                ? 'cursor-not-allowed text-neutral-400'
                : 'text-neutral-700 hover:bg-neutral-50'
            }`}
            title={
              isAIEnabled
                ? t('conversation_context_menu.disable_ai_tooltip')
                : t('conversation_context_menu.enable_ai_tooltip')
            }
            role="menuitem"
          >
            {isAIEnabled
              ? <><BotOff className="w-4 h-4" />{t('conversation_context_menu.disable_ai')}</>
              : <><Bot className="w-4 h-4" />{t('conversation_context_menu.enable_ai')}</>}
          </button>

          <button
            onClick={handleToggleUrgentStatus}
            disabled={isPending}
            className={`w-full px-4 py-2 text-start text-sm transition-colors flex items-center gap-2 ${
              isPending
                ? 'cursor-not-allowed text-neutral-400'
                : 'text-neutral-700 hover:bg-neutral-50'
            }`}
            title={
              hasAttentionFlags
                ? t('conversation_context_menu.mark_as_resolved_tooltip')
                : t('conversation_context_menu.mark_as_urgent_tooltip')
            }
            role="menuitem"
          >
            {hasAttentionFlags
              ? <><CheckCircle className="w-4 h-4" />{t('conversation_context_menu.mark_as_resolved')}</>
              : <><AlertTriangle className="w-4 h-4" />{t('conversation_context_menu.mark_as_urgent')}</>}
          </button>

          {/* Delete option - passed from parent (SuperAdmin & Admin only) */}
          {canDelete && onDelete && (
            <>
              <div className="border-t border-neutral-100 my-1" />
              <button
                onClick={onDelete}
                disabled={isPending}
                className={`w-full px-4 py-2 text-start text-sm transition-colors flex items-center gap-2 ${
                  isPending
                    ? 'cursor-not-allowed text-neutral-400'
                    : 'text-red-600 hover:bg-red-50'
                }`}
                role="menuitem"
              >
                <Trash2 className="w-4 h-4" />
                {t('common.delete', 'Delete')}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
