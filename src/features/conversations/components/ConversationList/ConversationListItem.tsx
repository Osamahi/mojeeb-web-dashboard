/**
 * Conversation List Item
 * WhatsApp-style conversation preview with avatar, name, last message, timestamp
 */

import { memo, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BotOff, Bot, Pin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Conversation } from '../../types';
import { formatConversationTime } from '../../utils/timeFormatters';
import { truncateText, getInitials } from '../../utils/textFormatters';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { ConversationContextMenu } from './ConversationContextMenu';
import { useDeleteConversation } from '../../hooks/useDeleteConversation';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { Role } from '@/features/auth/types/auth.types';
import { useConfirm } from '@/hooks/useConfirm';
import { PlatformIcon } from '@/features/connections/components/PlatformIcon';
import type { PlatformType } from '@/features/connections/types';

interface ConversationListItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onSelect: () => void;
}

const ConversationListItem = memo(function ConversationListItem({
  conversation,
  isSelected,
  onSelect,
}: ConversationListItemProps) {
  const { t } = useTranslation();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const deleteMutation = useDeleteConversation();
  const user = useAuthStore((state) => state.user);
  const canDelete = user?.role === Role.SuperAdmin || user?.role === Role.Admin;
  const { confirm, ConfirmDialogComponent } = useConfirm();

  const handleDelete = useCallback(async () => {
    setContextMenu(null);
    const confirmed = await confirm({
      title: t('conversations.delete_confirm_title'),
      message: t('conversations.delete_confirm_message', { name: conversation.customer_name }),
      confirmText: t('conversations.delete_confirm_button'),
      variant: 'danger',
    });

    if (confirmed) {
      deleteMutation.mutate(conversation.id);
    }
  }, [confirm, conversation.id, conversation.customer_name, deleteMutation, t]);

  // Extract profile picture from metadata
  const profilePictureUrl = conversation.customer_metadata?.profile_picture;

  // Display topic if available, otherwise last message
  const displayText = conversation.topic || conversation.last_message || t('conversation_list_item.no_messages_yet');

  // Format timestamp
  const timestamp = conversation.last_message_at || conversation.created_at;
  const formattedTime = formatConversationTime(timestamp);

  // Status indicators
  const showHumanMode = !conversation.is_ai;
  const showUnhappySentiment = conversation.sentiment === 1 || conversation.sentiment === 2;
  const showUrgent = conversation.urgent;
  const showNeedsAttention = conversation.requires_human_attention;

  // Handle right-click (desktop)
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  // Long-press for mobile (500ms threshold)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFired = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    longPressFired.current = false;
    const touch = e.touches[0];
    const x = touch.clientX;
    const y = touch.clientY;

    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true;
      setContextMenu({ x, y });
    }, 500);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleTouchMove = useCallback(() => {
    // Cancel long-press if finger moves (user is scrolling)
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleClick = useCallback(() => {
    // Don't trigger select if long-press just fired
    if (longPressFired.current) {
      longPressFired.current = false;
      return;
    }
    onSelect();
  }, [onSelect]);

  return (
    <motion.div layoutId={conversation.id} layout transition={{ duration: 0.3, ease: "easeInOut" }}>
      <div
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        className={cn(
          'flex items-center gap-3 p-3 border border-neutral-200 rounded-lg cursor-pointer transition-colors',
          isSelected
            ? 'bg-brand-mojeeb/10 border-brand-mojeeb'
            : 'bg-white hover:bg-neutral-50'
        )}
      >
        {/* Avatar with platform icon */}
        <div className="relative flex-shrink-0">
          <Avatar
            src={profilePictureUrl}
            name={conversation.customer_name}
            size="lg"
          />
          {conversation.source !== 'web' && (
            <div className="absolute -bottom-1 ltr:-right-1 rtl:-left-1">
              <PlatformIcon
                platform={(conversation.source === 'test' ? 'web' : conversation.source) as PlatformType}
                size="sm"
                variant="brand"
                showBackground
                className="!w-5 !h-5 shadow-sm ring-1 ring-white [&_svg]:!w-2.5 [&_svg]:!h-2.5"
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Name and indicators */}
          <div className="flex items-center gap-2 mb-1">
            <span className={cn(
              "text-neutral-950 text-sm truncate transition-all duration-300 ease-in-out",
              !conversation.is_read ? "font-bold" : "font-normal"
            )}>
              {conversation.customer_name}
            </span>

            <AnimatePresence mode="popLayout">
              {/* AI disabled indicator */}
              {showHumanMode && (
                <motion.span
                  key="human-mode"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.2 }}
                  className="flex-shrink-0"
                >
                  <BotOff className="w-3.5 h-3.5 text-neutral-400" />
                </motion.span>
              )}

              {/* Unhappy sentiment indicator */}
              {showUnhappySentiment && (
                <motion.span
                  key="sentiment"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.2 }}
                  className="text-xs flex-shrink-0"
                >
                  😟
                </motion.span>
              )}

              {/* Urgent indicator */}
              {showUrgent && (
                <motion.span
                  key="urgent"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.2 }}
                >
                  <Badge variant="danger" className="text-xs">
                    {t('conversation_list_item.urgent')}
                  </Badge>
                </motion.span>
              )}

              {/* Needs attention indicator */}
              {showNeedsAttention && (
                <motion.div
                  key="attention"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0"
                  title={t('conversation_list_item.needs_attention')}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Topic */}
          {conversation.topic && (
            <p className="text-xs text-neutral-600 font-normal truncate">
              {conversation.topic}
            </p>
          )}
        </div>

        {/* Timestamp and indicators */}
        <div className="flex-shrink-0 flex flex-col items-end gap-1">
          <div className="flex items-center gap-1">
            <AnimatePresence mode="popLayout">
              {conversation.is_pinned && (
                <motion.span
                  key="pin"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.2 }}
                  className="flex-shrink-0"
                >
                  <Pin className="w-3 h-3 text-neutral-400" />
                </motion.span>
              )}
            </AnimatePresence>
            <span className="text-xs text-neutral-500">
              {formattedTime}
            </span>
          </div>
          <AnimatePresence>
            {!conversation.is_read && (
              <motion.div
                key="unread"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ duration: 0.2 }}
                className="w-2 h-2 rounded-full bg-brand-mojeeb"
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ConversationContextMenu
          conversation={conversation}
          position={contextMenu}
          onClose={() => setContextMenu(null)}
          canDelete={canDelete}
          onDelete={handleDelete}
        />
      )}

      {/* Confirm dialog (lives in parent so it persists after context menu closes) */}
      {ConfirmDialogComponent}
    </motion.div>
  );
});

export default ConversationListItem;
