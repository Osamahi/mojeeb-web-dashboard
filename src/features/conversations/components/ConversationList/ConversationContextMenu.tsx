import { useEffect, useRef } from 'react';
import { Pin, PinOff, Mail, MailOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ConversationResponse } from '../../services/conversationApi';
import { useMarkConversationAsRead } from '../../hooks/useMarkConversationAsRead';
import { useMarkConversationAsUnread } from '../../hooks/useMarkConversationAsUnread';
import { usePinConversation } from '../../hooks/usePinConversation';
import { useUnpinConversation } from '../../hooks/useUnpinConversation';

interface ConversationContextMenuProps {
  conversation: ConversationResponse;
  position: { x: number; y: number };
  onClose: () => void;
}

/**
 * Context menu for conversation actions
 * Triggered by right-click on conversation list items
 *
 * Features:
 * - Native right-click menu positioning
 * - "Mark as Unread" action (disabled when already unread)
 * - Click outside to close
 * - ESC key to close
 * - Edge detection to prevent overflow
 */
export function ConversationContextMenu({
  conversation,
  position,
  onClose,
}: ConversationContextMenuProps) {
  const { t } = useTranslation();
  const menuRef = useRef<HTMLDivElement>(null);
  const { mutate: markAsRead, isPending: isPendingRead } = useMarkConversationAsRead();
  const { mutate: markAsUnread, isPending: isPendingUnread } = useMarkConversationAsUnread();
  const { mutate: pin, isPending: isPendingPin } = usePinConversation();
  const { mutate: unpin, isPending: isPendingUnpin } = useUnpinConversation();

  const isPending = isPendingRead || isPendingUnread || isPendingPin || isPendingUnpin;
  const isUnread = !conversation.is_read;
  const isPinned = conversation.is_pinned;

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
            className={`w-full px-4 py-2 text-left text-sm transition-colors flex items-center gap-2 ${
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
            className={`w-full px-4 py-2 text-left text-sm transition-colors flex items-center gap-2 ${
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
        </div>
      </div>
    </>
  );
}
