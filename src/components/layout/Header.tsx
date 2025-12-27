/**
 * Unified Header Component
 * Fixed header for all devices with logo, agent selector, and profile
 * Hamburger menu only visible on mobile
 */

import { Menu, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/stores/uiStore';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useAuthStore } from '@/features/auth/stores/authStore';
import GlobalAgentSelector from '@/features/agents/components/GlobalAgentSelector';
import { ProfileDropdown } from './ProfileDropdown';

export const Header = () => {
  const { t } = useTranslation();
  const { isSidebarOpen, toggleSidebar } = useUIStore();
  const isMobile = useIsMobile();
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);

  return (
    <header className="fixed top-0 start-0 end-0 h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-4 z-30">
      {/* Hamburger / Close Button - Mobile Only */}
      {isMobile && (
        <button
          onClick={toggleSidebar}
          className="p-2 -ms-2 rounded-md hover:bg-neutral-100 transition-colors"
          aria-label={isSidebarOpen ? t('header.close_menu') : t('header.open_menu')}
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
      <div className={`flex items-center ${isMobile ? 'ms-4' : ''}`}>
        <img
          src="/mojeeb-logo.png"
          alt={t('header.logo_alt')}
          className="h-5"
        />
      </div>

      {/* End Side: Agent Selector + Profile */}
      <div className="ms-auto flex items-center gap-3">
        <GlobalAgentSelector />
        <ProfileDropdown user={user} onLogout={logout} />
      </div>
    </header>
  );
};
