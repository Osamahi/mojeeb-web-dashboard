/**
 * Mobile Header Component
 * Fixed header for mobile devices with hamburger menu toggle
 * Only visible on screens < 768px
 */

import { Menu, X } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useIsMobile } from '@/hooks/useMediaQuery';
import GlobalAgentSelector from '@/features/agents/components/GlobalAgentSelector';
import { useAgentDataReload } from '@/features/agents/hooks/useAgentDataReload';

export const MobileHeader = () => {
  const isMobile = useIsMobile();
  const { isSidebarOpen, toggleSidebar } = useUIStore();
  const reloadAgentData = useAgentDataReload();

  // Only render on mobile
  if (!isMobile) return null;

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-4 z-30 md:hidden">
      {/* Hamburger / Close Button */}
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

      {/* Mojeeb Logo */}
      <div className="flex items-center ml-4">
        <img
          src="/mojeeb-logo.png"
          alt="Mojeeb"
          className="h-5"
        />
      </div>

      {/* Agent Selector */}
      <div className="ml-auto">
        <GlobalAgentSelector onAgentSwitch={reloadAgentData} />
      </div>
    </header>
  );
};
