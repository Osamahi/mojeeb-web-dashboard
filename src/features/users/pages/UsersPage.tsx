import { useQuery } from '@tanstack/react-query';
import { Users as UsersIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { userService } from '../services/userService';
import UsersTable from '../components/UsersTable';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';

export default function UsersPage() {
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
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Users</h1>
          <p className="text-neutral-600 mt-1">
            Manage and view all system users
          </p>
        </div>
      </motion.div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px] bg-white border border-neutral-200 rounded-lg">
            <div className="text-center">
              <Spinner size="lg" />
              <p className="mt-4 text-neutral-600">Loading users...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white border border-neutral-200 rounded-lg p-12">
            <EmptyState
              icon={UsersIcon}
              title="Error Loading Users"
              description={
                error instanceof Error
                  ? error.message
                  : 'Failed to load users. Please try again.'
              }
            />
          </div>
        ) : users ? (
          <UsersTable users={users} />
        ) : null}
      </motion.div>
    </div>
  );
}
