/**
 * Invitation Sent Modal
 * Shows confirmation after invitation is sent with share link capabilities
 */

import { useState } from 'react';
import { CheckCircle, Copy, Share2, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { BaseModal } from '@/components/ui/BaseModal';
import { Button } from '@/components/ui/Button';

interface InvitationSentModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  invitationToken: string;
  organizationName: string;
  role: string;
}

export default function InvitationSentModal({
  isOpen,
  onClose,
  email,
  invitationToken,
  organizationName,
  role
}: InvitationSentModalProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [showShareSection, setShowShareSection] = useState(false);

  // Generate invitation URL
  const invitationUrl = `${window.location.origin}/accept-invitation?token=${invitationToken}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(invitationUrl);
      setCopied(true);
      toast.success(t('team.copy_link_success'));
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error(t('team.copy_link_failed'));
    }
  };

  const handleShareWhatsApp = () => {
    const message = encodeURIComponent(
      `You've been invited to join ${organizationName} as a ${role}.\n\n` +
      `Click the link below to accept the invitation and create your account:\n\n` +
      `${invitationUrl}\n\n` +
      `This invitation link is valid for 7 days.`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('team.invitation_sent_title')}
      maxWidth="md"
    >
      <div className="space-y-6">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>

        {/* Invitation Details */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-neutral-900">
            {t('team.invitation_sent_message', { email })}
          </h3>
        </div>

        {/* Expandable Share Link Section */}
        <AnimatePresence>
          {showShareSection && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="space-y-3 pt-4">
                <div className="flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-neutral-500" />
                  <span className="text-sm font-medium text-neutral-700">{t('team.share_invitation_link')}</span>
                </div>

                {/* Link Display Box */}
                <div className="flex items-center gap-2 p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-neutral-600 truncate font-mono">
                      {invitationUrl}
                    </p>
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className="flex-shrink-0 p-2 hover:bg-neutral-100 rounded-md transition-colors"
                    title="Copy link"
                  >
                    {copied ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <Copy className="h-5 w-5 text-neutral-600" />
                    )}
                  </button>
                </div>

                {/* Share Actions */}
                <div className="flex gap-3">
                  <Button
                    onClick={handleCopyLink}
                    variant="secondary"
                    className="flex-1"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    {copied ? t('team.copied') : t('team.copy_link')}
                  </Button>
                  <Button
                    onClick={handleShareWhatsApp}
                    variant="secondary"
                    className="flex-1"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    {t('team.whatsapp')}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-neutral-200">
          {!showShareSection && (
            <Button
              onClick={() => setShowShareSection(true)}
              variant="secondary"
              className="flex-1"
            >
              <Share2 className="h-4 w-4 mr-2" />
              {t('team.share_invitation')}
            </Button>
          )}
          <Button
            onClick={onClose}
            className={`bg-brand-cyan hover:bg-brand-cyan/90 ${showShareSection ? 'flex-1' : 'flex-1'}`}
          >
            {t('team.done')}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}
