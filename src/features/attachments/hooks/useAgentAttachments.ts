/**
 * Per-agent attachments hook for Studio page.
 * Simple useQuery (not infinite) — regular users have ~5-20 attachments per agent.
 */

import { useQuery } from '@tanstack/react-query';
import { attachmentService } from '../services/attachmentService';
import { queryKeys } from '@/lib/queryKeys';

export function useAgentAttachments(agentId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.agentAttachments(agentId),
    queryFn: () => attachmentService.getAttachmentsCursor(agentId!, 100),
    enabled: !!agentId,
    staleTime: 30_000,
    select: (data) => data.attachments,
  });
}
