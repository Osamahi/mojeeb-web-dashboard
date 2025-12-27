/**
 * Conversation List Item
 * WhatsApp-style conversation preview with avatar, name, last message, timestamp
 */

import { memo } from 'react';
import { User, Bot } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Conversation } from '../../types';
import { formatConversationTime } from '../../utils/timeFormatters';
import { truncateText, getInitials } from '../../utils/textFormatters';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

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

  return (
    <div
      onClick={onSelect}
      className={cn(
        'flex items-center gap-3 p-3 border border-neutral-200 rounded-lg cursor-pointer transition-colors',
        isSelected
          ? 'bg-brand-cyan/10 border-brand-cyan'
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
          <span className="font-semibold text-neutral-950 text-sm truncate">
            {conversation.customer_name}
          </span>

          {/* Human mode indicator */}
          {showHumanMode && (
            <User className="w-3.5 h-3.5 text-[#00D084] flex-shrink-0" />
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
          <p className="text-xs text-neutral-600 truncate">
            {conversation.source !== 'web' && conversation.source}
            {conversation.source !== 'web' && conversation.topic && ' • '}
            {conversation.topic}
          </p>
        )}
      </div>

      {/* Timestamp */}
      <div className="flex-shrink-0 text-xs text-neutral-500">
        {formattedTime}
      </div>
    </div>
  );
});

export default ConversationListItem;
