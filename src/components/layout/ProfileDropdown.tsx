/**
 * Profile Dropdown Component
 * Displays user profile picture in header with dropdown menu
 * Contains: user info, upgrade link (free plan), and logout
 */

import { useState } from 'react';
import { LogOut, Rocket, User as UserIcon, CreditCard } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { User } from '@/features/auth/types/auth.types';
import { useSubscriptionStore } from '@/features/subscriptions/stores/subscriptionStore';
import { useUIStore } from '@/stores/uiStore';

interface ProfileDropdownProps {
  user: User | null;
  onLogout: () => void | Promise<void>;
}

export const ProfileDropdown = ({ user, onLogout }: ProfileDropdownProps) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Read subscription from global store
  const subscription = useSubscriptionStore(state => state.subscription);
  const loadingSubscription = useSubscriptionStore(state => state.isLoading);

  // Use UI store for modal state
  const setShowUpgradeWizard = useUIStore(state => state.setShowUpgradeWizard);

  // Check if user is on free plan
  const isFreePlan = subscription?.planCode?.toLowerCase() === 'free';

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await onLogout();
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoggingOut(false);
    }
  };

  const handleUpgrade = () => {
    setShowUpgradeWizard(true);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center cursor-pointer overflow-hidden">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name || 'User'}
              className="w-full h-full object-cover"
            />
          ) : (
            <UserIcon className="w-4 h-4 text-neutral-600" />
          )}
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[220px]">
        {/* User Info Header - Non-clickable */}
        <div className="px-2 py-2 border-b border-neutral-100">
          <p className="text-sm font-medium text-neutral-950 truncate">
            {user?.name || 'User'}
          </p>
          <p className="text-xs text-neutral-500 truncate mt-0.5">
            {user?.email || ''}
          </p>
        </div>

        {/* Subscription Management Link */}
        {!loadingSubscription && (
          isFreePlan ? (
            <DropdownMenuItem
              onClick={handleUpgrade}
              className="text-green-600 hover:text-green-700 hover:bg-green-50"
            >
              <Rocket className="w-4 h-4 mr-2" />
              <span className="font-medium">Upgrade Plan</span>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => window.location.href = '/my-subscription'}
              className="text-neutral-700 hover:text-neutral-900"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              <span>Manage Subscription</span>
            </DropdownMenuItem>
          )
        )}

        {/* Logout */}
        <DropdownMenuItem
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={cn(
            'text-neutral-700 hover:text-red-600 hover:bg-red-50',
            isLoggingOut && 'opacity-50 cursor-not-allowed'
          )}
        >
          <LogOut className={cn('w-4 h-4 mr-2', isLoggingOut && 'animate-spin')} />
          <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
