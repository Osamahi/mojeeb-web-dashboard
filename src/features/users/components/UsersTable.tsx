/**
 * Users Table
 * Cursor-paginated user listing. Parent owns the pagination state and passes
 * `onLoadMore` / `hasNextPage` / `isFetchingNextPage` from useInfiniteUsers.
 */

import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Users as UsersIcon, Loader2, Copy } from 'lucide-react';
import { useDateLocale } from '@/lib/dateConfig';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { Avatar } from '@/components/ui/Avatar';
import { PhoneNumber } from '@/components/ui/PhoneNumber';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { formatPhoneNumber } from '@/features/leads/utils/formatting';
import { countryToFlag } from '@/lib/countryUtils';
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

  // Generic copy-to-clipboard handler. Mobile card view passes phone in;
  // desktop table cells call it directly with email or phone.
  const handleCopy = useCallback((value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(value).then(() => {
      toast.success(t('users.copied_to_clipboard'));
    }).catch(() => {
      toast.error(t('users.failed_to_copy'));
    });
  }, [t]);

  // Mobile card view still wants the formatted phone for clipboard.
  const handleCopyPhone = useCallback((phone: string, e: React.MouseEvent) => {
    handleCopy(formatPhoneNumber(phone), e);
  }, [handleCopy]);

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
      render: (_, user) => {
        // Egypt is the default audience — only flag non-EG users to reduce visual noise.
        const isNonDefault = user.country && user.country.toUpperCase() !== 'EG';
        const flag = isNonDefault ? countryToFlag(user.country) : '';
        return (
          <div className="flex items-center gap-3">
            <Avatar
              src={user.avatar_url || undefined}
              name={user.name || t('users.anonymous_user')}
              size="md"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-neutral-900 truncate">
                  {user.name || t('users.anonymous_user')}
                </span>
                {flag && (
                  <span
                    className="text-base leading-none flex-shrink-0"
                    title={user.country?.toUpperCase() ?? ''}
                    aria-label={user.country?.toUpperCase() ?? ''}
                  >
                    {flag}
                  </span>
                )}
              </div>
              {user.email && (
                <div className="flex items-center gap-1 text-xs text-neutral-500">
                  <span className="truncate">{user.email}</span>
                  <button
                    onClick={(e) => handleCopy(user.email!, e)}
                    className="p-1 -m-1 rounded hover:bg-neutral-100 transition-colors flex-shrink-0"
                    title={t('users.copy_email')}
                    aria-label={t('users.copy_email')}
                  >
                    <Copy className="w-3 h-3 text-neutral-400 hover:text-neutral-700" />
                  </button>
                </div>
              )}
              {user.o_auth_provider && (
                <div className="text-xs text-neutral-500">
                  {t('users.oauth_label')}: {user.o_auth_provider}
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'phone',
      label: t('users.table_phone'),
      sortable: false,
      render: (_, user) => {
        if (!user.phone) {
          return <div className="text-sm text-neutral-400">—</div>;
        }
        return (
          <div className="flex items-center gap-1">
            <PhoneNumber value={user.phone} />
            <button
              onClick={(e) => handleCopy(formatPhoneNumber(user.phone!), e)}
              className="p-1 -m-1 rounded hover:bg-neutral-100 transition-colors flex-shrink-0"
              title={t('users.copy_phone')}
              aria-label={t('users.copy_phone')}
            >
              <Copy className="w-3 h-3 text-neutral-400 hover:text-neutral-700" />
            </button>
          </div>
        );
      },
    },
    {
      key: 'first_agent_name',
      label: t('users.table_agent'),
      sortable: false,
      render: (_, user) => {
        const tooltipParts = [
          user.plan_name,
          user.plan_billing_interval,
          user.plan_currency,
        ].filter(Boolean);
        return (
          <div className="max-w-[220px]">
            <div className="text-sm text-neutral-900 truncate">
              {user.first_agent_name ?? <span className="text-neutral-400">—</span>}
            </div>
            {user.plan_code ? (
              <div
                className="text-xs text-neutral-500 capitalize truncate"
                title={tooltipParts.join(' · ')}
              >
                {user.plan_code}
              </div>
            ) : (
              <div className="text-xs text-neutral-400">{t('users.no_plan')}</div>
            )}
          </div>
        );
      },
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
  ], [t, format, handleCopy]);

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
