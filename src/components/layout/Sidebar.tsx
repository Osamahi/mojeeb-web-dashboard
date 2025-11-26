/**
 * Mojeeb Hybrid Sidebar Component
 * Features:
 * - Desktop/Tablet: Pinned icon sidebar (80px) with hover-to-expand (256px)
 * - Mobile: Hidden drawer that slides in with overlay
 * - Maintains icon position during expansion (no shifting)
 * - Full accessibility support
 */

import { useEffect, useRef } from 'react';
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
  // { name: 'Settings', href: '/settings', icon: Settings }, // Hidden until full implementation
];

export const Sidebar = () => {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const currentAgent = useAgentStore((state) => state.globalSelectedAgent);
  const isMobile = useIsMobile();

  const {
    isSidebarOpen,
    isSidebarCollapsed,
    setSidebarOpen,
    setSidebarCollapsed,
    closeSidebarOnMobile,
  } = useUIStore();

  // Refs for focus management
  const sidebarRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Auto-close sidebar on mobile when navigating
  useEffect(() => {
    closeSidebarOnMobile();
  }, [location.pathname, closeSidebarOnMobile]);

  // Escape key handler for accessibility
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobile && isSidebarOpen) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isMobile, isSidebarOpen, setSidebarOpen]);

  // Focus management for mobile drawer
  useEffect(() => {
    if (isMobile && isSidebarOpen) {
      // Store previous focus
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Move focus to sidebar
      sidebarRef.current?.focus();
    } else if (isMobile && !isSidebarOpen && previousFocusRef.current) {
      // Restore focus when closed
      previousFocusRef.current.focus();
    }
  }, [isMobile, isSidebarOpen]);

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

  // Logout handler
  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  // Dynamic width for desktop
  const sidebarWidth = isSidebarCollapsed ? 80 : 256;

  return (
    <>
      {/* Mobile Overlay Backdrop - Only shows on mobile when drawer is open */}
      {isMobile && (
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 cursor-default"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
              tabIndex={0}
            />
          )}
        </AnimatePresence>
      )}

      {/* Desktop/Tablet: Pinned Sidebar (Always Visible, Hover to Expand) */}
      {!isMobile && (
        <motion.aside
          ref={sidebarRef}
          tabIndex={-1}
          animate={{ width: sidebarWidth }}
          transition={{
            type: 'tween',
            duration: 0.25,
            ease: [0.16, 1, 0.3, 1],
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="fixed top-16 left-0 h-[calc(100vh-64px)] bg-neutral-50 border-r border-neutral-200 flex flex-col z-30 overflow-hidden"
        >
          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-4 space-y-2">
            {navigation
              .filter((item) => {
                // Hide SuperAdmin-only items if user is not SuperAdmin
                if (item.requireSuperAdmin && user?.role !== Role.SuperAdmin) {
                  return false;
                }
                return true;
              })
              .map((item) => {
                const isDisabled = item.name === 'Studio' && !currentAgent;

                if (isDisabled) {
                  return (
                    <div
                      key={item.name}
                      className="flex items-center rounded-md text-neutral-400 cursor-not-allowed opacity-50"
                      title="Select an agent to access Studio"
                    >
                      <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-6 h-6" />
                      </div>
                      {/* Text label - only render when expanded */}
                      {!isSidebarCollapsed && (
                        <span className="text-sm pr-4 whitespace-nowrap">
                          {item.name}
                        </span>
                      )}
                    </div>
                  );
                }

                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center rounded-md transition-colors duration-200',
                        isActive
                          ? 'text-[#00D084] font-semibold'
                          : 'text-neutral-600 hover:text-neutral-950'
                      )
                    }
                    title={isSidebarCollapsed ? item.name : undefined}
                  >
                    {({ isActive }) => (
                      <>
                        {/* Fixed-width icon container - prevents shifting */}
                        <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
                          <item.icon
                            className={cn(
                              'w-6 h-6',
                              isActive ? 'text-[#00D084]' : 'text-neutral-600'
                            )}
                          />
                        </div>
                        {/* Text label - only render when expanded */}
                        {!isSidebarCollapsed && (
                          <span className="text-sm pr-4 whitespace-nowrap">
                            {item.name}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
          </nav>

          {/* User Profile Section - Desktop - Only show when expanded */}
          {!isSidebarCollapsed && (
            <div className="p-4 border-t border-neutral-200 bg-white">
              <div className="flex items-center gap-3 px-2 py-2">
                <div className="w-10 h-10 rounded-full bg-neutral-900 text-white flex items-center justify-center font-semibold flex-shrink-0">
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

              {/* Logout Button - Desktop */}
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

      {/* Mobile: Drawer (Slides In/Out) */}
      {isMobile && (
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.aside
              ref={sidebarRef}
              tabIndex={-1}
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
              {/* Logo Section - Mobile Only */}
              <div className="p-6 bg-white border-b border-neutral-200">
                <img
                  src="/mojeeb-logo.png"
                  alt="Mojeeb"
                  className="h-6"
                />
              </div>

              {/* Navigation - Mobile */}
              <nav className="flex-1 overflow-y-auto py-4 px-4 space-y-2">
                {navigation
                  .filter((item) => {
                    // Hide SuperAdmin-only items if user is not SuperAdmin
                    if (item.requireSuperAdmin && user?.role !== Role.SuperAdmin) {
                      return false;
                    }
                    return true;
                  })
                  .map((item) => {
                    const isDisabled = item.name === 'Studio' && !currentAgent;

                    if (isDisabled) {
                      return (
                        <div
                          key={item.name}
                          className="flex items-center rounded-md text-neutral-400 cursor-not-allowed opacity-50"
                          title="Select an agent to access Studio"
                        >
                          <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
                            <item.icon className="w-6 h-6" />
                          </div>
                          <span className="text-sm pr-4">{item.name}</span>
                        </div>
                      );
                    }

                    return (
                      <NavLink
                        key={item.name}
                        to={item.href}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center rounded-md transition-colors duration-200',
                            isActive
                              ? 'text-[#00D084] font-semibold'
                              : 'text-neutral-600 hover:text-neutral-950'
                          )
                        }
                      >
                        {({ isActive }) => (
                          <>
                            {/* Fixed-width icon container */}
                            <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
                              <item.icon
                                className={cn(
                                  'w-6 h-6',
                                  isActive ? 'text-[#00D084]' : 'text-neutral-600'
                                )}
                              />
                            </div>
                            {/* Text label - always visible on mobile */}
                            <span className="text-sm pr-4">{item.name}</span>
                          </>
                        )}
                      </NavLink>
                    );
                  })}
              </nav>

              {/* User Profile Section - Mobile */}
              <div className="p-4 border-t border-neutral-200 bg-white">
                <div className="flex items-center gap-3 px-2 py-2">
                  <div className="w-10 h-10 rounded-full bg-neutral-900 text-white flex items-center justify-center font-semibold">
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

                {/* Logout Button - Mobile */}
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
      )}
    </>
  );
};
