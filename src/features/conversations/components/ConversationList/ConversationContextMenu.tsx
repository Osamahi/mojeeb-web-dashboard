import { useEffect, useRef } from 'react';
import type { ConversationResponse } from '../../services/conversationApi';
import { useMarkConversationAsUnread } from '../../hooks/useMarkConversationAsUnread';

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
  const menuRef = useRef<HTMLDivElement>(null);
  const { mutate: markAsUnread, isPending } = useMarkConversationAsUnread();

  const isDisabled = !conversation.is_read;

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

  const handleMarkAsUnread = () => {
    if (isDisabled || isPending) return;

    // Close menu immediately (optimistic UX)
    onClose();

    // Then execute mutation
    markAsUnread(conversation.id);
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
            onClick={handleMarkAsUnread}
            disabled={isDisabled || isPending}
            className={`w-full px-4 py-2 text-left text-sm transition-colors ${
              isDisabled || isPending
                ? 'cursor-not-allowed text-neutral-400'
                : 'text-neutral-700 hover:bg-neutral-50'
            }`}
            title={
              isDisabled
                ? 'This conversation is already unread'
                : 'Mark as unread'
            }
            role="menuitem"
          >
            Mark as Unread
          </button>
        </div>
      </div>
    </>
  );
}
