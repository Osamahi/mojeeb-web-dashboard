/**
 * Users Table
 * Cursor-paginated user listing. Parent owns the pagination state and passes
 * `onLoadMore` / `hasNextPage` / `isFetchingNextPage` from useInfiniteUsers.
 */

import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Users as UsersIcon, Loader2 } from 'lucide-react';
import { useDateLocale } from '@/lib/dateConfig';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { Avatar } from '@/components/ui/Avatar';
import { PhoneNumber } from '@/components/ui/PhoneNumber';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { formatPhoneNumber } from '@/features/leads/utils/formatting';
import { formatCountry } from '@/lib/countryUtils';
import { UsersMobileCardView } from './UsersMobileCardView';
import type { User } from '../types';

interface UsersTableProps {
  users: User[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
}

export default function UsersTable({
  users,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: UsersTableProps) {
  const { t } = useTranslation();
  const { format } = useDateLocale();
  const isMobile = useIsMobile();

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

  // IntersectionObserver-based trigger (shared hook). Window scroll won't fire
  // here because DashboardLayout's <main> is the actual scroll container.
  useInfiniteScroll({
    fetchNextPage: onLoadMore,
    hasMore: hasNextPage,
    isFetching: isFetchingNextPage,
    containerSelector: '[data-users-container]',
  });

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
      key: 'country',
      label: t('users.table_country'),
      sortable: true,
      render: (country) => (
        <div className="text-sm text-neutral-900 whitespace-nowrap">
          {formatCountry(country as string | null | undefined)}
        </div>
      ),
    },
    {
      key: 'created_at',
      label: t('users.table_created'),
      sortable: true,
      render: (created_at) => {
        if (!created_at) return <div className="text-sm text-neutral-600">-</div>;
        return (
          <div className="text-sm text-neutral-600">
            {format(new Date(created_at as string), 'MMM dd, yyyy h:mm a')}
          </div>
        );
      },
    },
  ], [t, format]);

  if (isMobile) {
    return (
      <UsersMobileCardView
        users={users}
        onCopyPhone={handleCopyPhone}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onLoadMore={onLoadMore}
      />
    );
  }

  return (
    <div data-users-container>
      <DataTable
        data={users}
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

      {isFetchingNextPage && (
        <div className="flex justify-center items-center py-8 bg-white rounded-lg border border-neutral-200 mt-4">
          <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
          <span className="ml-2 text-sm text-neutral-600">{t('users.loading_more')}</span>
        </div>
      )}

      {!hasNextPage && users.length > 50 && (
        <div className="flex justify-center items-center py-6 bg-white rounded-lg border border-neutral-200 mt-4">
          <span className="text-sm text-neutral-500">
            {t('users.all_loaded', { count: users.length })}
          </span>
        </div>
      )}
    </div>
  );
}
