import { useRef, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { OnboardingPromptBanner } from './OnboardingPromptBanner';
import { PhoneCollectionModal } from '@/features/auth/components/PhoneCollectionModal';
import { agentService } from '@/features/agents/services/agentService';
import { useAgentStore } from '@/features/agents/stores/agentStore';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useConversationStore } from '@/features/conversations/stores/conversationStore';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { sessionHelper } from '@/lib/sessionHelper';
import { queryKeys } from '@/lib/queryKeys';

export const DashboardLayout = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const selectedConversation = useConversationStore((state) => state.selectedConversation);
  const { setAgents, initializeAgentSelection } = useAgentStore();
  const { user } = useAuthStore();
  const hasInitialized = useRef(false);
  const hasProcessedPhoneCheck = useRef<string | null>(null); // Track which user we've processed
  const [showPhoneModal, setShowPhoneModal] = useState(false);

  // Determine if header should be hidden
  // Hide on mobile when on conversations page AND a conversation is selected
  const shouldHideHeader = isMobile && location.pathname === '/conversations' && selectedConversation !== null;

  // Auto-show phone modal if user has no phone and hasn't seen it this session
  useEffect(() => {
    // If no user, reset processing and return
    if (!user) {
      hasProcessedPhoneCheck.current = null;
      return;
    }

    // If we've already processed this user, skip
    if (hasProcessedPhoneCheck.current === user.id) {
      return;
    }

    const hasPhone = Boolean(user?.phone && user.phone.trim() !== '');
    const hasShownThisSession = sessionHelper.hasShownPhoneModalThisSession();
    const shouldShowModal = !hasPhone && !hasShownThisSession;

    if (shouldShowModal) {
      setShowPhoneModal(true);
      sessionHelper.markPhoneModalShown();
    }

    // Mark this user as processed
    hasProcessedPhoneCheck.current = user.id;
  }, [user]);

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
      {/* Unified Header - Hidden on mobile when viewing a conversation */}
      {!shouldHideHeader && <Header />}

      {/* Main Layout Container */}
      <div className="h-dvh overflow-hidden bg-neutral-50">
        {/* Sidebar - Drawer pattern for all screen sizes */}
        <Sidebar />

        {/* Main Content Area - Dynamic padding based on header visibility */}
        <main className={`h-full overflow-y-auto md:pl-20 ${shouldHideHeader ? 'pt-0' : 'pt-16'}`}>
          {/* md:pl-20 = 80px left padding on desktop for collapsed sidebar */}
          {/* pt-16 = 64px top padding for fixed header (removed when header hidden) */}

          {/* Onboarding Prompt Banner - Shows when no agents exist */}
          <OnboardingPromptBanner />

          <Outlet />
        </main>
      </div>

      {/* Phone Collection Modal - Auto-shows once per session if no phone */}
      <PhoneCollectionModal
        isOpen={showPhoneModal}
        onClose={() => setShowPhoneModal(false)}
        onSuccess={() => setShowPhoneModal(false)}
        onSkip={() => setShowPhoneModal(false)}
      />
    </>
  );
};
