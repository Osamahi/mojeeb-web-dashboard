/**
 * Mojeeb Agent Studio Page
 * Responsive layout:
 * - Desktop (≥1024px): 2/3 + 1/3 split layout with sticky test chat
 * - Mobile (<1024px): Full-width knowledge section with slide-out test chat panel
 * Left: Main Instruction + Knowledge sections
 * Right: Embedded test chat (desktop) or slide-out panel (mobile)
 */

import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Plus, MessageSquare, Bell, MoreVertical, Paperclip, BookOpen } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { agentService } from '../services/agentService';
import { getConversations } from '@/features/conversations/services/conversationApi';
import { connectionService } from '@/features/connections/services/connectionService';
import { useAgentContext } from '@/hooks/useAgentContext';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { useDocumentJobs } from '../hooks/useDocumentJobs';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import NoAgentEmptyState from '../components/NoAgentEmptyState';
import MainInstructionCard from '../components/MainInstructionCard';
import KnowledgeBaseItem from '../components/KnowledgeBaseItem';
import AddKnowledgeBaseModal from '../components/AddKnowledgeBaseModal';
import DocumentUploadProgressCard from '../components/DocumentUploadProgressCard';
import FollowUpSettingsModal from '../components/FollowUpSettingsModal';
import TestChat from '../components/TestChat';
import TestChatPanel from '../components/TestChatPanel';
import { SetupChecklist } from '../components/SetupChecklist';
import TestGateBottomSheet from '../components/TestGateBottomSheet';
import { useAgentAttachments } from '@/features/attachments/hooks/useAgentAttachments';
import AttachmentItem from '@/features/attachments/components/AttachmentItem';
import { CreateAttachmentModal } from '@/features/attachments/components/CreateAttachmentModal';
import { logger } from '@/lib/logger';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useUIStore } from '@/stores/uiStore';
import { useSubscriptionStore } from '@/features/subscriptions/stores/subscriptionStore';
import { PlanCode } from '@/features/subscriptions/types/subscription.types';

/**
 * Merge optimistic job IDs with backend jobs, removing duplicates
 * @param optimisticIds - Job IDs added optimistically before backend confirmation
 * @param backendJobs - Jobs returned from backend API
 * @returns Array of unique job IDs (optimistic + backend)
 */
function mergeJobIds(optimisticIds: string[], backendJobs: Array<{ jobId: string }>) {
  const backendJobIds = new Set(backendJobs.map(job => job.jobId));
  const uniqueOptimisticIds = optimisticIds.filter(jobId => !backendJobIds.has(jobId));
  return [...uniqueOptimisticIds, ...backendJobs.map(job => job.jobId)];
}

