/**
 * Mobile card view for the users listing.
 * Pagination state lives in the parent (useInfiniteUsers); this component
 * just triggers `onLoadMore` on scroll and renders loading/end indicators.
 */

import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Loader2, Users as UsersIcon } from 'lucide-react';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { UserCard } from './UserCard';
import { EmptyState } from '@/components/ui/EmptyState';
import type { User } from '../types';

interface UsersMobileCardViewProps {
  users: User[];
  onCopyPhone: (phone: string, e: React.MouseEvent) => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
}

export function UsersMobileCardView({
  users,
  onCopyPhone,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: UsersMobileCardViewProps) {
  const { t } = useTranslation();

  useInfiniteScroll({
    fetchNextPage: onLoadMore,
    hasMore: hasNextPage,
    isFetching: isFetchingNextPage,
    containerSelector: '[data-users-container]',
  });

  if (!users || users.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-12">
        <EmptyState
          icon={<UsersIcon className="w-12 h-12 text-neutral-400" />}
          title={t('users.no_users_title')}
          description={t('users.no_users_description')}
        />
      </div>
    );
  }

  return (
    <div data-users-container>
      <AnimatePresence mode="wait">
        <motion.div
          key="users-mobile-cards"
          initial={{ opacity: 0.7 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0.7 }}
          transition={{ duration: 0.15 }}
          className="relative"
        >
          <div className="space-y-3">
            {users.map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02, duration: 0.2 }}
              >
                <UserCard user={user} onCopyPhone={onCopyPhone} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {isFetchingNextPage && (
        <div className="flex justify-center items-center py-8 bg-white rounded-lg border border-neutral-200 mt-4">
          <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
          <span className="ml-2 text-sm text-neutral-600">
            {t('users.loading_more')}
          </span>
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
