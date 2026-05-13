/**
 * Tooltip Component (Radix-backed)
 *
 * Drop-in replacement for the previous hand-rolled tooltip. Same API surface
 * (Tooltip / TooltipTrigger / TooltipContent / TooltipProvider) so existing
 * consumers continue to work unchanged. Radix gives us:
 *   - Viewport collision detection (auto-flips top↔bottom, left↔right when
 *     there isn't room — fixes the sidebar-clipping bug)
 *   - Proper focus + keyboard semantics
 *   - Portal rendering so tooltips can escape overflow:hidden containers
 *
 * Default styling matches the prior design (white bg, neutral border, small
 * shadow, fade+scale animation). Consumers can still override with className.
 */

import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils';

// ============================================================================
// Provider — wraps the entire app once so per-tooltip mount isn't needed.
// ============================================================================
export function TooltipProvider({
  children,
  delayDuration = 200,
  skipDelayDuration = 300,
}: {
  children: React.ReactNode;
  /** Default delay before tooltips open. Individual <Tooltip> can override. */
  delayDuration?: number;
  /** How long to skip the open delay after a recent tooltip closed. */
  skipDelayDuration?: number;
}) {
  return (
    <TooltipPrimitive.Provider
      delayDuration={delayDuration}
      skipDelayDuration={skipDelayDuration}
    >
      {children}
    </TooltipPrimitive.Provider>
  );
}

// ============================================================================
// Tooltip — wraps a single trigger+content pair.
// ============================================================================
export interface TooltipProps {
  children: React.ReactNode;
  /** Open delay in ms. Overrides provider default for this instance. */
  delayDuration?: number;
  /** Controlled open state (rarely needed; hover handles itself). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Tooltip({ children, delayDuration, open, onOpenChange }: TooltipProps) {
  return (
    <TooltipPrimitive.Root
      delayDuration={delayDuration}
      open={open}
      onOpenChange={onOpenChange}
    >
      {children}
    </TooltipPrimitive.Root>
  );
}

// ============================================================================
// TooltipTrigger — the hoverable element. `asChild` merges into the existing
// child element (e.g. a <button>) instead of wrapping in an extra <span>.
// ============================================================================
export interface TooltipTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

export const TooltipTrigger = React.forwardRef<HTMLButtonElement, TooltipTriggerProps>(
  ({ children, asChild = false }, ref) => (
    <TooltipPrimitive.Trigger ref={ref} asChild={asChild}>
      {children}
    </TooltipPrimitive.Trigger>
  )
);
TooltipTrigger.displayName = 'TooltipTrigger';

// ============================================================================
// TooltipContent — the hover panel. Portal-rendered so it escapes overflow
// containers. Collision-aware: auto-flips side when near a viewport edge.
// ============================================================================
export interface TooltipContentProps {
  children: React.ReactNode;
  className?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  /** Distance from trigger in px. */
  sideOffset?: number;
  /** Minimum distance to keep from viewport edges. Prevents clipping. */
  collisionPadding?: number;
}

export const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
  (
    {
      children,
      className,
      side = 'top',
      align = 'center',
      sideOffset = 6,
      collisionPadding = 8,
    },
    ref
  ) => (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        ref={ref}
        side={side}
        align={align}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={cn(
          // Matches the previous primitive's visual style so no consumer has
          // to change colors/borders/shadow.
          'z-50 max-w-[260px] w-max rounded-md bg-white border border-neutral-200 px-2.5 py-1 text-xs text-neutral-700 leading-snug shadow-lg',
          // Fade + slight scale via Radix data-state attributes.
          'data-[state=delayed-open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=delayed-open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=delayed-open]:zoom-in-95',
          'data-[side=top]:slide-in-from-bottom-1 data-[side=bottom]:slide-in-from-top-1',
          'data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1',
          className
        )}
      >
        {children}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
);
TooltipContent.displayName = 'TooltipContent';
