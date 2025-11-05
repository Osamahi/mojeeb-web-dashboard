import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileHeader } from './MobileHeader';
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

      {/* Main Layout Container */}
      <div className="h-screen overflow-hidden bg-neutral-50">
        {/* Sidebar - Fixed overlay */}
        <Sidebar />

        {/* Main Content Area - Full width, sidebar overlays on top */}
        <div className={cn(
          'h-full flex flex-col overflow-hidden',
          isMobile ? 'pt-14' : 'pl-20',  // Mobile: top padding for header, Desktop/Tablet: left padding for collapsed sidebar (80px = pl-20)
        )}>
          {/* Top Navigation Bar with Agent Selector - Desktop only */}
          <header className="bg-white border-b border-neutral-200 px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Left side - could add breadcrumbs or page title here */}
              <div className="flex-1" />

              {/* Right side - Global Agent Selector */}
              <GlobalAgentSelector onAgentSwitch={reloadAgentData} />
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
};
