/**
 * Mojeeb Hybrid Sidebar Component
 * Features:
 * - Desktop/Tablet: Pinned icon sidebar (80px) with hover-to-expand (256px)
 * - Mobile: Hidden drawer that slides in with overlay
 * - Maintains icon position during expansion (no shifting)
 * - Full accessibility support
 * - Refactored with extracted components for maintainability
 */

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FocusTrap } from 'focus-trap-react';
import { useUIStore } from '@/stores/uiStore';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useAgentStore } from '@/features/agents/stores/agentStore';
import { Avatar } from '@/components/ui/Avatar';
import { NavigationList } from './sidebar/NavigationList';
import { UserProfileSection } from './sidebar/UserProfileSection';
import { navigation } from './sidebar/navigation.config';
import { SidebarErrorBoundary } from './sidebar/SidebarErrorBoundary';
import {
  SIDEBAR_DIMENSIONS,
  SIDEBAR_ANIMATIONS,
  SIDEBAR_Z_INDEX,
} from './sidebar/constants';

const SidebarContent = () => {
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
      // Restore focus when closed - with proper fallback
      try {
        if (previousFocusRef.current && document.contains(previousFocusRef.current)) {
          previousFocusRef.current.focus();
        } else {
          // Focus the first interactive element in main content
          const mainContent = document.querySelector('main');
          const firstFocusable = mainContent?.querySelector<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (firstFocusable) {
            firstFocusable.focus();
          }
        }
      } catch (error) {
        console.warn('Failed to restore focus:', error);
      }
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

  // Click outside to collapse sidebar on desktop when expanded
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Only handle on desktop when sidebar is expanded
      if (isMobile || isSidebarCollapsed) {
        return;
      }

      const target = event.target as Node;

      // Check if click is outside sidebar
      if (sidebarRef.current && !sidebarRef.current.contains(target)) {
        setSidebarCollapsed(true);
      }
    };

    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);

    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobile, isSidebarCollapsed, setSidebarCollapsed]);

  return (
    <>
      {/* Mobile Overlay Backdrop - Only shows on mobile when drawer is open */}
      {isMobile && (
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              role="presentation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: SIDEBAR_ANIMATIONS.OVERLAY_TRANSITION }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm cursor-pointer"
              style={{ zIndex: SIDEBAR_Z_INDEX.OVERLAY }}
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />
          )}
        </AnimatePresence>
      )}

      {/* Desktop/Tablet: Pinned Sidebar (Always Visible, Hover to Expand) */}
      {!isMobile && (
        <motion.aside
          ref={sidebarRef}
          tabIndex={-1}
          animate={{
            width: isSidebarCollapsed
              ? SIDEBAR_DIMENSIONS.COLLAPSED_WIDTH
              : SIDEBAR_DIMENSIONS.EXPANDED_WIDTH,
          }}
          transition={{
            type: 'tween',
            duration: SIDEBAR_ANIMATIONS.DESKTOP_TRANSITION,
            ease: SIDEBAR_ANIMATIONS.EASE_CURVE,
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="fixed left-0 h-[calc(100vh-64px)] bg-white border-r border-neutral-200 flex flex-col overflow-hidden"
          style={{
            top: `${SIDEBAR_DIMENSIONS.HEADER_HEIGHT}px`,
            zIndex: SIDEBAR_Z_INDEX.DESKTOP,
          }}
        >
          {/* Navigation */}
          <NavigationList
            items={navigation}
            isCollapsed={isSidebarCollapsed}
            user={user}
            currentAgent={currentAgent}
          />

          {/* User Profile Section - Desktop - Only show when expanded */}
          {!isSidebarCollapsed && <UserProfileSection user={user} onLogout={logout} />}

          {/* Small Profile Avatar - Desktop Collapsed State */}
          {isSidebarCollapsed && (
            <div className="mt-auto p-4 flex justify-center">
              <Avatar
                src={user?.avatarUrl}
                name={user?.name || 'User'}
                size="sm"
                className="cursor-pointer hover:ring-2 hover:ring-neutral-300 transition-all"
              />
            </div>
          )}
        </motion.aside>
      )}

      {/* Mobile: Drawer (Slides In/Out) */}
      {isMobile && (
        <AnimatePresence>
          {isSidebarOpen && (
            <FocusTrap
              focusTrapOptions={{
                initialFocus: false,
                allowOutsideClick: true,
                escapeDeactivates: true,
              }}
            >
              <motion.aside
                ref={sidebarRef}
                tabIndex={-1}
                initial={{ x: -SIDEBAR_DIMENSIONS.MOBILE_WIDTH }}
                animate={{ x: 0 }}
                exit={{ x: -SIDEBAR_DIMENSIONS.MOBILE_WIDTH }}
                transition={{
                  type: 'tween',
                  duration: SIDEBAR_ANIMATIONS.MOBILE_TRANSITION,
                  ease: SIDEBAR_ANIMATIONS.EASE_CURVE,
                }}
                className="fixed top-0 left-0 h-screen bg-white border-r border-neutral-200 flex flex-col overflow-y-auto"
                style={{
                  width: `${SIDEBAR_DIMENSIONS.MOBILE_WIDTH}px`,
                  zIndex: SIDEBAR_Z_INDEX.MOBILE,
                }}
              >
                {/* Logo Section - Mobile Only */}
                <div className="p-6 bg-white border-b border-neutral-200">
                  <img src="/mojeeb-logo.png" alt="Mojeeb" className="h-6" />
                </div>

                {/* Navigation - Mobile */}
                <NavigationList
                  items={navigation}
                  isCollapsed={false}
                  user={user}
                  currentAgent={currentAgent}
                />

                {/* User Profile Section - Mobile */}
                <UserProfileSection user={user} onLogout={logout} />
              </motion.aside>
            </FocusTrap>
          )}
        </AnimatePresence>
      )}
    </>
  );
};

export const Sidebar = () => {
  return (
    <SidebarErrorBoundary>
      <SidebarContent />
    </SidebarErrorBoundary>
  );
};
