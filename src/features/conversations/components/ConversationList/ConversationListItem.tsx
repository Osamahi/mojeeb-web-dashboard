/**
 * Conversation List Item
 * WhatsApp-style conversation preview with avatar, name, last message, timestamp
 */

import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { User, Bot, Pin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Conversation } from '../../types';
import { formatConversationTime } from '../../utils/timeFormatters';
import { truncateText, getInitials } from '../../utils/textFormatters';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { ConversationContextMenu } from './ConversationContextMenu';

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

  // Handle right-click
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  return (
    <motion.div layoutId={conversation.id} layout transition={{ duration: 0.3, ease: "easeInOut" }}>
      <div
        onClick={onSelect}
        onContextMenu={handleContextMenu}
        className={cn(
          'flex items-center gap-3 p-3 border border-neutral-200 rounded-lg cursor-pointer transition-colors',
          isSelected
            ? 'bg-brand-mojeeb/10 border-brand-mojeeb'
            : 'bg-white hover:bg-neutral-50'
        )}
      >
        {/* Avatar */}
        <div className="flex-shrink-0">
          <Avatar
            src={profilePictureUrl}
            name={conversation.customer_name}
            size="lg"
          />
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

            {/* Human mode indicator */}
            {showHumanMode && (
              <User className="w-3.5 h-3.5 text-brand-mojeeb flex-shrink-0" />
            )}

            {/* Unhappy sentiment indicator */}
            {showUnhappySentiment && (
              <span className="text-xs flex-shrink-0">😟</span>
            )}

            {/* Urgent indicator */}
            {showUrgent && (
              <Badge variant="danger" className="text-xs">
                {t('conversation_list_item.urgent')}
              </Badge>
            )}

            {/* Needs attention indicator */}
            {showNeedsAttention && (
              <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0" title={t('conversation_list_item.needs_attention')} />
            )}
          </div>

          {/* Source and topic - matching chat header format */}
          {(conversation.topic || conversation.source !== 'web') && (
            <p className="text-xs text-neutral-600 font-normal truncate">
              {conversation.source !== 'web' && conversation.source}
              {conversation.source !== 'web' && conversation.topic && ' • '}
              {conversation.topic}
            </p>
          )}
        </div>

        {/* Timestamp and indicators */}
        <div className="flex-shrink-0 flex flex-col items-end gap-1">
          <div className="flex items-center gap-1">
            {conversation.is_pinned && (
              <Pin className="w-3 h-3 text-neutral-400 flex-shrink-0" />
            )}
            <span className="text-xs text-neutral-500">
              {formattedTime}
            </span>
          </div>
          {!conversation.is_read && (
            <div className="w-2 h-2 rounded-full bg-brand-mojeeb" />
          )}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ConversationContextMenu
          conversation={conversation}
          position={contextMenu}
          onClose={() => setContextMenu(null)}
        />
      )}
    </motion.div>
  );
});

export default ConversationListItem;
