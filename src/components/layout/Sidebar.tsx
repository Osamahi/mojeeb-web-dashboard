/**
 * Mojeeb Minimal Sidebar Component - Supabase Style
 * Icon-only navigation sidebar
 * Features:
 * - Mobile: Drawer with overlay (slides from left)
 * - Desktop/Tablet: Fixed icon-only sidebar (80px width, always visible)
 * - No hover-to-expand behavior
 * - Positioned below top bar on desktop
 */

import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Users,
  UserCog,
  MessageSquare,
  Settings,
  Sliders,
  Link2,
  LogOut,
} from 'lucide-react';
import { Role } from '@/features/auth/types/auth.types';
import { useUIStore } from '@/stores/uiStore';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useAgentStore } from '@/features/agents/stores/agentStore';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
  requireSuperAdmin?: boolean;
}

const navigation: NavigationItem[] = [
  { name: 'Conversations', href: '/conversations', icon: MessageSquare },
  { name: 'Agents', href: '/agents', icon: Bot },
  { name: 'Studio', href: '/studio', icon: Sliders },
  { name: 'Team', href: '/team', icon: UserCog },
  { name: 'Connections', href: '/connections', icon: Link2 },
  { name: 'Users', href: '/users', icon: Users, requireSuperAdmin: true },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const Sidebar = () => {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const currentAgent = useAgentStore((state) => state.globalSelectedAgent);
  const isMobile = useIsMobile();

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

  // Hover handlers for desktop/tablet
  const handleMouseEnter = () => {
    if (!isMobile) {
      setSidebarCollapsed(false);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setSidebarCollapsed(true);
    }
  };

  // Desktop/Tablet: Always visible, expand on hover
  // Mobile: Drawer pattern
  const shouldShow = !isMobile || isSidebarOpen;

  // Dynamic width: 80px collapsed, 256px expanded (desktop), 256px (mobile)
  const sidebarWidth = isMobile ? 256 : (isSidebarCollapsed ? 80 : 256);

  // Logout handler
  const handleLogout = () => {
    // Clear local state immediately
    useAuthStore.getState().logout();

    // Redirect to login
    window.location.href = '/login';
  };

  return (
    <>
      {/* Mobile Overlay Backdrop */}
      <AnimatePresence>
        {isMobile && isSidebarOpen && (
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
            initial={{ x: isMobile ? -256 : 0, width: sidebarWidth }}
            animate={{ x: 0, width: sidebarWidth }}
            exit={{ x: -256 }}
            transition={{
              type: 'tween',
              duration: 0.2,
              ease: [0.16, 1, 0.3, 1],
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={cn(
              'bg-neutral-50 border-r border-neutral-200 flex flex-col',
              'fixed z-40',
              isMobile
                ? 'top-0 h-screen'  // Mobile: full height, from top
                : 'top-16 h-[calc(100vh-64px)]'  // Desktop: below top bar
            )}
          >
            {/* Logo Section - Mobile Only */}
            {isMobile && (
              <div className="p-6 bg-white border-b border-neutral-200">
                <img
                  src="/mojeeb-logo.png"
                  alt="Mojeeb"
                  className="h-6"
                />
              </div>
            )}

            {/* Navigation Icons */}
            <nav className={cn(
              'flex-1 overflow-y-auto',
              isMobile || !isSidebarCollapsed ? 'p-4 space-y-1' : 'py-4 flex flex-col items-center space-y-2'
            )}>
              {navigation
                .filter((item) => {
                  // Hide SuperAdmin-only items if user is not SuperAdmin
                  if (item.requireSuperAdmin && user?.role !== Role.SuperAdmin) {
                    return false;
                  }
                  // Hide Studio if no current agent selected
                  if (item.name === 'Studio' && !currentAgent) {
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
                        'flex items-center transition-colors duration-200',
                        isMobile || !isSidebarCollapsed
                          ? 'gap-3 px-4 py-3 rounded-md w-full'  // Expanded: full width with text
                          : 'justify-center w-12 h-12 rounded-md',  // Collapsed: icon-only, square
                        isActive
                          ? 'text-brand-cyan font-medium'
                          : 'text-neutral-700 hover:text-brand-cyan'
                      )
                    }
                    title={!isMobile && isSidebarCollapsed ? item.name : undefined}  // Tooltip when collapsed
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon
                          className={cn(
                            'w-6 h-6 flex-shrink-0',
                            isActive ? 'text-brand-cyan' : 'text-neutral-600'
                          )}
                        />
                        {(isMobile || !isSidebarCollapsed) && (
                          <span className="text-sm">{item.name}</span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
            </nav>

            {/* User Profile - Mobile Only (moved to top bar on desktop) */}
            {isMobile && (
              <div className="p-4 border-t border-neutral-200 bg-white">
                <div className="flex items-center gap-3 px-2 py-2">
                  <div className="w-10 h-10 rounded-full bg-brand-cyan text-white flex items-center justify-center font-semibold">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-950 truncate">
                      {user?.name || 'User'}
                    </p>
                    <p className="text-xs text-neutral-600 truncate">
                      {user?.email || ''}
                    </p>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="mt-3 w-full flex items-center gap-2 px-4 py-2.5 text-sm text-neutral-700 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors duration-200"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};
