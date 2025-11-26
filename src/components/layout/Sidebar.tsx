/**
 * Mojeeb Unified Sidebar Component
 * Drawer-style navigation sidebar for all screen sizes
 * Features:
 * - Drawer with overlay (slides from left)
 * - Full-width sidebar (256px) with icon + label navigation
 * - User profile section at bottom
 * - Same behavior on mobile, tablet, and desktop
 */

import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Users,
  UserCog,
  MessageSquare,
  Sliders,
  Link2,
  LogOut,
} from 'lucide-react';
import { Role } from '@/features/auth/types/auth.types';
import { useUIStore } from '@/stores/uiStore';
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
  // { name: 'Settings', href: '/settings', icon: Settings }, // Hidden until full implementation
];

export const Sidebar = () => {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const currentAgent = useAgentStore((state) => state.globalSelectedAgent);

  const {
    isSidebarOpen,
    setSidebarOpen,
    closeSidebarOnMobile,
  } = useUIStore();

  // Auto-close sidebar on mobile when navigating
  useEffect(() => {
    closeSidebarOnMobile();
  }, [location.pathname, closeSidebarOnMobile]);

  // Logout handler
  const handleLogout = () => {
    // Clear local state immediately
    useAuthStore.getState().logout();

    // Redirect to login
    window.location.href = '/login';
  };

  return (
    <>
      {/* Overlay Backdrop - Shows when drawer is open */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Drawer */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -256 }}
            animate={{ x: 0 }}
            exit={{ x: -256 }}
            transition={{
              type: 'tween',
              duration: 0.2,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="fixed top-0 left-0 w-64 h-screen bg-neutral-50 border-r border-neutral-200 flex flex-col z-50"
          >
            {/* Logo Section */}
            <div className="p-6 bg-white border-b border-neutral-200">
              <img
                src="/mojeeb-logo.png"
                alt="Mojeeb"
                className="h-6"
              />
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-4 space-y-2">
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
                        'flex items-center rounded-md transition-colors duration-200',
                        isActive
                          ? 'text-brand-cyan font-medium'
                          : 'text-neutral-700 hover:text-brand-cyan'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {/* Icon */}
                        <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
                          <item.icon
                            className={cn(
                              'w-6 h-6',
                              isActive ? 'text-brand-cyan' : 'text-neutral-600'
                            )}
                          />
                        </div>
                        {/* Label - Always visible */}
                        <span className="text-sm pr-4">
                          {item.name}
                        </span>
                      </>
                    )}
                  </NavLink>
                ))}
            </nav>

            {/* User Profile Section - Always visible at bottom */}
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
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};
