/**
 * UsersMobileCardView Component
 * Mobile card-based view for users list
 * Includes infinite scroll, loading states, and empty states
 */

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Loader2, Users as UsersIcon } from 'lucide-react';
import { UserCard } from './UserCard';
import { EmptyState } from '@/components/ui/EmptyState';
import type { User } from '../types';

interface UsersMobileCardViewProps {
  users: User[];
  onCopyPhone: (phone: string, e: React.MouseEvent) => void;
}

export function UsersMobileCardView({
  users,
  onCopyPhone,
}: UsersMobileCardViewProps) {
  const { t } = useTranslation();

  // Infinite scroll state
  const [displayCount, setDisplayCount] = useState(50);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Displayed users with infinite scroll
  const displayedUsers = users.slice(0, displayCount);

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // Load more when scrolled to 80% of the way down
      if (scrollTop + windowHeight >= documentHeight * 0.8) {
        if (!isLoadingMore && displayCount < users.length) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setDisplayCount((prev) => Math.min(prev + 50, users.length));
            setIsLoadingMore(false);
          }, 300);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [displayCount, users.length, isLoadingMore]);

  // Empty state
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
    <>
      {/* Cards with smooth transition */}
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
            {displayedUsers.map((user, index) => (
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

      {/* Loading More Indicator */}
      {isLoadingMore && (
        <div className="flex justify-center items-center py-8 bg-white rounded-lg border border-neutral-200 mt-4">
          <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
          <span className="ml-2 text-sm text-neutral-600">
            {t('users.loading_more')}
          </span>
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
