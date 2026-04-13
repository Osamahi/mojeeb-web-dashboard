import { BaseModal } from '@/components/ui/BaseModal';
import { useStepUsers } from '../hooks/useStepUsers';
import { STAGE_LABELS } from '../types/funnel.types';
import { formatDistanceToNow } from 'date-fns';

interface StepUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventName: string | null;
  startDate: string;
  endDate: string;
}

export function StepUsersModal({ isOpen, onClose, eventName, startDate, endDate }: StepUsersModalProps) {
  const { data: users = [], isLoading } = useStepUsers(eventName, startDate, endDate);
  const label = eventName ? (STAGE_LABELS[eventName] || eventName) : '';

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={label}
      subtitle={`${users.length} user${users.length !== 1 ? 's' : ''} reached this step`}
      maxWidth="2xl"
      isLoading={isLoading}
    >
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 bg-neutral-100 rounded animate-pulse" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <p className="text-neutral-400 text-sm text-center py-8">No users found for this step</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="pb-2 pr-4 font-medium">Name</th>
                <th className="pb-2 pr-4 font-medium">Email</th>
                <th className="pb-2 pr-4 font-medium">Agent</th>
                <th className="pb-2 font-medium">Event Time</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.userId} className="border-b border-neutral-100 hover:bg-neutral-50">
                  <td className="py-2.5 pr-4 text-neutral-900">{u.userName || '-'}</td>
                  <td className="py-2.5 pr-4 text-neutral-600">{u.userEmail || '-'}</td>
                  <td className="py-2.5 pr-4 text-neutral-600">{u.agentName || '-'}</td>
                  <td className="py-2.5 text-neutral-400 whitespace-nowrap">
                    {formatDistanceToNow(new Date(u.eventCreatedAt), { addSuffix: true })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </BaseModal>
  );
}
