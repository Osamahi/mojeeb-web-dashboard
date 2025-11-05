/**
 * Mojeeb Minimal Sidebar Component
 * Responsive navigation sidebar with brand cyan accents
 * Features:
 * - Mobile: Drawer with overlay (slides from left)
 * - Desktop: Hover to expand (collapsed by default to 80px, expands to 256px on hover)
 * - Smooth Framer Motion animations
 * - Auto-close on mobile navigation
 */

import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
import { useUIStore } from '@/stores/uiStore';
import { useIsDesktop } from '@/hooks/useMediaQuery';
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
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const isDesktop = useIsDesktop();

  const {
    isSidebarOpen,
    isSidebarCollapsed,
    setSidebarOpen,
    setSidebarCollapsed,
    closeSidebarOnMobile,
  } = useUIStore();

  // Auto-close sidebar on mobile when navigating
  useEffect(() => {
    closeSidebarOnMobile();
  }, [location.pathname, closeSidebarOnMobile]);

  const handleLogout = async () => {
    await authService.logout();
    window.location.href = '/login';
  };

  // Desktop hover handlers - expand on hover, collapse on leave
  const handleMouseEnter = () => {
    if (isDesktop) {
      setSidebarCollapsed(false);
    }
  };

  const handleMouseLeave = () => {
    if (isDesktop) {
      setSidebarCollapsed(true);
    }
  };

  // Desktop: Always visible (hover to expand/collapse)
  // Mobile: Drawer pattern (can be opened/closed)
  const shouldShow = isDesktop || isSidebarOpen;

  // Determine sidebar width based on collapse state
  const sidebarWidth = isDesktop && isSidebarCollapsed ? 80 : 256;

  return (
    <>
      {/* Mobile Overlay Backdrop */}
      <AnimatePresence>
        {!isDesktop && isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {shouldShow && (
          <motion.aside
            initial={{ x: isDesktop ? 0 : -256 }}
            animate={{
              x: 0,
              width: sidebarWidth,
            }}
            exit={{ x: -256 }}
            transition={{
              type: 'tween',
              duration: 0.2,
              ease: [0.16, 1, 0.3, 1],
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={cn(
              'h-screen bg-neutral-50 border-r border-neutral-200 flex flex-col',
              'fixed md:relative z-50',
              isDesktop && isSidebarCollapsed && 'items-center'
            )}
            style={{ width: `${sidebarWidth}px` }}
          >
            {/* Logo Section */}
            <div className={cn(
              'p-6 border-b border-neutral-200',
              'flex items-center',
              isDesktop && isSidebarCollapsed ? 'justify-center bg-transparent' : 'justify-start bg-white'
            )}>
              {(!isDesktop || !isSidebarCollapsed) && (
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
              )}

              {isDesktop && isSidebarCollapsed && (
                <img
                  src="/mojeeb-icon.png"
                  alt="Mojeeb"
                  className="w-10 h-10"
                  title="Mojeeb"
                />
              )}
            </div>

            {/* Navigation */}
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
                        // Active state - only color change, no bg or border
                        isActive
                          ? 'text-brand-cyan font-medium'  // Just cyan color
                          // Inactive state - different hover based on collapsed state
                          : isSidebarCollapsed
                          ? 'text-neutral-700 hover:text-brand-cyan'  // Collapsed: color change only
                          : 'text-neutral-700 hover:text-neutral-950',  // Expanded: color change only
                        isDesktop && isSidebarCollapsed && 'justify-center px-0'
                      )
                    }
                    title={isDesktop && isSidebarCollapsed ? item.name : undefined}
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon
                          className={cn(
                            'w-5 h-5',
                            isActive ? 'text-brand-cyan' : 'text-neutral-600'
                          )}
                        />
                        {(!isDesktop || !isSidebarCollapsed) && (
                          <span className="text-sm">{item.name}</span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
            </nav>

            {/* User Profile & Logout */}
            <div className={cn(
              'p-4 border-t border-neutral-200',
              isDesktop && isSidebarCollapsed ? 'flex flex-col items-center bg-transparent' : 'bg-white'
            )}>
              {(!isDesktop || !isSidebarCollapsed) && (
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
              )}

              {isDesktop && isSidebarCollapsed && (
                <div className="mb-3">
                  <Avatar
                    name={user?.name || 'User'}
                    src={user?.avatarUrl}
                    size="md"
                  />
                </div>
              )}

              <button
                onClick={handleLogout}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 rounded-md transition-colors',
                  'text-neutral-700 hover:bg-error/10 hover:text-error',
                  isDesktop && isSidebarCollapsed ? 'w-auto px-2.5' : 'w-full'
                )}
                title={isDesktop && isSidebarCollapsed ? 'Logout' : undefined}
              >
                <LogOut className="w-5 h-5" />
                {(!isDesktop || !isSidebarCollapsed) && (
                  <span className="text-sm font-medium">Logout</span>
                )}
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};
