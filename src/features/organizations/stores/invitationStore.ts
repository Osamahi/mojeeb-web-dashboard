/**
 * Invitation Store
 *
 * Manages pending invitations state and modal visibility
 * Used after user authentication to display pending invitations
 */

import { create } from 'zustand';
import type { PendingInvitation } from '../services/invitationService';

interface InvitationStore {
  pendingInvitations: PendingInvitation[];
  showModal: boolean;
  setPendingInvitations: (invitations: PendingInvitation[]) => void;
  setShowModal: (show: boolean) => void;
  clearInvitations: () => void;
}

export const useInvitationStore = create<InvitationStore>((set) => ({
  pendingInvitations: [],
  showModal: false,

  setPendingInvitations: (invitations) => set({ pendingInvitations: invitations }),

  setShowModal: (show) => set({ showModal: show }),

  clearInvitations: () => set({ pendingInvitations: [], showModal: false }),
}));
