/**
 * UserCard Component
 * Mobile-friendly card view for individual user
 * View-only card with phone copy functionality
 */

import { Copy, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/ui/Avatar';
import { PhoneNumber } from '@/components/ui/PhoneNumber';
import type { User } from '../types';

interface UserCardProps {
  user: User;
  onCopyPhone: (phone: string, e: React.MouseEvent) => void;
}

export function UserCard({ user, onCopyPhone }: UserCardProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-4 transition-colors">
      {/* Header: Avatar + Name */}
      <div className="flex items-start gap-3 mb-3">
        <Avatar
          src={user.avatar_url || undefined}
          name={user.name || user.email || t('users.anonymous_user')}
          size="lg"
        />
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-neutral-900 truncate mb-0.5">
            {user.name || t('users.anonymous_user')}
          </h3>
          {user.o_auth_provider && (
            <div className="text-xs text-neutral-500">
              {t('users.oauth_label')}: {user.o_auth_provider}
            </div>
          )}
        </div>
      </div>

      {/* Body: Email + Phone */}
      <div className="space-y-2.5 mb-3">
        {/* Email */}
        {user.email && (
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-neutral-400 flex-shrink-0" />
            <a
              href={`mailto:${user.email}`}
              className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors truncate"
            >
              {user.email}
            </a>
          </div>
        )}

        {/* Phone with Copy Button */}
        {user.phone && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <a
                href={`tel:${user.phone}`}
                className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                <PhoneNumber value={user.phone} />
              </a>
              <button
                onClick={(e) => onCopyPhone(user.phone!, e)}
                className="p-1.5 hover:bg-neutral-100 rounded transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                title={t('users.copy_phone')}
              >
                <Copy className="w-3.5 h-3.5 text-neutral-400 hover:text-neutral-700" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer: Created Date */}
      <div className="pt-3 border-t border-neutral-100">
        <div className="text-xs text-neutral-500">
          {(() => {
            try {
              if (!user.created_at) return '—';

              const dateStr = user.created_at.toString();
              const date = new Date(dateStr.endsWith('Z') ? dateStr : `${dateStr}Z`);

              if (isNaN(date.getTime())) return '—';

              return (
                <div className="flex items-center justify-between">
                  <span>{t('users.created')}</span>
                  <span className="font-medium">
                    {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            } catch {
              return '—';
            }
          })()}
        </div>
      </div>
    </div>
  );
}
