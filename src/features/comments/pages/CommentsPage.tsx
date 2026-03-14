/**
 * Mojeeb Comments Page
 * Split-pane layout for managing social media comment replies
 * Real-time updates via Supabase subscriptions
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useAgentContext } from '@/hooks/useAgentContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useIsMobile } from '@/hooks/useMediaQuery';
import NoAgentEmptyState from '@/features/agents/components/NoAgentEmptyState';
import { useConnections } from '@/features/connections/hooks/useConnections';
import { PostList } from '../components/PostList';
import { CommentThread } from '../components/CommentThread';
import { CommentEmptyState } from '../components/CommentEmptyState';
import { useSocialPosts } from '../hooks/useSocialPosts';
import { useCommentsPageRealtime } from '../hooks/useCommentsPageRealtime';
import type { SocialPost } from '../types/comment.types';

export function CommentsPage() {
  const { t } = useTranslation();
  useDocumentTitle('pages.title_comments');
  const isMobile = useIsMobile();
  const { agent: globalSelectedAgent, agentId } = useAgentContext();

  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);
  const [showThread, setShowThread] = useState(false);

  // Reset selection when agent changes
  useEffect(() => {
    setSelectedPost(null);
    setShowThread(false);
  }, [agentId]);

  // Get comment-enabled connection IDs for realtime subscriptions
  const { data: connections } = useConnections();
  const commentConnectionIds = useMemo(
    () => (connections ?? [])
      .filter(c => c.respondToComments && c.isActive)
      .map(c => c.id),
    [connections]
  );

  // Look up the connected page/account name for the selected post
  const replyPageName = useMemo(() => {
    if (!selectedPost || !connections) return null;
    const conn = connections.find(c => c.id === selectedPost.connectionId);
    return conn?.platformAccountName || null;
  }, [selectedPost, connections]);

  useCommentsPageRealtime({
    agentId: agentId ?? null,
    connectionIds: commentConnectionIds,
    selectedPostId: selectedPost?.id ?? null,
  });

  const {
    posts,
    isLoading: isLoadingPosts,
    isError: isPostsError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch: refetchPosts,
  } = useSocialPosts(agentId ?? null);

  const handleSelectPost = useCallback((post: SocialPost) => {
    setSelectedPost(post);
    if (isMobile) {
      setShowThread(true);
    }
  }, [isMobile]);

  const handleBackToList = useCallback(() => {
    setShowThread(false);
    setSelectedPost(null);
  }, []);

  const handleLoadMore = useCallback(() => {
    fetchNextPage();
  }, [fetchNextPage]);

  if (!globalSelectedAgent) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <NoAgentEmptyState
          title={t('comments_page.no_agent_title')}
          message={t('comments_page.no_agent_message')}
          showCreateButton={false}
        />
      </div>
    );
  }

  // Mobile: Show either post list or comment thread (stacked)
  if (isMobile) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        {!showThread ? (
          <PostList
            posts={posts}
            selectedPostId={selectedPost?.id ?? null}
            onSelectPost={handleSelectPost}
            isLoading={isLoadingPosts}
            isError={isPostsError}
            onRetry={refetchPosts}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            onLoadMore={handleLoadMore}
          />
        ) : selectedPost ? (
          <CommentThread post={selectedPost} pageName={replyPageName} onBack={handleBackToList} />
        ) : null}
      </div>
    );
  }

  // Desktop/Tablet: Split-pane layout
  return (
    <div className="h-full overflow-hidden">
      <PanelGroup direction="horizontal">
        {/* Left Panel: Post List */}
        <Panel defaultSize={35} minSize={25} maxSize={50}>
          <PostList
            posts={posts}
            selectedPostId={selectedPost?.id ?? null}
            onSelectPost={handleSelectPost}
            isLoading={isLoadingPosts}
            isError={isPostsError}
            onRetry={refetchPosts}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            onLoadMore={handleLoadMore}
          />
        </Panel>

        <PanelResizeHandle className="w-px bg-neutral-200 hover:bg-brand-mojeeb transition-colors" />

        {/* Right Panel: Comment Thread */}
        <Panel defaultSize={65}>
          {selectedPost ? (
            <CommentThread post={selectedPost} pageName={replyPageName} />
          ) : (
            <CommentEmptyState />
          )}
        </Panel>
      </PanelGroup>
    </div>
  );
}
