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
import { AppLogo } from '@/components/ui/AppLogo';
import GlobalAgentSelector from '@/features/agents/components/GlobalAgentSelector';
import { ProfileDropdown } from './ProfileDropdown';
import { HeaderContainer } from './HeaderContainer';

export const Header = () => {
  const { t } = useTranslation();
  const { isSidebarOpen, toggleSidebar } = useUIStore();
  const isMobile = useIsMobile();
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);

  return (
    <HeaderContainer className="justify-between">
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
        <AppLogo />
      </div>

      {/* End Side: Agent Selector + Profile */}
      <div className="ms-auto flex items-center gap-3">
        <GlobalAgentSelector />
        <ProfileDropdown user={user} onLogout={logout} />
      </div>
    </HeaderContainer>
  );
};
