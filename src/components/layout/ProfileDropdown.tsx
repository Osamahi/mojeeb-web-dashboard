/**
 * Profile Dropdown Component
 * Displays user profile picture in header with dropdown menu
 * Contains: user info, upgrade link (free plan), and logout
 */

import { useState } from 'react';
import { LogOut, Rocket, User as UserIcon, CreditCard, Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
import { changeLanguageAsync } from '@/i18n/config';
import type { Locale } from '@/i18n/locales';

interface ProfileDropdownProps {
  user: User | null;
  onLogout: () => void | Promise<void>;
}

export const ProfileDropdown = ({ user, onLogout }: ProfileDropdownProps) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);
  const { t, i18n } = useTranslation();

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

  const toggleLanguage = async () => {
    if (isChangingLanguage) return; // Prevent multiple clicks

    const currentLang = i18n.language;
    const newLang = currentLang.startsWith('ar') ? 'en' : 'ar-SA';

    setIsChangingLanguage(true);
    try {
      await changeLanguageAsync(newLang as Locale);
    } catch (error) {
      console.error('[ProfileDropdown] Failed to change language:', error);
      // Language change failed, but we'll silently fail to avoid disrupting UX
    } finally {
      setIsChangingLanguage(false);
    }
  };

  const getLanguageLabel = () => {
    return i18n.language.startsWith('ar') ? 'English' : 'العربية';
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
            {user?.name || t('profile.user_fallback')}
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
              <Rocket className="w-4 h-4 me-2" />
              <span className="font-medium">{t('profile.upgrade_plan')}</span>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => window.location.href = '/my-subscription'}
              className="text-neutral-700 hover:text-neutral-900"
            >
              <CreditCard className="w-4 h-4 me-2" />
              <span>{t('profile.manage_subscription')}</span>
            </DropdownMenuItem>
          )
        )}

        {/* Language Switcher */}
        <DropdownMenuItem
          onClick={toggleLanguage}
          disabled={isChangingLanguage}
          className={cn(
            'text-neutral-700 hover:text-neutral-900',
            isChangingLanguage && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Languages className="w-4 h-4 me-2" />
          <span>{getLanguageLabel()}</span>
          {isChangingLanguage && (
            <span className="ms-auto">
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            </span>
          )}
        </DropdownMenuItem>

        {/* Logout */}
        <DropdownMenuItem
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={cn(
            'text-neutral-700 hover:text-red-600 hover:bg-red-50',
            isLoggingOut && 'opacity-50 cursor-not-allowed'
          )}
        >
          <LogOut className={cn('w-4 h-4 me-2', isLoggingOut && 'animate-spin')} />
          <span>{isLoggingOut ? t('profile.logging_out') : t('profile.logout')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
