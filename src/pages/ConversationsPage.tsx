/**
 * Mojeeb Conversations Page
 * WhatsApp-style conversation view with split-pane layout
 * Real-time updates via Supabase subscriptions
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useAgentContext } from '@/hooks/useAgentContext';
import { useConversationStore } from '@/features/conversations/stores/conversationStore';
import { useChatStore } from '@/features/conversations/stores/chatStore';
import { useIsMobile } from '@/hooks/useMediaQuery';
import NoAgentEmptyState from '@/features/agents/components/NoAgentEmptyState';
import ConversationList from '@/features/conversations/components/ConversationList/ConversationList';
import ChatPanel from '@/features/conversations/components/Chat/ChatPanel';
import ConversationEmptyState from '@/features/conversations/components/shared/ConversationEmptyState';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export const ConversationsPage = () => {
  const { t } = useTranslation();
  useDocumentTitle('pages.title_conversations');
  const isMobile = useIsMobile();
  const { agent: globalSelectedAgent, agentId } = useAgentContext();
  const selectedConversation = useConversationStore((state) => state.selectedConversation);
  const selectConversation = useConversationStore((state) => state.selectConversation);

  const [showChat, setShowChat] = useState(false);

  // Reset conversation selection when agent changes
  useEffect(() => {
    selectConversation(null);
    setShowChat(false);
  }, [agentId, selectConversation]);

  // Show empty state if no agent is selected
  if (!globalSelectedAgent) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <NoAgentEmptyState
          title={t('conversations.no_agent_title')}
          message={t('conversations.no_agent_description')}
          showCreateButton={false}
        />
      </div>
    );
  }

  const handleConversationSelect = (conversationId: string) => {
    if (isMobile) {
      setShowChat(true);
    }
  };

  const handleBackToList = () => {
    setShowChat(false);
    selectConversation(null);
  };

  // Mobile: Show either list or chat (stacked)
  if (isMobile) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        {!showChat ? (
          <ConversationList
            agentId={globalSelectedAgent.id}
            onConversationSelect={handleConversationSelect}
          />
        ) : selectedConversation ? (
          <ChatPanel
            conversation={selectedConversation}
            onBack={handleBackToList}
          />
        ) : null}
      </div>
    );
  }

  // Desktop/Tablet: Split-pane layout
  return (
    <div className="h-full overflow-hidden">
      <PanelGroup direction="horizontal">
        {/* Left Panel: Conversation List */}
        <Panel defaultSize={35} minSize={25} maxSize={50}>
          <ConversationList
            agentId={globalSelectedAgent.id}
            onConversationSelect={handleConversationSelect}
          />
        </Panel>

        <PanelResizeHandle className="w-px bg-neutral-200 hover:bg-brand-cyan transition-colors" />

        {/* Right Panel: Chat Messages */}
        <Panel defaultSize={65}>
          {selectedConversation ? (
            <ChatPanel conversation={selectedConversation} />
          ) : (
            <ConversationEmptyState />
          )}
        </Panel>
      </PanelGroup>
    </div>
  );
};
