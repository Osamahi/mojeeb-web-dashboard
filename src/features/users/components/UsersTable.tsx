/**
 * Users Table
 * Cursor-paginated user listing. Parent owns the pagination state and passes
 * `onLoadMore` / `hasNextPage` / `isFetchingNextPage` from useInfiniteUsers.
 */

import { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Users as UsersIcon, Loader2, Copy, MoreVertical, BarChart3 } from 'lucide-react';
import { useDateLocale } from '@/lib/dateConfig';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { Avatar } from '@/components/ui/Avatar';
import { PhoneNumber } from '@/components/ui/PhoneNumber';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { formatPhoneNumber } from '@/features/leads/utils/formatting';
import { countryToFlag } from '@/lib/countryUtils';
import { AgentLink } from '@/features/agents/components/AgentLink';
import { ViewUsageModal } from '@/features/subscriptions/components/ViewUsageModal';
import { subscriptionService } from '@/features/subscriptions/services/subscriptionService';
import type { SubscriptionDetails } from '@/features/subscriptions/types/subscription.types';
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

  // Row actions menu — mirrors SubscriptionTable's pattern.
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left?: number; right?: number } | null>(null);
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  // View Usage modal state. We hold the resolved SubscriptionDetails (not just
  // the user) so we can pass it directly to the shared ViewUsageModal — same
  // component used by AdminSubscriptionsPage. The lookup uses the existing
  // /api/admin/subscriptions search endpoint (no new backend work).
  const [usageSubscription, setUsageSubscription] = useState<SubscriptionDetails | null>(null);
  const [resolvingUserId, setResolvingUserId] = useState<string | null>(null);

  const handleMenuToggle = useCallback((userId: string) => {
    setOpenMenuId((current) => {
      if (current === userId) {
        setMenuPosition(null);
        return null;
      }
      const button = buttonRefs.current[userId];
      if (button) {
        const rect = button.getBoundingClientRect();
        const isRTL = document.documentElement.dir === 'rtl';
        setMenuPosition(
          isRTL
            ? { top: rect.bottom + 8, left: rect.left }
            : { top: rect.bottom + 8, right: window.innerWidth - rect.right }
        );
      }
      return userId;
    });
  }, []);

  const closeMenu = useCallback(() => {
    setOpenMenuId(null);
    setMenuPosition(null);
  }, []);

  // Close menu on scroll/resize so it doesn't float over the wrong row.
  useEffect(() => {
    if (!openMenuId) return;
    window.addEventListener('scroll', closeMenu, true);
    window.addEventListener('resize', closeMenu);
    return () => {
      window.removeEventListener('scroll', closeMenu, true);
      window.removeEventListener('resize', closeMenu);
    };
  }, [openMenuId, closeMenu]);

  const handleViewUsage = useCallback(async (user: User) => {
    closeMenu();
    if (!user.email) {
      toast.error(t('users.usage_no_email'));
      return;
    }

    setResolvingUserId(user.id);
    try {
      // Look up the org's subscription via the same admin endpoint
      // AdminSubscriptionsPage uses. Email match is precise; we take the first
      // hit (one user → one org → one active subscription per Phase 2 design).
      const matches = await subscriptionService.getAllSubscriptions(
        { searchTerm: user.email },
        1,
        1
      );
      const subscription = matches[0];
      if (!subscription) {
        toast.error(t('users.usage_no_subscription'));
        return;
      }
      setUsageSubscription(subscription);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[UsersTable] failed to resolve subscription for user', user.id, err);
      toast.error(t('users.usage_load_failed'));
    } finally {
      setResolvingUserId(null);
    }
  }, [t, closeMenu]);

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
      render: (_, user) => (
        <div className="max-w-[220px] text-sm truncate">
          <AgentLink
            agentId={user.first_agent_id}
            agentName={user.first_agent_name}
          />
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
    {
      key: 'actions',
      label: '',
      sortable: false,
      render: (_, user) => (
        <div className="relative text-end">
          <button
            ref={(el) => { buttonRefs.current[user.id] = el; }}
            onClick={(e) => {
              e.stopPropagation();
              handleMenuToggle(user.id);
            }}
            disabled={resolvingUserId === user.id}
            className="text-neutral-400 hover:text-neutral-600 p-1 rounded disabled:opacity-60 disabled:cursor-wait"
            aria-label={t('common.actions')}
          >
            {resolvingUserId === user.id ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <MoreVertical className="h-5 w-5" />
            )}
          </button>

          {openMenuId === user.id && menuPosition && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={closeMenu}
              />
              <div
                className="fixed z-20 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5"
                style={{
                  top: `${menuPosition.top}px`,
                  ...(menuPosition.left !== undefined ? { left: `${menuPosition.left}px` } : {}),
                  ...(menuPosition.right !== undefined ? { right: `${menuPosition.right}px` } : {}),
                }}
              >
                <div className="py-1" role="menu">
                  <button
                    onClick={() => handleViewUsage(user)}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <BarChart3 className="h-4 w-4" />
                    {t('subscriptions.view_usage')}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      ),
    },
  ], [t, format, handleCopy, openMenuId, menuPosition, handleMenuToggle, closeMenu, handleViewUsage, resolvingUserId]);

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

      {/* Reuses the same modal AdminSubscriptionsPage opens — single source of truth. */}
      {usageSubscription && (
        <ViewUsageModal
          isOpen={true}
          onClose={() => setUsageSubscription(null)}
          subscription={usageSubscription}
        />
      )}
    </div>
  );
}
