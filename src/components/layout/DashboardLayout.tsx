import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileHeader } from './MobileHeader';
import { UserProfileDropdown } from './UserProfileDropdown';
import GlobalAgentSelector from '@/features/agents/components/GlobalAgentSelector';
import { useAgentDataReload } from '@/features/agents/hooks/useAgentDataReload';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';

export const DashboardLayout = () => {
  const reloadAgentData = useAgentDataReload();
  const isMobile = useIsMobile();

  return (
    <>
      {/* Mobile Header - Only visible on mobile */}
      <MobileHeader />

      {/* Full-Width Top Bar - Supabase Style (Desktop/Tablet only) */}
      {!isMobile && (
        <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-neutral-200 z-50">
          <div className="flex items-center justify-between h-full px-4">
            {/* Left: Logo */}
            <div className="flex items-center min-w-[200px]">
              <img
                src="/mojeeb-logo.png"
                alt="Mojeeb"
                className="h-5"
              />
            </div>

            {/* Center: Agent Selector */}
            <div className="flex-1 flex items-center justify-center max-w-md">
              <GlobalAgentSelector onAgentSwitch={reloadAgentData} />
            </div>

            {/* Right: User Profile */}
            <div className="flex items-center gap-3 min-w-[200px] justify-end">
              <UserProfileDropdown />
            </div>
          </div>
        </header>
      )}

      {/* Main Layout Container */}
      <div className="h-screen overflow-hidden bg-neutral-50">
        {/* Sidebar - Below top bar on desktop, drawer on mobile */}
        <Sidebar />

        {/* Main Content Area */}
        <main className={cn(
          'h-full overflow-y-auto',
          isMobile ? 'pt-16' : 'pt-16 pl-20',  // Mobile: header padding, Desktop: top bar + sidebar padding
        )}>
          <Outlet />
        </main>
      </div>
    </>
  );
};
