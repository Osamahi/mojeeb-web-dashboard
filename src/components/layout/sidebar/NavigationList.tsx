import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Role } from '@/features/auth/types/auth.types';
import type { User } from '@/features/auth/types/auth.types';
import type { Agent } from '@/features/agents/types/agent.types';
import { NavigationItemComponent } from './NavigationItemComponent';
import type { NavigationItem } from './types';

interface NavigationListProps {
  items: NavigationItem[];
  isCollapsed?: boolean;
  user: User | null;
  currentAgent: Agent | null;
}

/**
 * Navigation List Component
 * Renders filtered and accessible navigation items
 * Eliminates code duplication between mobile and desktop
 * Memoized to prevent unnecessary re-renders
 */
export const NavigationList = memo(({
  items,
  isCollapsed = false,
  user,
  currentAgent,
}: NavigationListProps) => {
  const { t } = useTranslation();

  return (
    <nav
      className="flex-1 overflow-x-hidden py-4 px-4 space-y-2"
      aria-label={t('navigation.main_nav_aria')}
    >
      {items
        .filter((item) => {
          // Hide SuperAdmin-only items if user is not SuperAdmin
          if (item.requireSuperAdmin && user?.role !== Role.SuperAdmin) {
            return false;
          }
          return true;
        })
        .map((item) => {
          // Check if item requires an agent and none is selected
          const isDisabled = item.requiresAgent && !currentAgent;

          return (
            <NavigationItemComponent
              key={item.name}
              item={item}
              isCollapsed={isCollapsed}
              isDisabled={isDisabled}
            />
          );
        })}
    </nav>
  );
}, (prevProps, nextProps) => {
  // Custom equality check to prevent re-renders from Zustand reference changes
  return (
    prevProps.isCollapsed === nextProps.isCollapsed &&
    prevProps.items === nextProps.items &&
    prevProps.user?.id === nextProps.user?.id &&
    prevProps.user?.role === nextProps.user?.role &&
    prevProps.currentAgent?.id === nextProps.currentAgent?.id
  );
});

NavigationList.displayName = 'NavigationList';
