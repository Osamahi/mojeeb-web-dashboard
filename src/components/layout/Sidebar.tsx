/**
 * Mojeeb Minimal Sidebar Component
 * Clean navigation sidebar with brand cyan accents
 * Features: Mojeeb gradient logo, minimal nav items, user profile
 */

import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Bot,
  Users,
  MessageSquare,
  Settings,
  LogOut,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { authService } from '@/features/auth/services/authService';
import { Role } from '@/features/auth/types/auth.types';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
  requireSuperAdmin?: boolean;
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Agents', href: '/agents', icon: Bot },
  { name: 'Users', href: '/users', icon: Users, requireSuperAdmin: true },
  { name: 'Conversations', href: '/conversations', icon: MessageSquare },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const Sidebar = () => {
  const user = useAuthStore((state) => state.user);

  const handleLogout = async () => {
    await authService.logout();
    window.location.href = '/login';
  };

  return (
    <div className="h-screen w-64 bg-neutral-50 border-r border-neutral-200 flex flex-col">
      {/* Logo - Mojeeb brand logo */}
      <div className="p-6 bg-white border-b border-neutral-200">
        <div className="flex items-center gap-3">
          <img
            src="/mojeeb-icon.png"
            alt="Mojeeb"
            className="w-10 h-10"
          />
          <div>
            <h1 className="text-lg font-bold text-neutral-950">Mojeeb</h1>
            <p className="text-xs text-neutral-600">AI Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation - Minimal with brand cyan active state */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigation
          .filter((item) => {
            // Hide SuperAdmin-only items if user is not SuperAdmin
            if (item.requireSuperAdmin && user?.role !== Role.SuperAdmin) {
              return false;
            }
            return true;
          })
          .map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-md transition-colors duration-200',
                  isActive
                    ? 'bg-white text-brand-cyan font-medium border-l-2 border-brand-cyan'
                    : 'text-neutral-700 hover:bg-white hover:text-neutral-950'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn('w-5 h-5', isActive ? 'text-brand-cyan' : 'text-neutral-600')} />
                  <span className="text-sm">{item.name}</span>
                </>
              )}
            </NavLink>
          ))}
      </nav>

      {/* User Profile & Logout - Minimal */}
      <div className="p-4 bg-white border-t border-neutral-200">
        <div className="flex items-center gap-3 mb-3 px-2">
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

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-neutral-700 hover:bg-error/10 hover:text-error transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};
