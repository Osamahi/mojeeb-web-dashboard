import { useRef, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { Sidebar } from './Sidebar';
import { MobileHeader } from './MobileHeader';
import { UserProfileDropdown } from './UserProfileDropdown';
import GlobalAgentSelector from '@/features/agents/components/GlobalAgentSelector';
import { agentService } from '@/features/agents/services/agentService';
import { useAgentStore } from '@/features/agents/stores/agentStore';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { queryKeys } from '@/lib/queryKeys';
import { cn } from '@/lib/utils';

export const DashboardLayout = () => {
  const isMobile = useIsMobile();
  const { setAgents, initializeAgentSelection } = useAgentStore();
  const hasInitialized = useRef(false);

  // Fetch agents on mount - critical for GlobalAgentSelector to work on refresh
  const { data: agents, isLoading } = useQuery({
    queryKey: queryKeys.agents(),
    queryFn: () => agentService.getAgents(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: AxiosError) => {
      // Don't retry on authentication errors (401, 403)
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      // Don't retry on rate limiting
      if (error?.response?.status === 429) {
        return false;
      }
      // Retry other errors up to 2 times
      return failureCount < 2;
    },
  });

  // Sync agents to store whenever data changes, initialize selection ONCE
  useEffect(() => {
    if (!isLoading && agents) {
      setAgents(agents);  // Always sync agents to store
      if (!hasInitialized.current) {
        initializeAgentSelection();  // Only initialize selection once
        hasInitialized.current = true;
      }
    }
    // Zustand functions are stable - no need in dependency array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, agents]);

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
              <GlobalAgentSelector />
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
