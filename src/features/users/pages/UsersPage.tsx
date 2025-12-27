import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Users as UsersIcon } from 'lucide-react';
import { userService } from '../services/userService';
import UsersTable from '../components/UsersTable';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { BaseHeader } from '@/components/ui/BaseHeader';

export default function UsersPage() {
  const { t } = useTranslation();
  const {
    data: users,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getUsers(),
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <BaseHeader
        title={t('users.title')}
        subtitle={t('users.subtitle')}
      />

      {/* Users Table */}
      <div>
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px] bg-white border border-neutral-200 rounded-lg">
            <div className="text-center">
              <Spinner size="lg" />
              <p className="mt-4 text-neutral-600">{t('users.loading')}</p>
            </div>
          </div>
        ) : error ? (
          <EmptyState
            icon={UsersIcon}
            title={t('users.error_title')}
            description={
              error instanceof Error
                ? error.message
                : t('users.error_description')
            }
          />
        ) : users ? (
          <UsersTable users={users} />
        ) : null}
      </div>
    </div>
  );
}
