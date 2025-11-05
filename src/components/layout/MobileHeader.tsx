/**
 * Mobile Header Component
 * Fixed header for mobile devices with hamburger menu toggle
 * Only visible on screens < 768px
 */

import { Menu, X } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useIsMobile } from '@/hooks/useMediaQuery';

export const MobileHeader = () => {
  const isMobile = useIsMobile();
  const { isSidebarOpen, toggleSidebar } = useUIStore();

  // Only render on mobile
  if (!isMobile) return null;

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-neutral-200 flex items-center px-4 z-30 md:hidden">
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
      <div className="flex items-center gap-2 ml-4">
        <img
          src="/mojeeb-icon.png"
          alt="Mojeeb"
          className="w-8 h-8"
        />
        <h1 className="text-lg font-bold text-neutral-950">Mojeeb</h1>
      </div>
    </header>
  );
};
