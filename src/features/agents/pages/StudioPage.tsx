/**
 * Mojeeb Agent Studio Page
 * Responsive layout:
 * - Desktop (≥1024px): 2/3 + 1/3 split layout with sticky test chat
 * - Mobile (<1024px): Full-width knowledge section with slide-out test chat panel
 * Left: Main Instruction + Knowledge sections
 * Right: Embedded test chat (desktop) or slide-out panel (mobile)
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Plus, MessageSquare, Plug, Bell, MoreVertical, Paperclip, BookOpen } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { agentService } from '../services/agentService';
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
import { useAgentAttachments } from '@/features/attachments/hooks/useAgentAttachments';
import AttachmentItem from '@/features/attachments/components/AttachmentItem';
import { CreateAttachmentModal } from '@/features/attachments/components/CreateAttachmentModal';
import { logger } from '@/lib/logger';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

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
  const { agent: globalSelectedAgent, agentId } = useAgentContext();
  const isDesktop = useIsDesktop();
  const [isAddKBModalOpen, setIsAddKBModalOpen] = useState(false);
  const [isAddAttachmentModalOpen, setIsAddAttachmentModalOpen] = useState(false);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
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

  // Log errors
  useEffect(() => {
    if (error) {
      logger.error('Error loading agent', error);
    }
  }, [error]);

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
          {/* Header Section - Responsive padding and typography */}
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

              {/* Right side: More menu (all screens) + Add button (mobile only) */}
              <div className="flex items-center gap-2">
                {/* More Options Dropdown */}
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

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-4 py-4 sm:px-6 sm:py-6 pb-20 lg:pb-6 space-y-3 sm:space-y-4">
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
                      onUpdate={() => refetchKBs()}
                    />
                  ))}
                </>
              ) : (
                <button
                  onClick={() => setIsAddKBModalOpen(true)}
                  className="w-full rounded-lg border border-dashed border-neutral-300 hover:border-neutral-400 bg-white hover:bg-neutral-50/50 transition-all duration-200 cursor-pointer group/empty animate-[pulse_1.5s_ease-in-out_infinite] hover:animate-none"
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

      {/* Floating Action Buttons - Mobile & Tablet (Centered at Bottom) */}
      {!isDesktop && (
        <div className={cn('fixed bottom-6 left-1/2 -translate-x-1/2 z-30', 'lg:hidden')}>
          <div className={cn('flex items-center', 'bg-black rounded-full shadow-lg p-1')}>
            {/* Test Agent Button */}
            <button
              onClick={() => setIsChatPanelOpen(true)}
              className={cn(
                'px-4 py-3',
                'ltr:rounded-l-full rtl:rounded-r-full',
                'bg-black text-white',
                'flex items-center justify-center',
                'hover:bg-neutral-700 active:scale-95',
                'transition-all duration-200'
              )}
              aria-label={t('studio.test_chat_label')}
            >
              <MessageSquare className="w-4 h-4 me-3" />
              <span className="text-sm font-medium whitespace-nowrap">{t('studio.test')}</span>
            </button>

            {/* Divider */}
            <div className="w-px h-8 bg-neutral-700" />

            {/* Connect Agent Button */}
            <button
              onClick={() => navigate('/connections')}
              className={cn(
                'px-4 py-3',
                'ltr:rounded-r-full rtl:rounded-l-full',
                'bg-black text-white',
                'flex items-center justify-center',
                'hover:bg-neutral-700 active:scale-95',
                'transition-all duration-200'
              )}
              aria-label="Connect Agent"
            >
              <Plug className="w-4 h-4 me-3" />
              <span className="text-sm font-medium whitespace-nowrap">{t('studio.connect_agent')}</span>
            </button>
          </div>
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
    </>
  );
}
