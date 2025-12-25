import { useState } from 'react';
import { LogOut, Rocket, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { User } from '@/features/auth/types/auth.types';
import { useSubscriptionStore } from '@/features/subscriptions/stores/subscriptionStore';
import { useUIStore } from '@/stores/uiStore';

interface UserProfileSectionProps {
  user: User | null;
  onLogout: () => void | Promise<void>;
}

/**
 * User Profile Section Component
 * Shows user info and logout button
 * Used in both mobile and desktop sidebars
 */
export const UserProfileSection = ({ user, onLogout }: UserProfileSectionProps) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Read subscription and usage from global store (loaded once on app init)
  const subscription = useSubscriptionStore(state => state.subscription);
  const usage = useSubscriptionStore(state => state.usage);
  const loadingSubscription = useSubscriptionStore(state => state.isLoading);

  // Use UI store for modal state (prevents loss when sidebar unmounts on mobile)
  const setShowUpgradeWizard = useUIStore(state => state.setShowUpgradeWizard);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      // authStore.logout() now handles everything including redirect via logoutService
      await onLogout();
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoggingOut(false);
    }
  };

  // Check if user is on free plan
  const isFreePlan = subscription?.planCode?.toLowerCase() === 'free';

  // Calculate message usage percentage
  const messagePercentage = usage
    ? ((usage.messagesUsed ?? 0) / (usage.messagesLimit ?? 1)) * 100
    : 0;

  return (
    <div className="mt-auto p-4 bg-white">
      <div className="flex items-center gap-3 px-2 py-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-neutral-950 truncate">
            {user?.name || 'User'}
          </p>
          <p className="text-xs text-neutral-600 truncate">{user?.email || ''}</p>
        </div>
      </div>

      {/* Message Usage Bar */}
      {!loadingSubscription && usage && (
        <div className="mt-3 px-2 pb-3">
          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-gray-200 mb-2">
            <div
              className="h-full bg-green-600 transition-all duration-300"
              style={{ width: `${Math.min(messagePercentage, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-neutral-500" />
              <span className="text-sm font-medium text-neutral-700">
                {(usage.messagesUsed ?? 0).toLocaleString()}/{(usage.messagesLimit ?? 0).toLocaleString()}
              </span>
            </div>
            {/* Upgrade link - Only show for free plan users */}
            {isFreePlan && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowUpgradeWizard(true);
                }}
                className="text-sm font-medium text-green-600 hover:text-green-700 transition-colors"
              >
                Upgrade
              </button>
            )}
          </div>
        </div>
      )}

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className={cn(
          'mt-3 w-full flex items-center gap-2 px-4 py-2.5 text-sm rounded-md transition-colors duration-200',
          isLoggingOut
            ? 'text-neutral-400 cursor-not-allowed bg-neutral-100'
            : 'text-neutral-700 hover:text-red-600 hover:bg-red-50'
        )}
        aria-label={isLoggingOut ? 'Logging out...' : 'Logout'}
      >
        <LogOut
          className={cn('w-4 h-4', isLoggingOut && 'animate-spin')}
          aria-hidden="true"
        />
        <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
      </button>
    </div>
  );
};
