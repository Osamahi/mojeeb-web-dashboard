/**
 * User Profile Dropdown Component
 * Displays user dropdown menu in top bar
 * Features: Profile info, settings link, logout
 */

import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Settings, LogOut, ChevronDown, User, Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { performLogout } from '@/features/auth/services/logoutService';
import { changeLanguageAsync } from '@/i18n/config';
import { cn } from '@/lib/utils';
import type { Locale } from '@/i18n/locales';

export const UserProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const user = useAuthStore((state) => state.user);
  const { t, i18n } = useTranslation();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleLogout = async () => {
    // Use centralized logout service for consistent, secure logout
    await performLogout({
      reason: 'user-initiated',
      callBackend: true,
      redirect: true,
    });
  };

  const toggleLanguage = async () => {
    if (isChangingLanguage) return; // Prevent multiple clicks

    const currentLang = i18n.language;
    const newLang = currentLang.startsWith('ar') ? 'en' : 'ar-SA';

    setIsChangingLanguage(true);
    try {
      await changeLanguageAsync(newLang as Locale);
    } catch (error) {
      console.error('[UserProfileDropdown] Failed to change language:', error);
      // Language change failed, but we'll silently fail to avoid disrupting UX
    } finally {
      setIsChangingLanguage(false);
    }
  };

  const getLanguageLabel = () => {
    return i18n.language.startsWith('ar') ? 'English' : 'العربية';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-md transition-colors',
          'hover:bg-neutral-100',
          isOpen && 'bg-neutral-100'
        )}
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        <User className="w-5 h-5 text-neutral-600" />
        <ChevronDown className={cn(
          'w-4 h-4 text-neutral-600 transition-transform',
          isOpen && 'transform rotate-180'
        )} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-64 bg-white border border-neutral-200 rounded-lg shadow-lg z-50">
          {/* User Info Section */}
          <div className="p-4 border-b border-neutral-200">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-950 truncate">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-neutral-600 truncate">
                {user?.email || ''}
              </p>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <Link
              to="/settings"
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Settings className="w-4 h-4" />
              <span>{t('user_profile.settings')}</span>
            </Link>

            <button
              onClick={toggleLanguage}
              disabled={isChangingLanguage}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Languages className="w-4 h-4" />
              <span>{getLanguageLabel()}</span>
              {isChangingLanguage && (
                <span className="ml-auto">
                  <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                </span>
              )}
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 hover:bg-error/10 hover:text-error transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>{t('user_profile.logout')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
