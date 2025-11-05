/**
 * User Profile Dropdown Component
 * Displays user avatar with dropdown menu in top bar
 * Features: Profile info, settings link, logout
 */

import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Settings, LogOut, ChevronDown } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { authService } from '@/features/auth/services/authService';
import { cn } from '@/lib/utils';

export const UserProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const user = useAuthStore((state) => state.user);

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
    await authService.logout();
    window.location.href = '/login';
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
        <Avatar
          name={user?.name || 'User'}
          src={user?.avatarUrl}
          size="sm"
        />
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
            <div className="flex items-center gap-3">
              <Avatar
                name={user?.name || 'User'}
                src={user?.avatarUrl}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-950 truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-neutral-600 truncate">
                  {user?.email || ''}
                </p>
              </div>
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
              <span>Settings</span>
            </Link>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 hover:bg-error/10 hover:text-error transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
