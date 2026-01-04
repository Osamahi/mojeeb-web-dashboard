/**
 * Users Table Component
 * Displays system users with sorting and infinite scroll
 */

import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Users as UsersIcon, Loader2 } from 'lucide-react';
import { useDateLocale } from '@/lib/dateConfig';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { Avatar } from '@/components/ui/Avatar';
import { PhoneNumber } from '@/components/ui/PhoneNumber';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { formatPhoneNumber } from '@/features/leads/utils/formatting';
import { UsersMobileCardView } from './UsersMobileCardView';
import type { User } from '../types';

interface UsersTableProps {
  users: User[];
}

export default function UsersTable({ users }: UsersTableProps) {
  const { t } = useTranslation();
  const { format } = useDateLocale();
  const isMobile = useIsMobile();

  // Infinite scroll state
  const [displayCount, setDisplayCount] = useState(50);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Phone copy handler (mobile only)
  const handleCopyPhone = useCallback((phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const formattedPhone = formatPhoneNumber(phone);
    navigator.clipboard.writeText(formattedPhone).then(() => {
      toast.success(t('users.copied_to_clipboard'));
    }).catch(() => {
      toast.error(t('users.failed_to_copy'));
    });
  }, [t]);

  // Displayed users with infinite scroll
  const displayedUsers = useMemo(() => {
    return users.slice(0, displayCount);
  }, [users, displayCount]);

  // Infinite scroll handler - using window scroll
  useEffect(() => {
    const handleScroll = () => {
      // Check if we're near the bottom of the page
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // Load more when scrolled to 80% of the way down
      if (scrollTop + windowHeight >= documentHeight * 0.8) {
        if (!isLoadingMore && displayCount < users.length) {
          setIsLoadingMore(true);

          // Simulate loading delay for smooth UX
          setTimeout(() => {
            setDisplayCount(prev => Math.min(prev + 50, users.length));
            setIsLoadingMore(false);
          }, 300);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [displayCount, users.length, isLoadingMore]);

  // Define columns
  const columns = useMemo<ColumnDef<User>[]>(() => [
    {
      key: 'name',
      label: t('users.table_user'),
      sortable: false,
      render: (_, user) => (
        <div className="flex items-center gap-3">
          <Avatar
            src={user.avatar_url || undefined}
            name={user.name || t('users.anonymous_user')}
            size="md"
          />
          <div>
            <div className="font-medium text-neutral-900">
              {user.name || t('users.anonymous_user')}
            </div>
            {user.o_auth_provider && (
              <div className="text-xs text-neutral-500">
                {t('users.oauth_label')}: {user.o_auth_provider}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      label: t('users.table_email'),
      sortable: true,
      render: (email) => (
        <div className="text-sm text-neutral-900">{email || '-'}</div>
      ),
    },
    {
      key: 'phone',
      label: t('users.table_phone'),
      sortable: false,
      render: (phone) => (
        <div className="text-sm text-neutral-900">
          {phone ? <PhoneNumber value={phone} /> : '-'}
        </div>
      ),
    },
    {
      key: 'created_at',
      label: t('users.table_created'),
      sortable: true,
      render: (created_at) => {
        if (!created_at) return <div className="text-sm text-neutral-600">-</div>;

        // Backend returns UTC time without 'Z', so we append it to ensure proper parsing
        const dateString = (created_at as string).endsWith('Z')
          ? created_at as string
          : `${created_at}Z`;

        return (
          <div className="text-sm text-neutral-600">
            {format(new Date(dateString), 'MMM dd, yyyy h:mm a')}
          </div>
        );
      },
    },
  ], [t, format]);

  // Render mobile card view
  if (isMobile) {
    return (
      <UsersMobileCardView
        users={users}
        onCopyPhone={handleCopyPhone}
      />
    );
  }

  // Render desktop table view
  return (
    <>
      <DataTable
        data={displayedUsers}
        columns={columns}
        rowKey="id"
        initialSortField="created_at"
        initialSortDirection="desc"
        paginated={false}
        itemName="users"
        emptyState={{
          icon: <UsersIcon className="w-12 h-12 text-neutral-400" />,
          title: t('users.no_users_title'),
          description: t('users.no_users_description'),
        }}
      />

      {/* Loading More Indicator */}
      {isLoadingMore && (
        <div className="flex justify-center items-center py-8 bg-white rounded-lg border border-neutral-200 mt-4">
          <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
          <span className="ml-2 text-sm text-neutral-600">{t('users.loading_more')}</span>
        </div>
      )}

      {/* End of results indicator */}
      {displayedUsers.length >= users.length && users.length > 50 && (
        <div className="flex justify-center items-center py-6 bg-white rounded-lg border border-neutral-200 mt-4">
          <span className="text-sm text-neutral-500">
            {t('users.all_loaded', { count: users.length })}
          </span>
        </div>
      )}
    </>
  );
}
