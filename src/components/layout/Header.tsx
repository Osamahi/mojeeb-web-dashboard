/**
 * Unified Header Component
 * Fixed header for all devices with hamburger menu toggle, logo, and agent selector
 * Visible on all screen sizes (mobile, tablet, desktop)
 */

import { Menu, X } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import GlobalAgentSelector from '@/features/agents/components/GlobalAgentSelector';

export const Header = () => {
  const { isSidebarOpen, toggleSidebar } = useUIStore();

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-4 z-30">
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

      {/* Agent Selector - Top Right */}
      <div className="ml-auto">
        <GlobalAgentSelector />
      </div>
    </header>
  );
};
