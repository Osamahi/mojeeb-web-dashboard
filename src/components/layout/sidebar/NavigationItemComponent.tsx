import { memo } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

  // Get translated label or fall back to item.name
  const label = item.translationKey ? t(item.translationKey) : item.name;

  // Optional eye-catcher pill (e.g. "NEW"). Driven by item.badge (i18n key);
  // when sidebar is expanded we render a small pill next to the label, when
  // collapsed we shrink to a corner dot on the icon so the signal persists
  // without overflowing the narrow rail.
  const badgeLabel = item.badge ? t(item.badge) : null;

  // Reusable badge bits — kept inline (not extracted) because they're tiny and
  // only render conditionally inside the two branches below.
  //
  // Visual recipe: deep neutral chip (`bg-neutral-900`) → pure white label →
  // 🔥 emoji for "hot drop" energy. White text on near-black gives the
  // strongest contrast at small sizes; the colored flame emoji provides the
  // brand-adjacent accent without the gradient-text trick (which can look
  // muddy at 10px).
  //
  // Using a native emoji instead of a lucide icon — renders crisp at small
  // sizes on every platform without inline SVG, and the colored glyph reads
  // hotter than any monochrome stroke icon at this scale.
  //
  // No badge when collapsed — the sidebar rail is too narrow for a chip and a
  // standalone dot would read as a stray "active" indicator. The pill returns
  // when the sidebar expands.
  const badgePill = badgeLabel && !isCollapsed && (
    <span
      className="ms-2 inline-flex items-center gap-1 rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm"
      aria-label={badgeLabel}
    >
      <span className="text-[11px] leading-none" aria-hidden="true">
        🔥
      </span>
      {badgeLabel}
    </span>
  );

  // Disabled state rendering
  if (isDisabled) {
    return (
      <div
        role="button"
        aria-disabled="true"
        aria-label={`${label} - ${item.requiresAgent ? 'Select an agent to access this feature' : 'Disabled'}`}
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
          <span className="text-sm pr-4 whitespace-nowrap">{label}</span>
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
        title={isCollapsed ? label : undefined}
        aria-label={label}
      >
        {/* Fixed-width icon container - prevents shifting. */}
        <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
          <item.icon
            className={cn(
              'w-6 h-6 transition-transform text-neutral-600',
              isCollapsed && 'group-hover:scale-110'
            )}
            aria-hidden="true"
          />
        </div>
        {/* Text label + optional badge pill - conditionally rendered */}
        {!isCollapsed && (
          <span className="text-sm pr-4 whitespace-nowrap flex items-center">
            {label}
            {badgePill}
          </span>
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
      title={isCollapsed ? label : undefined}
      aria-label={label}
    >
      {({ isActive }) => (
        <>
          {/* Fixed-width icon container - prevents shifting. */}
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
          {/* Text label + optional badge pill - conditionally rendered */}
          {!isCollapsed && (
            <span className="text-sm pr-4 whitespace-nowrap flex items-center">
              {label}
              {badgePill}
            </span>
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