export default function StudioPage() {
  const { t } = useTranslation();
  useDocumentTitle('pages.title_studio');
  const navigate = useNavigate();
  const setShowUpgradeWizard = useUIStore((s) => s.setShowUpgradeWizard);
  const { agent: globalSelectedAgent, agentId } = useAgentContext();
  const isDesktop = useIsDesktop();
  const [isAddKBModalOpen, setIsAddKBModalOpen] = useState(false);
  const [isAddAttachmentModalOpen, setIsAddAttachmentModalOpen] = useState(false);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  const [isTestGateOpen, setIsTestGateOpen] = useState(false);
  const [activeUploadJobs, setActiveUploadJobs] = useState<string[]>([]);

  // Fetch agent data
  const {
    data: agent,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.agent(agentId),
    queryFn: () => agentService.getAgent(agentId!),
    enabled: !!agentId,
  });

  // Fetch knowledge bases
  const {
    data: knowledgeBases,
    isLoading: isLoadingKBs,
    refetch: refetchKBs,
  } = useQuery({
    queryKey: queryKeys.knowledgeBases(agentId),
    queryFn: () => agentService.getKnowledgeBases(agentId!),
    enabled: !!agentId,
  });

  // Fetch all active (pending/processing) document jobs
  const { data: allJobs } = useDocumentJobs(agentId);
  const backendActiveJobs = allJobs?.filter(
    (job) => job.status === 'pending' || job.status === 'processing'
  ) || [];

  // Merge optimistic uploads with backend jobs (remove duplicates)
  const allActiveJobIds = mergeJobIds(activeUploadJobs, backendActiveJobs);

  // Fetch agent attachments
  const {
    data: attachments,
    refetch: refetchAttachments,
  } = useAgentAttachments(agentId);

  // Check if agent has any conversations (lightweight: limit=1)
  const { data: hasConversations } = useQuery({
    queryKey: ['hasConversations', agentId],
    queryFn: async () => {
      const res = await getConversations({ agent_id: agentId!, limit: 1 });
      return res.items.length > 0;
    },
    enabled: !!agentId,
    staleTime: 30_000,
  });

  // Check if agent has any connections
  const { data: connections } = useQuery({
    queryKey: ['hasConnections', agentId],
    queryFn: () => connectionService.getConnections(agentId!),
    enabled: !!agentId,
    staleTime: 30_000,
  });

  // Log errors
  useEffect(() => {
    if (error) {
      logger.error('Error loading agent', error);
    }
  }, [error]);

  const subscription = useSubscriptionStore((s) => s.subscription);
  const isOnFreePlan = !subscription || subscription.planCode === PlanCode.Free;

  const hasKnowledge = !!(knowledgeBases && knowledgeBases.length > 0);
  const hasTested = !!hasConversations;
  const hasConnections = !!(connections && connections.length > 0);
  const showChecklist = isOnFreePlan;

  // Handle test agent action — gate on mobile if no knowledge
  const handleTestAgent = useCallback(() => {
    if (!hasKnowledge && !isDesktop) {
      setIsTestGateOpen(true);
    } else if (!isDesktop) {
      setIsChatPanelOpen(true);
    }
    // Desktop: test chat is always visible in right column
  }, [hasKnowledge, isDesktop]);

  const handleTestAnyway = useCallback(() => {
    setIsChatPanelOpen(true);
  }, []);

  // Show empty state if no agent is selected
  if (!globalSelectedAgent) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <NoAgentEmptyState
          title={t('studio.no_agent_title')}
          message={t('studio.no_agent_message')}
          showCreateButton={false}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="p-6">
        <EmptyState
          title={t('studio.agent_not_found_title')}
          description={t('studio.agent_not_found_description')}
          action={
            <Link to="/agents">
              <Button variant="primary">{t('studio.back_to_agents')}</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <>
      {/* Responsive Layout: Grid on desktop, Block on mobile */}
      <div className={cn(
        'h-full bg-neutral-50',
        'block lg:grid lg:grid-cols-[2fr_1fr]'
      )}>
        {/* Left Column - Knowledge Sections (Full width on mobile, 2/3 on desktop) */}
        <div className="flex flex-col overflow-hidden lg:border-r border-neutral-200">
          {/* Setup Checklist — pinned at top, above header, for maximum visibility */}
          {showChecklist && (
            <div className="px-4 pt-4 sm:px-6 sm:pt-6">
              <SetupChecklist
                hasKnowledge={hasKnowledge}
                hasTested={hasTested}
                hasConnections={hasConnections}
                onAddKnowledge={() => setIsAddKBModalOpen(true)}
                onTestAgent={handleTestAgent}
                onConnect={() => navigate('/connections')}
                onSubscribe={() => setShowUpgradeWizard(true)}
              />
            </div>
          )}

          {/* Header Section + More menu — hidden during setup, shown after */}
          {!showChecklist && (
            <div className="px-4 pt-4 sm:px-6 sm:pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-xl sm:text-2xl font-semibold text-neutral-950">
                    {t('studio.page_title')}
                  </h1>
                  <p className="text-sm text-neutral-600 mt-1">
                    {t('studio.page_subtitle')}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <button
                        className="w-10 h-10 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 transition-colors flex items-center justify-center"
                        title={t('common.more')}
                      >
                        <MoreVertical className="w-5 h-5 text-neutral-700" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onClick={() => setIsAddKBModalOpen(true)}>
                        <Plus className="w-4 h-4 ltr:mr-2 rtl:ml-2 text-neutral-700" />
                        <span>{t('studio.add_knowledge')}</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setIsAddAttachmentModalOpen(true)}>
                        <Paperclip className="w-4 h-4 ltr:mr-2 rtl:ml-2 text-neutral-700" />
                        <span>{t('studio.add_attachment', 'Add Attachment')}</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setIsFollowUpModalOpen(true)}>
                        <Bell className="w-4 h-4 ltr:mr-2 rtl:ml-2 text-neutral-700" />
                        <span>{t('studio.automated_follow_ups')}</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          )}

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-4 py-4 sm:px-6 sm:py-6 pb-6 space-y-3 sm:space-y-4">
              {/* Main Instruction Card */}
              <MainInstructionCard />

              {/* ── Knowledge Section ── */}
              <div className="flex items-center gap-2 pt-4 mt-2">
                <BookOpen className="w-4 h-4 text-neutral-400" />
                <h2 className="text-sm font-medium text-neutral-500">
                  {t('studio.knowledge_section_title', 'Knowledge')}
                </h2>
                {knowledgeBases && knowledgeBases.length > 0 && (
                  <span className="text-xs text-neutral-400">({knowledgeBases.length})</span>
                )}
              </div>

              {/* Knowledge Base Cards */}
              {isLoadingKBs ? (
                <div className="flex items-center justify-center py-12">
                  <Spinner size="md" />
                </div>
              ) : knowledgeBases && knowledgeBases.length > 0 ? (
                <>
                  {knowledgeBases.map((kb) => (
                    <KnowledgeBaseItem
                      key={kb.id}
                      knowledgeBase={kb}
                      agentId={agentId!}
                      onUpdate={() => refetchKBs()}
                    />
                  ))}
                </>
              ) : (
                <button
                  onClick={() => setIsAddKBModalOpen(true)}
                  className="w-full rounded-lg border border-dashed border-neutral-300 hover:border-neutral-400 bg-white hover:bg-neutral-50/50 transition-all duration-200 cursor-pointer group/empty"
                >
                  <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4">
                    <Plus className="w-5 h-5 text-neutral-300 group-hover/empty:text-brand-mojeeb transition-colors flex-shrink-0" />
                    <div className="text-start min-w-0">
                      <span className="text-base font-semibold text-neutral-400 group-hover/empty:text-neutral-600 transition-colors block">
                        {t('studio.add_knowledge')}
                      </span>
                      <span className="text-xs text-neutral-400 block mt-0.5">
                        {t('studio.empty_knowledge_subtitle', 'Your agent uses this to answer questions')}
                      </span>
                    </div>
                  </div>
                </button>
              )}

              {/* Active Document Processing Jobs (persists across reloads + optimistic) */}
              {allActiveJobIds.map((jobId) => (
                <DocumentUploadProgressCard
                  key={jobId}
                  jobId={jobId}
                  onComplete={() => {
                    refetchKBs();
                    // Remove from optimistic state when complete
                    setActiveUploadJobs(prev => prev.filter(id => id !== jobId));
                  }}
                  onError={() => {
                    // Remove from optimistic state on error too
                    setActiveUploadJobs(prev => prev.filter(id => id !== jobId));
                  }}
                />
              ))}

              {/* ── Attachments Section (hidden when no knowledge bases yet) ── */}
              {(knowledgeBases && knowledgeBases.length > 0) || (attachments && attachments.length > 0) ? (
                <>
                  <div className="flex items-center gap-2 pt-4 mt-2">
                    <Paperclip className="w-4 h-4 text-neutral-400" />
                    <h2 className="text-sm font-medium text-neutral-500">
                      {t('studio.attachments_section_title', 'Attachments')}
                    </h2>
                    {attachments && attachments.length > 0 && (
                      <span className="text-xs text-neutral-400">({attachments.length})</span>
                    )}
                  </div>

                  {attachments && attachments.length > 0 ? (
                    attachments.map((attachment) => (
                      <AttachmentItem
                        key={attachment.id}
                        attachment={attachment}
                        onUpdate={() => refetchAttachments()}
                      />
                    ))
                  ) : (
                    <button
                      onClick={() => setIsAddAttachmentModalOpen(true)}
                      className="w-full rounded-lg border border-dashed border-neutral-300 hover:border-neutral-400 bg-white hover:bg-neutral-50/50 transition-all duration-200 cursor-pointer group/empty"
                    >
                      <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4">
                        <Plus className="w-5 h-5 text-neutral-300 group-hover/empty:text-brand-mojeeb transition-colors flex-shrink-0" />
                        <div className="text-start min-w-0">
                          <span className="text-base font-semibold text-neutral-400 group-hover/empty:text-neutral-600 transition-colors block">
                            {t('studio.add_attachment', 'Add Attachment')}
                          </span>
                          <span className="text-xs text-neutral-400 block mt-0.5">
                            {t('studio.empty_attachments_subtitle', 'Sent automatically based on your instructions')}
                          </span>
                        </div>
                      </div>
                    </button>
                  )}
                </>
              ) : null}

            </div>
          </div>
        </div>

        {/* Right Column - Test Chat (Desktop only - Hidden on mobile) */}
        <div className="hidden lg:flex flex-col bg-white overflow-hidden">
          <TestChat agentId={agentId} />
        </div>
      </div>

      {/* Floating Test Button - Mobile only, shown after checklist is dismissed */}
      {!isDesktop && !showChecklist && (
        <div className={cn('fixed bottom-6 right-4 z-30', 'lg:hidden')}>
          <button
            onClick={() => setIsChatPanelOpen(true)}
            className={cn(
              'w-14 h-14 rounded-full',
              'bg-brand-mojeeb text-white shadow-lg',
              'flex items-center justify-center',
              'hover:bg-brand-mojeeb-hover active:scale-95',
              'transition-all duration-200'
            )}
            aria-label={t('studio.test_chat_label')}
          >
            <MessageSquare className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Slide-out Test Chat Panel - Mobile only */}
      <TestChatPanel
        agentId={agentId}
        isOpen={isChatPanelOpen}
        onClose={() => setIsChatPanelOpen(false)}
      />

      {/* Add Knowledge Base Modal */}
      <AddKnowledgeBaseModal
        isOpen={isAddKBModalOpen}
        onClose={() => setIsAddKBModalOpen(false)}
        agentId={agent.id}
        simplified={!isDesktop && !hasKnowledge}
        onSuccess={() => {
          refetchKBs();
          setIsAddKBModalOpen(false);
        }}
        onUploadStart={(jobId) => {
          // Add to optimistic state for instant display
          setActiveUploadJobs(prev => [...prev, jobId]);
        }}
      />

      {/* Add Attachment Modal */}
      <CreateAttachmentModal
        isOpen={isAddAttachmentModalOpen}
        onClose={() => {
          setIsAddAttachmentModalOpen(false);
          refetchAttachments();
        }}
        agentId={agent.id}
      />

      {/* Follow-Up Settings Modal */}
      <FollowUpSettingsModal
        isOpen={isFollowUpModalOpen}
        onClose={() => setIsFollowUpModalOpen(false)}
        agent={agent}
      />

      {/* Test Gate Bottom Sheet - Mobile only, when testing without knowledge */}
      <TestGateBottomSheet
        isOpen={isTestGateOpen}
        onClose={() => setIsTestGateOpen(false)}
        onAddKnowledge={() => setIsAddKBModalOpen(true)}
        onTestAnyway={handleTestAnyway}
      />
    </>
  );
}
