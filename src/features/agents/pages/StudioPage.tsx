/**
 * Mojeeb Agent Studio Page
 * Responsive layout:
 * - Desktop (≥1024px): 2/3 + 1/3 split layout with sticky test chat
 * - Mobile (<1024px): Full-width knowledge section with slide-out test chat panel
 * Left: Main Instruction + Knowledge sections
 * Right: Embedded test chat (desktop) or slide-out panel (mobile)
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Plus, MessageSquare, Bell, MoreVertical, Paperclip, BookOpen, ScrollText, Info } from 'lucide-react';
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
import { SectionInfoModal } from '../components/SectionInfoModal';
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
  const queryClient = useQueryClient();
  const setShowUpgradeWizard = useUIStore((s) => s.setShowUpgradeWizard);
  const { agent: globalSelectedAgent, agentId } = useAgentContext();
  const isDesktop = useIsDesktop();
  const [isAddKBModalOpen, setIsAddKBModalOpen] = useState(false);
  const [isAddAttachmentModalOpen, setIsAddAttachmentModalOpen] = useState(false);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  const [isTestGateOpen, setIsTestGateOpen] = useState(false);
  const [activeUploadJobs, setActiveUploadJobs] = useState<string[]>([]);
  const [sectionInfo, setSectionInfo] = useState<'instructions' | 'knowledge' | 'attachments' | null>(null);

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
  const { data: hasConversations, isLoading: isLoadingConversations } = useQuery({
    queryKey: ['hasConversations', agentId],
    queryFn: async () => {
      const res = await getConversations({ agent_id: agentId!, limit: 1 });
      return res.items.length > 0;
    },
    enabled: !!agentId,
    staleTime: 30_000,
  });

  // Check if agent has any connections
  const { data: connections, isLoading: isLoadingConnections } = useQuery({
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

  const isChecklistLoading = isLoadingKBs || isLoadingConversations || isLoadingConnections;
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
    } else {
      // Desktop: animate the "Try me" bubble + focus input
      const bubble = document.getElementById('testme-bubble');
      const allTextareas = document.querySelectorAll('textarea');
      let textarea: HTMLTextAreaElement | null = null;
      allTextareas.forEach(t => {
        if (t.placeholder?.includes('test')) textarea = t;
      });
      if (!textarea) textarea = allTextareas[allTextareas.length - 1];

      if (bubble) {
        // Inject keyframes if not present
        if (!document.getElementById('testme-burst-style')) {
          const style = document.createElement('style');
          style.id = 'testme-burst-style';
          style.textContent = `
            @keyframes testme-burst {
              0% { transform: scale(1); }
              20% { transform: scale(1.5); }
              50% { transform: scale(1.35); }
              100% { transform: scale(1); }
            }
          `;
          document.head.appendChild(style);
        }

        // Animate ring wrapper — scale burst
        const ringWrapper = bubble.children[2] as HTMLElement | null;
        if (ringWrapper) {
          ringWrapper.style.animation = 'testme-burst 2.5s cubic-bezier(0.22,1,0.36,1)';
          ringWrapper.addEventListener('animationend', () => {
            ringWrapper.style.animation = '';
          }, { once: true });
        }

      }

      if (textarea) {
        setTimeout(() => (textarea as HTMLTextAreaElement).focus(), 600);
      }
    }
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
          {/* Header Section + More menu (hidden during setup) */}
          <div className="px-4 pt-4 sm:px-6 sm:pt-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold text-neutral-950">
                  {t('studio.page_title')}
                </h1>
                {!showChecklist && (
                  <p className="text-sm text-neutral-600 mt-1">
                    {t('studio.page_subtitle')}
                  </p>
                )}
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

          {/* Setup Checklist — below header with breathing room */}
          {showChecklist && (
            <div className="px-4 pt-4 sm:px-6 sm:pt-5">
              <SetupChecklist
                isLoading={isChecklistLoading}
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

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-4 pt-6 pb-10 sm:px-6 sm:pt-8">

              {/* ── Instructions Section ── */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              >
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-base font-semibold text-neutral-700">
                  {t('studio.instructions_section_title', 'Instructions')}
                </h2>
                <button onClick={() => setSectionInfo('instructions')} className="hidden sm:inline-flex text-neutral-300 hover:text-neutral-500 transition-colors">
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Main Instruction Card */}
              <MainInstructionCard />
              </motion.div>

              {/* ── Knowledge Section ── */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.08, ease: [0.25, 0.1, 0.25, 1] }}
              >
              <div className="flex items-center gap-2 mt-8 mb-2">
                <h2 className="text-base font-semibold text-neutral-700">
                  {t('studio.knowledge_section_title', 'Knowledge')}
                </h2>
                <button onClick={() => setSectionInfo('knowledge')} className="hidden sm:inline-flex text-neutral-300 hover:text-neutral-500 transition-colors">
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Knowledge Base Cards */}
              <div className="space-y-2">
              {isLoadingKBs ? (
                <div className="space-y-2">
                  {[0, 1].map((i) => (
                    <div key={i} className="bg-white rounded-xl border border-neutral-100 overflow-hidden">
                      <div className="flex items-center gap-3 p-4">
                        <div className="w-5 h-5 rounded bg-neutral-100 flex-shrink-0 shimmer-element" />
                        <div className="flex-1 h-4 rounded bg-neutral-100 shimmer-element" style={{ maxWidth: i === 0 ? '60%' : '45%' }} />
                      </div>
                    </div>
                  ))}
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
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsAddKBModalOpen(true)}
                    className="w-full"
                  >
                    <Plus className="w-3.5 h-3.5 me-1.5" />
                    {t('studio.add_knowledge')}
                  </Button>
                </>
              ) : (
                <div className="rounded-lg bg-neutral-50/80 border border-neutral-200 py-8 flex flex-col items-center text-center">
                  <BookOpen className="w-7 h-7 text-neutral-300 mb-3" />
                  <p className="text-sm font-medium text-neutral-900">
                    {t('studio.empty_knowledge_title', 'Add your first knowledge source')}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1 px-4">
                    {t('studio.empty_knowledge_subtitle', 'Your agent uses this to answer questions')}
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsAddKBModalOpen(true)}
                    className="mt-4"
                  >
                    <Plus className="w-3.5 h-3.5 me-1.5" />
                    {t('studio.add_knowledge')}
                  </Button>
                </div>
              )}

              {/* Active Document Processing Jobs (persists across reloads + optimistic) */}
              {allActiveJobIds.map((jobId) => (
                <DocumentUploadProgressCard
                  key={jobId}
                  jobId={jobId}
                  onComplete={() => {
                    refetchKBs();
                    setActiveUploadJobs(prev => prev.filter(id => id !== jobId));
                  }}
                  onError={() => {
                    setActiveUploadJobs(prev => prev.filter(id => id !== jobId));
                  }}
                />
              ))}
              </div>
              </motion.div>

              {/* ── Attachments Section (hidden when no knowledge bases yet) ── */}
              {(knowledgeBases && knowledgeBases.length > 0) || (attachments && attachments.length > 0) ? (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.16, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  <div className="flex items-center gap-2 mt-8 mb-2">
                    <h2 className="text-base font-semibold text-neutral-700">
                      {t('studio.attachments_section_title', 'Attachments')}
                    </h2>
                    <button onClick={() => setSectionInfo('attachments')} className="hidden sm:inline-flex text-neutral-300 hover:text-neutral-500 transition-colors">
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2">
                  {attachments && attachments.length > 0 ? (
                    <>
                      {attachments.map((attachment) => (
                        <AttachmentItem
                          key={attachment.id}
                          attachment={attachment}
                          onUpdate={() => refetchAttachments()}
                        />
                      ))}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setIsAddAttachmentModalOpen(true)}
                        className="w-full"
                      >
                        <Plus className="w-3.5 h-3.5 me-1.5" />
                        {t('studio.add_attachment', 'Add Attachment')}
                      </Button>
                    </>
                  ) : (
                    <div className="rounded-lg bg-neutral-50/80 border border-neutral-200 py-8 flex flex-col items-center text-center">
                      <Paperclip className="w-7 h-7 text-neutral-300 mb-3" />
                      <p className="text-sm font-medium text-neutral-900">
                        {t('studio.empty_attachments_title', 'Add your first attachment')}
                      </p>
                      <p className="text-xs text-neutral-500 mt-1 px-4">
                        {t('studio.empty_attachments_subtitle', 'Sent automatically based on your instructions')}
                      </p>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setIsAddAttachmentModalOpen(true)}
                        className="mt-4"
                      >
                        <Plus className="w-3.5 h-3.5 me-1.5" />
                        {t('studio.add_attachment', 'Add Attachment')}
                      </Button>
                    </div>
                  )}
                  </div>
                </motion.div>
              ) : null}

            </div>
          </div>
        </div>

        {/* Right Column - Test Chat (Desktop only - Hidden on mobile) */}
        <div className="hidden lg:flex flex-col bg-white overflow-hidden">
          <TestChat
            agentId={agentId}
            onFirstMessageSent={() => queryClient.invalidateQueries({ queryKey: ['hasConversations', agentId] })}
          />
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
        onFirstMessageSent={() => queryClient.invalidateQueries({ queryKey: ['hasConversations', agentId] })}
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

      {/* Section Info Modal */}
      <SectionInfoModal
        isOpen={sectionInfo === 'instructions'}
        onClose={() => setSectionInfo(null)}
        title={t('studio.instructions_section_title', 'Instructions')}
        description={t('studio.instructions_info')}
      />
      <SectionInfoModal
        isOpen={sectionInfo === 'knowledge'}
        onClose={() => setSectionInfo(null)}
        title={t('studio.knowledge_section_title', 'Knowledge')}
        description={t('studio.knowledge_info')}
      />
      <SectionInfoModal
        isOpen={sectionInfo === 'attachments'}
        onClose={() => setSectionInfo(null)}
        title={t('studio.attachments_section_title', 'Attachments')}
        description={t('studio.attachments_info')}
      />
    </>
  );
}
