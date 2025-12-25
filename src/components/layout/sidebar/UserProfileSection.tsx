import { useState, useCallback } from 'react';
import { LogOut, Rocket } from 'lucide-react';
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

  // Read subscription from global store (loaded once on app init)
  const subscription = useSubscriptionStore(state => state.subscription);
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

      {/* Upgrade Plan Button - Only show for free plan users */}
      {!loadingSubscription && isFreePlan && (
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent event bubbling
            setShowUpgradeWizard(true);
          }}
          className="mt-3 w-full px-4 h-10 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 transition-colors flex items-center gap-2"
          title="Upgrade Plan"
        >
          <Rocket className="w-4 h-4 text-neutral-700" />
          <span className="text-sm font-medium text-neutral-900">Upgrade Plan</span>
        </button>
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
