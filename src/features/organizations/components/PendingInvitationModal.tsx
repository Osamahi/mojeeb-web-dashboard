/**
 * Pending Invitation Modal
 *
 * Displays pending invitations after user signs in
 * Allows user to accept or dismiss invitations
 */

import { useState } from 'react';
import { BaseModal } from '@/components/ui/BaseModal';
import { Button } from '@/components/ui/Button';
import { useInvitationStore } from '../stores/invitationStore';
import { useConversationStore } from '@/features/conversations/stores/conversationStore';
import { useAcceptInvitationMutation } from '../hooks/useAcceptInvitationMutation';
import { AcceptInvitationConfirmDialog } from './AcceptInvitationConfirmDialog';
import { Building2, Clock, UserCircle } from 'lucide-react';
import { logger } from '@/lib/logger';
import { formatDistanceToNow } from 'date-fns';

export const PendingInvitationModal = () => {
  const { pendingInvitations, showModal, setShowModal, clearInvitations } = useInvitationStore();
  const selectedConversation = useConversationStore((state) => state.selectedConversation);
  const acceptMutation = useAcceptInvitationMutation();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);

  if (!showModal || pendingInvitations.length === 0) {
    return null;
  }

  const currentInvitation = pendingInvitations[currentIndex];
  const hasMultiple = pendingInvitations.length > 1;

  const handleAccept = () => {
    logger.info('[PendingInvitationModal] User accepting invitation', {
      organizationName: currentInvitation.organizationName,
      hasOpenConversation: !!selectedConversation,
    });

    // If user has open conversation, show confirmation first
    if (selectedConversation) {
      setShowConfirmation(true);
      return;
    }

    // Otherwise, accept immediately
    proceedWithAcceptance();
  };

  const proceedWithAcceptance = () => {
    setShowConfirmation(false);

    acceptMutation.mutate(
      {
        token: currentInvitation.invitationToken,
        organizationName: currentInvitation.organizationName,
      },
      {
        onSuccess: () => {
          setShowModal(false);
        },
      }
    );
  };

  const handleSkip = () => {
    if (hasMultiple && currentIndex < pendingInvitations.length - 1) {
      // Show next invitation
      setCurrentIndex(currentIndex + 1);
    } else {
      // No more invitations, close modal
      setShowModal(false);
      clearInvitations();
    }
  };

  const handleDismissAll = () => {
    logger.info('[PendingInvitationModal] User dismissed all invitations');
    setShowModal(false);
    clearInvitations();
  };

  const expiresIn = formatDistanceToNow(new Date(currentInvitation.expiresAt), { addSuffix: true });

  return (
    <>
      <BaseModal
        isOpen={showModal && !showConfirmation}
        onClose={() => setShowModal(false)}
        title="Pending Invitation"
        subtitle={hasMultiple ? `You have ${pendingInvitations.length} pending invitations` : undefined}
        maxWidth="md"
        isLoading={acceptMutation.isPending}
        closable={!acceptMutation.isPending}
      >
      <div className="space-y-6">
        {/* Invitation Card */}
        <div className="p-4 bg-brand-mojeeb/5 border border-brand-mojeeb/20 rounded-lg space-y-3">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-brand-mojeeb/10 flex items-center justify-center flex-shrink-0">
              <Building2 className="h-5 w-5 text-brand-mojeeb" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-neutral-900">You've been invited to join</h3>
              <p className="text-lg font-bold text-brand-mojeeb mt-1">{currentInvitation.organizationName}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-200">
            <div className="flex items-center gap-2">
              <UserCircle className="h-4 w-4 text-neutral-500" />
              <div>
                <p className="text-xs text-neutral-500">Invited by</p>
                <p className="text-sm font-medium text-neutral-900">
                  {currentInvitation.inviterName || 'Team Admin'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-neutral-500" />
              <div>
                <p className="text-xs text-neutral-500">Expires</p>
                <p className="text-sm font-medium text-neutral-900">{expiresIn}</p>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-neutral-200">
            <p className="text-xs text-neutral-500">
              Role: <span className="font-medium text-neutral-700 capitalize">{currentInvitation.role}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <Button onClick={handleAccept} className="w-full" disabled={acceptMutation.isPending}>
            {acceptMutation.isPending ? 'Accepting...' : 'Accept Invitation'}
          </Button>

          {hasMultiple && currentIndex < pendingInvitations.length - 1 ? (
            <Button onClick={handleSkip} variant="secondary" className="w-full" disabled={acceptMutation.isPending}>
              Skip & View Next ({currentIndex + 1}/{pendingInvitations.length})
            </Button>
          ) : (
            <Button onClick={handleDismissAll} variant="secondary" className="w-full" disabled={acceptMutation.isPending}>
              {hasMultiple ? 'Dismiss All' : 'Maybe Later'}
            </Button>
          )}
        </div>

        {/* Progress Indicator (for multiple invitations) */}
        {hasMultiple && (
          <div className="flex justify-center gap-1.5">
            {pendingInvitations.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all ${
                  index === currentIndex
                    ? 'w-8 bg-brand-mojeeb'
                    : index < currentIndex
                    ? 'w-1.5 bg-brand-mojeeb/40'
                    : 'w-1.5 bg-neutral-200'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </BaseModal>

      {/* Confirmation Dialog - Shows if user has open conversation */}
      <AcceptInvitationConfirmDialog
        isOpen={showConfirmation}
        onConfirm={proceedWithAcceptance}
        onCancel={() => setShowConfirmation(false)}
        organizationName={currentInvitation.organizationName}
        isLoading={acceptMutation.isPending}
      />
    </>
  );
};
