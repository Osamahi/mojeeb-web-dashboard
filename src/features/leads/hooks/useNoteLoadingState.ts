/**
 * Hook to track which leads are currently having notes added
 * Returns true if a note is being saved for the given leadId
 */

import { useMutationState } from '@tanstack/react-query';

export function useIsAddingNote(leadId: string): boolean {
  const pendingMutations = useMutationState({
    filters: { 
      status: 'pending',
      mutationKey: ['createLeadNote']
    },
    select: (mutation) => mutation.state.variables as { leadId: string; request: any } | undefined
  });

  // Check if any pending mutation matches this leadId
  return pendingMutations.some(
    (variables) => variables?.leadId === leadId
  );
}
