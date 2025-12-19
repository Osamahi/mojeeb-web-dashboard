import { memo } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { NavigationItem } from './types';

interface NavigationItemProps {
  item: NavigationItem;
  isCollapsed?: boolean;
  isDisabled?: boolean;
}

/**
 * Individual Navigation Item Component
 * Handles both enabled and disabled states with proper accessibility
 * Memoized to prevent unnecessary re-renders
 */
export const NavigationItemComponent = memo(({
  item,
  isCollapsed = false,
  isDisabled = false,
}: NavigationItemProps) => {
  // Disabled state rendering
  if (isDisabled) {
    return (
      <div
        role="button"
        aria-disabled="true"
        aria-label={`${item.name} - ${item.requiresAgent ? 'Select an agent to access this feature' : 'Disabled'}`}
        tabIndex={0}
        className="flex items-center rounded-md text-neutral-400 cursor-not-allowed opacity-50 focus:outline-none focus:ring-2 focus:ring-neutral-300"
        title={item.requiresAgent ? 'Select an agent to access this feature' : undefined}
        onKeyDown={(e) => {
          // Prevent activation via keyboard
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            // Item is disabled, no action taken
          }
        }}
      >
        <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
          <item.icon className="w-6 h-6" aria-hidden="true" />
        </div>
        {/* Text label - conditionally rendered */}
        {!isCollapsed && (
          <span className="text-sm pr-4 whitespace-nowrap">{item.name}</span>
        )}
      </div>
    );
  }

  // Non-navigable item (no href)
  if (!item.href) {
    return (
      <button
        onClick={item.onClick}
        className={cn(
          'group flex items-center rounded-md transition-colors duration-200 w-full',
          'text-neutral-600 hover:text-neutral-950',
          isCollapsed && 'hover:bg-neutral-100'
        )}
        title={isCollapsed ? item.name : undefined}
        aria-label={item.name}
      >
        {/* Fixed-width icon container - prevents shifting */}
        <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
          <item.icon
            className={cn(
              'w-6 h-6 transition-transform text-neutral-600',
              isCollapsed && 'group-hover:scale-110'
            )}
            aria-hidden="true"
          />
        </div>
        {/* Text label - conditionally rendered */}
        {!isCollapsed && (
          <span className="text-sm pr-4 whitespace-nowrap">{item.name}</span>
        )}
      </button>
    );
  }

  // Active navigation link
  return (
    <NavLink
      to={item.href}
      className={({ isActive }) =>
        cn(
          'group flex items-center rounded-md transition-colors duration-200',
          isActive
            ? 'text-brand-mojeeb font-semibold' // Use Tailwind brand color
            : 'text-neutral-600 hover:text-neutral-950',
          // Add subtle hover effect when collapsed
          isCollapsed && 'hover:bg-neutral-100'
        )
      }
      title={isCollapsed ? item.name : undefined}
      aria-label={item.name}
    >
      {({ isActive }) => (
        <>
          {/* Fixed-width icon container - prevents shifting */}
          <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
            <item.icon
              className={cn(
                'w-6 h-6 transition-transform',
                isActive ? 'text-brand-mojeeb' : 'text-neutral-600',
                // Subtle scale on hover when collapsed
                isCollapsed && 'group-hover:scale-110'
              )}
              aria-hidden="true"
            />
          </div>
          {/* Text label - conditionally rendered */}
          {!isCollapsed && (
            <span className="text-sm pr-4 whitespace-nowrap">{item.name}</span>
          )}
        </>
      )}
    </NavLink>
  );
}, (prevProps, nextProps) => {
  // Custom equality check to prevent unnecessary re-renders
  return (
    prevProps.item === nextProps.item &&
    prevProps.isCollapsed === nextProps.isCollapsed &&
    prevProps.isDisabled === nextProps.isDisabled
  );
});

NavigationItemComponent.displayName = 'NavigationItemComponent';
