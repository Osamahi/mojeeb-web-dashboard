/**
 * Mojeeb Agent Studio Page
 * Responsive layout:
 * - Desktop (≥1024px): 2/3 + 1/3 split layout with sticky test chat
 * - Mobile (<1024px): Full-width knowledge section with slide-out test chat panel
 * Left: Main Instruction + Knowledge sections
 * Right: Embedded test chat (desktop) or slide-out panel (mobile)
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
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
import TestChat from '../components/TestChat';
import TestChatPanel from '../components/TestChatPanel';
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
  const { agent: globalSelectedAgent, agentId } = useAgentContext();
  const isDesktop = useIsDesktop();
  const [isAddKBModalOpen, setIsAddKBModalOpen] = useState(false);
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

              {/* Add Knowledge - Header Button (Mobile/Tablet only) */}
              <button
                onClick={() => setIsAddKBModalOpen(true)}
                className="lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 transition-colors"
                aria-label={t('studio.add_knowledge_label')}
              >
                <Plus className="w-4 h-4 text-neutral-700" />
                <span className="text-sm font-medium text-neutral-700">{t('common.add')}</span>
              </button>
            </div>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-4 py-4 sm:px-6 sm:py-6 pb-20 lg:pb-6 space-y-3 sm:space-y-4">
              {/* Main Instruction Card */}
              <MainInstructionCard />

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
                <div className="text-center py-8 text-sm text-neutral-500">
                  {t('studio.no_knowledge_message')}
                </div>
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

              {/* Add Knowledge Button - Desktop only */}
              <div className="hidden lg:flex justify-center pt-2">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => setIsAddKBModalOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t('studio.add_knowledge')}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Test Chat (Desktop only - Hidden on mobile) */}
        <div className="hidden lg:flex flex-col bg-white overflow-hidden">
          <TestChat agentId={agentId} />
        </div>
      </div>

      {/* Floating Action Button - Mobile & Tablet (Centered at Bottom) */}
      {!isDesktop && (
        <button
          onClick={() => setIsChatPanelOpen(true)}
          className={cn(
            'fixed bottom-6 left-1/2 -translate-x-1/2 z-30',
            'px-4 py-3 rounded-full',
            'bg-black text-white shadow-lg',
            'flex items-center justify-center',
            'hover:bg-neutral-800 active:scale-95',
            'transition-all duration-200',
            'lg:hidden'
          )}
          aria-label={t('studio.test_chat_label')}
        >
          <span className="text-sm font-medium whitespace-nowrap">{t('studio.test_agent')}</span>
        </button>
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
    </>
  );
}
