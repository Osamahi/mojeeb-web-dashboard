/**
 * Conversation Empty State
 * Displayed when no conversation is selected in the chat panel
 */

import { MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function ConversationEmptyState() {
  const { t } = useTranslation();

  return (
    <div className="h-full flex items-center justify-center bg-neutral-50">
      <div className="text-center max-w-md p-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-white border border-neutral-200 rounded-full mb-6">
          <MessageSquare className="w-10 h-10 text-neutral-400" />
        </div>
        <h3 className="text-xl font-semibold text-neutral-950 mb-3">
          {t('conversations.select_conversation_title')}
        </h3>
        <p className="text-neutral-600">
          {t('conversations.select_conversation_description')}
        </p>
      </div>
    </div>
  );
}
