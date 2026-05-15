/**
 * useOrgMembers
 *
 * Reusable hook to fetch the current agent's organization members. Used by
 * any feature that needs to render a list of teammates — assignment pickers
 * on the leads / conversations pages, team settings, future bulk-assign flow.
 *
 * Cached for 5 minutes via TanStack Query (same staleTime as
 * useOrganizationAuth) so the dropdown opens instantly on first click.
 * Multiple callers share the cache via the queryKey, so mounting an
 * `<AssigneeDropdown />` on every row doesn't fan out into N requests.
 */
import { useQuery } from '@tanstack/react-query';
import { useAgentContext } from '@/hooks/useAgentContext';
import { organizationService } from '../services/organizationService';
import type { OrganizationMember } from '../types';

const STALE_MS = 5 * 60 * 1000;
const GC_MS = 10 * 60 * 1000;

export function useOrgMembers(organizationId?: string) {
  const { agent } = useAgentContext();
  const orgId = organizationId ?? agent?.organizationId ?? undefined;

  return useQuery<OrganizationMember[]>({
    queryKey: ['organization-members', orgId],
    queryFn: () =>
      orgId
        ? organizationService.getOrganizationMembers(orgId)
        : Promise.resolve([]),
    enabled: !!orgId,
    staleTime: STALE_MS,
    gcTime: GC_MS,
  });
}

/**
 * Build a stable `userId → OrganizationMember` lookup from the result of
 * `useOrgMembers`. Cells rendering an assignee badge need the member record
 * for the user id stored on the lead/conversation; doing a `.find()` per
 * row would be O(rows × members). This map makes it O(1).
 */
export function buildMemberLookup(
  members: OrganizationMember[] | undefined,
): Map<string, OrganizationMember> {
  const map = new Map<string, OrganizationMember>();
  if (!members) return map;
  for (const m of members) map.set(m.userId, m);
  return map;
}
