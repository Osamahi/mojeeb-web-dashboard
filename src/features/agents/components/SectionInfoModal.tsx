import { BaseModal } from '@/components/ui/BaseModal';

interface SectionInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
}

export function SectionInfoModal({ isOpen, onClose, title, description }: SectionInfoModalProps) {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={title} maxWidth="sm">
      <p className="text-sm text-neutral-600 leading-relaxed">{description}</p>
    </BaseModal>
  );
}
