/**
 * Test Chat Component (Refactored)
 * Ultra-lean implementation using unified chat architecture
 * ~80 lines vs 440 lines (82% reduction!)
 *
 * Architecture:
 * - ChatEngine: Handles all logic, real-time, optimistic updates
 * - UnifiedChatView: Handles all presentation
 * - TestChat: Pure configuration (~20 lines of actual logic)
 */

import { useState, useEffect } from 'react';
import { RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { logger } from '@/lib/logger';
import { getErrorMessage } from '@/lib/errors';
import { analytics } from '@/lib/analytics';
import { useChatEngine } from '@/features/conversations/hooks/useChatEngine';
import { useLocalChatStorage } from '@/features/conversations/hooks/useChatStorage';
import UnifiedChatView from '@/features/conversations/components/Chat/UnifiedChatView';
import { useAuthStore } from '@/features/auth/stores/authStore';
import {
  testChatService,
  type StudioConversation,
} from '../services/testChatService';

interface TestChatProps {
  agentId: string;
}

export default function TestChat({ agentId }: TestChatProps) {
  const { t } = useTranslation();

  // Get authenticated user for customer name
  const user = useAuthStore((state) => state.user);
  const customerName = user?.name || user?.email || 'studio_preview_user';

  // Helpful tips to display while initializing (translated)
  const LOADING_TIPS = [
    t('test_chat.tip_1'),
    t('test_chat.tip_2'),
    t('test_chat.tip_3'),
    t('test_chat.tip_4'),
  ];

  // State
  const [conversation, setConversation] = useState<StudioConversation | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dots, setDots] = useState('');
  const [isExitingEmpty, setIsExitingEmpty] = useState(false);

  // Animate dots while initializing
  useEffect(() => {
    if (!isInitializing) return;
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, [isInitializing]);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  // Use local storage (ephemeral - resets on unmount)
  const storage = useLocalChatStorage();

  // Use unified chat engine with optimistic updates
  const chatEngine = useChatEngine({
    conversationId: conversation?.id || '',
    agentId,
    storage,
    enablePagination: false,
    onError: (err) => {
      logger.error('[TestChat]', 'Test chat error', err);
      toast.error(getErrorMessage(err));
    },
    sendMessageFn: async (params) => {
      // Call test chat service
      const response = await testChatService.sendTestMessage({
        conversationId: params.conversationId,
        message: params.message,
        agentId: params.agentId!,
        attachments: params.attachments,
      });

      // Track first test chat for funnel
      analytics.track('first_test_chat', {});

      // Transform to ChatMessage format
      return {
        id: response.id,
        conversation_id: response.conversation_id,
        message: response.message,
        message_type: response.message_type,
        attachments: null,
        sender_id: response.sender_id,
        sender_role: response.sender_role,
        status: response.status,
        created_at: response.created_at,
        updated_at: response.updated_at,
        platform_message_id: null,
        action_metadata: null,
      };
    },
  });

  // Detect first message → trigger exit animation, then hide after animation completes
  const [hideEmptyState, setHideEmptyState] = useState(false);
  useEffect(() => {
    if (chatEngine.messages.length > 0 && !isExitingEmpty) {
      setIsExitingEmpty(true);
      // Wait for exit animation to finish before unmounting
      setTimeout(() => setHideEmptyState(true), 400);
    }
  }, [chatEngine.messages.length]);

  // Rotate tips while initializing
  useEffect(() => {
    if (!isInitializing) return;

    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % LOADING_TIPS.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [isInitializing]);

  // Initialize conversation on mount
  useEffect(() => {
    const init = async () => {
      try {
        setIsInitializing(true);
        setError(null);

        const widget = await testChatService.getAgentWidget(agentId);
        const conv = await testChatService.initStudioConversation(widget.id, customerName);

        setConversation(conv);
        logger.info('[TestChat]', 'Test chat initialized', `conversationId: ${conv.id}`);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to initialize chat';
        setError(errorMessage);
        logger.error('[TestChat]', 'Failed to initialize test chat', err);
        toast.error(errorMessage);
      } finally {
        setIsInitializing(false);
      }
    };

    init();
  }, [agentId]);

  // Handle new conversation
  const handleNewConversation = async () => {
    storage.clearMessages();
    setConversation(null);
    setIsInitializing(true);

    try {
      const widget = await testChatService.getAgentWidget(agentId);
      const conv = await testChatService.initStudioConversation(widget.id, customerName);
      setConversation(conv);
      logger.info('[TestChat]', 'New test conversation started', `conversationId: ${conv.id}`);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to start new conversation';
      setError(errorMessage);
      logger.error('[TestChat]', 'Failed to start new conversation', err);
      toast.error(errorMessage);
    } finally {
      setIsInitializing(false);
    }
  };

  // Main chat view — always rendered so input box is visible during loading
  return (
    <div className="h-full transition-opacity duration-700" style={{ opacity: isInitializing ? 0.3 : 1 }}>
    <UnifiedChatView
      messages={hideEmptyState ? chatEngine.messages : []}
      isLoading={chatEngine.isLoading}
      isAITyping={chatEngine.isAITyping}
      onSendMessage={chatEngine.sendMessage}
      onRetryMessage={chatEngine.retryMessage}
      conversationId={conversation?.id || ''}
      agentId={agentId}
      header={
        // New Conversation Button - Floats at top when messages exist
        chatEngine.messages.length > 0 && (
          <div className="absolute top-2 sm:top-4 left-1/2 -translate-x-1/2 z-10">
            <button
              onClick={handleNewConversation}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-neutral-200 rounded-md shadow-sm hover:bg-neutral-50 hover:shadow-md transition-all duration-200"
              aria-label="Start a new conversation"
            >
              <RefreshCw className="w-4 h-4 text-neutral-600" aria-hidden="true" />
              <span className="hidden sm:inline text-sm text-neutral-600 font-medium">
                {t('test_chat.new_conversation')}
              </span>
            </button>
          </div>
        )
      }
      emptyStateCustom={
        <div className="flex flex-col items-center justify-center h-full text-center px-4">
          {error ? (
            // Error state inline
            <>
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-neutral-950 font-medium mb-1">{t('test_chat.failed_title')}</p>
              <p className="text-sm text-neutral-600 max-w-sm text-center mb-4">{error}</p>
              <button
                onClick={handleNewConversation}
                className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-neutral-800 transition-colors"
              >
                {t('test_chat.try_again')}
              </button>
            </>
          ) : (
            // "Preparing..." crossfades into "Try me" + ring glows in, reverses on exit
            <div
              className="relative flex items-center justify-center select-none"
              style={{ width: 120, height: 120 }}
            >
              {/* "Preparing..." — fades out */}
              <span
                className="absolute inset-0 flex items-center justify-center text-base font-normal whitespace-nowrap"
                style={{
                  color: '#808178',
                  opacity: isInitializing && !isExitingEmpty ? 1 : 0,
                  transition: 'opacity 0.8s ease',
                }}
              >
                {t('test_chat.preparing')}<span className="inline-block w-4 text-start">{dots}</span>
              </span>
              {/* "Try me" — fades in, fades out on exit */}
              <span
                className="absolute inset-0 flex items-center justify-center text-lg font-medium whitespace-nowrap"
                style={{
                  color: '#808178',
                  opacity: !isInitializing && !isExitingEmpty ? 1 : 0,
                  transition: isExitingEmpty ? 'opacity 0.3s ease' : 'opacity 0.8s ease 0.4s',
                }}
              >
                {t('test_chat.try_me')}
              </span>
              {/* Ring — scales up on enter, scales down + fades on exit */}
              <div
                className="absolute inset-0"
                style={{
                  opacity: !isInitializing && !isExitingEmpty ? 1 : 0,
                  transform: isInitializing || isExitingEmpty ? 'scale(0.6)' : 'scale(1)',
                  transition: isExitingEmpty
                    ? 'opacity 0.4s ease, transform 0.4s ease'
                    : 'opacity 1.4s cubic-bezier(0.16,1,0.3,1) 0.3s, transform 1.4s cubic-bezier(0.16,1,0.3,1) 0.3s',
                }}
              >
                <div
                  className="w-full h-full rounded-full"
                  style={{ animation: isInitializing ? 'none' : 'testme-ring 8s linear infinite' }}
                />
                {/* Glass reflection overlay */}
                <div
                  className="absolute inset-0 rounded-full overflow-hidden pointer-events-none"
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.08) 40%, transparent 60%)',
                    }}
                  />
                  {/* Bottom subtle reflection */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: 'radial-gradient(ellipse 80% 30% at 50% 95%, rgba(255,255,255,0.12) 0%, transparent 70%)',
                    }}
                  />
                </div>
              </div>
            </div>
          )}
          <style>{`
            @keyframes testme-ring {
              0% {
                transform: rotate(90deg);
                box-shadow:
                  0 3px 8px 0 rgba(125,255,81,0.2) inset,
                  0 8px 12px 0 rgba(0,219,183,0.15) inset,
                  0 24px 24px 0 rgba(0,219,183,0.08) inset,
                  0 0 2px 0.5px rgba(48,232,136,0.1);
              }
              50% {
                transform: rotate(270deg);
                box-shadow:
                  0 3px 8px 0 rgba(0,219,183,0.2) inset,
                  0 8px 6px 0 rgba(48,232,136,0.15) inset,
                  0 18px 24px 0 rgba(125,255,81,0.08) inset,
                  0 0 2px 0.5px rgba(48,232,136,0.1);
              }
              100% {
                transform: rotate(450deg);
                box-shadow:
                  0 3px 8px 0 rgba(48,232,136,0.2) inset,
                  0 8px 12px 0 rgba(0,219,183,0.15) inset,
                  0 24px 24px 0 rgba(0,219,183,0.08) inset,
                  0 0 2px 0.5px rgba(48,232,136,0.1);
              }
            }
          `}</style>
        </div>
      }
      placeholder={t('test_chat.placeholder')}
      enableAIToggle={false} // AI-only mode in test
    />
    </div>
  );
}
