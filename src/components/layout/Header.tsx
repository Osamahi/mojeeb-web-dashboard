/**
 * Unified Header Component
 * Fixed header for all devices with logo, agent selector, and profile
 * Hamburger menu only visible on mobile
 */

import { Menu, X } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useAuthStore } from '@/features/auth/stores/authStore';
import GlobalAgentSelector from '@/features/agents/components/GlobalAgentSelector';
import { ProfileDropdown } from './ProfileDropdown';

export const Header = () => {
  const { isSidebarOpen, toggleSidebar } = useUIStore();
  const isMobile = useIsMobile();
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-4 z-30">
      {/* Hamburger / Close Button - Mobile Only */}
      {isMobile && (
        <button
          onClick={toggleSidebar}
          className="p-2 -ml-2 rounded-md hover:bg-neutral-100 transition-colors"
          aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isSidebarOpen}
        >
          {isSidebarOpen ? (
            <X className="w-6 h-6 text-neutral-950" />
          ) : (
            <Menu className="w-6 h-6 text-neutral-950" />
          )}
        </button>
      )}

      {/* Mojeeb Logo */}
      <div className={`flex items-center ${isMobile ? 'ml-4' : ''}`}>
        <img
          src="/mojeeb-logo.png"
          alt="Mojeeb"
          className="h-5"
        />
      </div>

      {/* Right Side: Agent Selector + Profile */}
      <div className="ml-auto flex items-center gap-3">
        <GlobalAgentSelector />
        <ProfileDropdown user={user} onLogout={logout} />
      </div>
    </header>
  );
};
