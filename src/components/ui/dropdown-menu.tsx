/**
 * Dropdown Menu Component
 *
 * Lightweight popover menu used for row actions, three-dot menus, and any
 * other "trigger → small floating list" UI. Content is **portaled to
 * `document.body`** with fixed coordinates so it escapes any sticky / table /
 * transformed ancestor stacking contexts — this matters for tables with
 * sticky columns where an `absolute` child would otherwise be clipped or
 * stacked below another sticky cell.
 *
 * Auto-flips above the trigger when there isn't enough room below.
 * RTL-aware via the alignment prop (start/center/end resolve to the visual
 * leading/center/trailing edge of the trigger).
 *
 * Public API (`<DropdownMenu>`, `<DropdownMenuTrigger>`,
 * `<DropdownMenuContent>`, `<DropdownMenuItem>`) is unchanged from the
 * previous version.
 */

import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface DropdownMenuContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  setTriggerEl: (el: HTMLElement | null) => void;
  contentRef: React.RefObject<HTMLDivElement | null>;
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue>({
  isOpen: false,
  open: () => {},
  close: () => {},
  toggle: () => {},
  triggerRef: { current: null },
  setTriggerEl: () => {},
  contentRef: { current: null },
});

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

export interface DropdownMenuProps {
  children: React.ReactNode;
}

export function DropdownMenu({ children }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLElement | null>(null);
  const contentRef = React.useRef<HTMLDivElement | null>(null);

  const open = React.useCallback(() => setIsOpen(true), []);
  const close = React.useCallback(() => setIsOpen(false), []);
  const toggle = React.useCallback(() => setIsOpen((v) => !v), []);
  const setTriggerEl = React.useCallback((el: HTMLElement | null) => {
    triggerRef.current = el;
  }, []);

  // Close on click outside — checks both trigger and portaled content so a
  // click inside the menu (which lives outside the trigger's DOM subtree)
  // doesn't dismiss it.
  React.useEffect(() => {
    if (!isOpen) return;
    const handle = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        contentRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [isOpen]);

  // Close on Escape.
  React.useEffect(() => {
    if (!isOpen) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [isOpen]);

  // Close when the surrounding viewport scrolls or resizes — keeps the
  // menu honest if the user scrolls the table beneath it.
  //
  // Scoping: capture-phase `scroll` catches scrolls on ANY element. We
  // explicitly ignore events whose target is the menu's own content (a
  // long member list scrolls inside it) — otherwise picking a teammate
  // from a scrollable list would close the menu mid-scroll.
  React.useEffect(() => {
    if (!isOpen) return;
    const onScroll = (e: Event) => {
      const target = e.target as Node | null;
      if (target && contentRef.current?.contains(target)) return;
      setIsOpen(false);
    };
    const onResize = () => setIsOpen(false);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [isOpen]);

  const value = React.useMemo<DropdownMenuContextValue>(
    () => ({ isOpen, open, close, toggle, triggerRef, setTriggerEl, contentRef }),
    [isOpen, open, close, toggle, setTriggerEl],
  );

  return (
    <DropdownMenuContext.Provider value={value}>
      {children}
    </DropdownMenuContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Trigger
// ---------------------------------------------------------------------------

export interface DropdownMenuTriggerProps {
  /** When true, clone the child element and attach the trigger behavior to it. */
  asChild?: boolean;
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
}

export const DropdownMenuTrigger = React.forwardRef<
  HTMLElement,
  DropdownMenuTriggerProps
>(({ asChild, children, onClick }, ref) => {
  const { toggle, setTriggerEl } = React.useContext(DropdownMenuContext);

  // Combined ref: forward to the parent ref AND register the element with the
  // context so we can position the portaled content against it.
  const setRef = React.useCallback(
    (el: HTMLElement | null) => {
      setTriggerEl(el);
      if (typeof ref === 'function') ref(el);
      else if (ref) (ref as React.MutableRefObject<HTMLElement | null>).current = el;
    },
    [ref, setTriggerEl],
  );

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggle();
    onClick?.(e);
  };

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<{
      ref?: React.Ref<HTMLElement>;
      onClick?: (e: React.MouseEvent) => void;
    }>;
    return React.cloneElement(child, {
      ref: setRef,
      onClick: (e: React.MouseEvent) => {
        child.props.onClick?.(e);
        handleClick(e);
      },
    });
  }

  return (
    <div ref={setRef as React.Ref<HTMLDivElement>} onClick={handleClick}>
      {children}
    </div>
  );
});

DropdownMenuTrigger.displayName = 'DropdownMenuTrigger';

// ---------------------------------------------------------------------------
// Content — portaled, positioned against the trigger
// ---------------------------------------------------------------------------

export interface DropdownMenuContentProps {
  /**
   * Horizontal alignment relative to the trigger. `start`/`end` use the
   * trigger's leading/trailing edge respectively (RTL-aware), `center`
   * centers on the trigger.
   */
  align?: 'start' | 'center' | 'end';
  /** Vertical gap between trigger and content. Defaults to 8px. */
  sideOffset?: number;
  children: React.ReactNode;
  className?: string;
}

interface MenuPosition {
  top: number;
  left: number;
  /** True when we had to flip the menu above the trigger to fit on screen. */
  flipped: boolean;
}

export function DropdownMenuContent({
  align = 'start',
  sideOffset = 8,
  children,
  className,
}: DropdownMenuContentProps) {
  const { isOpen, triggerRef, contentRef } = React.useContext(DropdownMenuContext);
  const [position, setPosition] = React.useState<MenuPosition | null>(null);
  const [isMounted, setIsMounted] = React.useState(false);

  // Mount flag — portals need `document` to exist.
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Compute position once the content is rendered so we can measure its size
  // and flip if it overflows the viewport.
  React.useLayoutEffect(() => {
    if (!isOpen) {
      setPosition(null);
      return;
    }
    const triggerEl = triggerRef.current;
    const contentEl = contentRef.current;
    if (!triggerEl || !contentEl) return;

    const isRTL =
      document.documentElement.dir === 'rtl' ||
      (document.body.dir === 'rtl');

    const triggerRect = triggerEl.getBoundingClientRect();
    const contentRect = contentEl.getBoundingClientRect();
    const viewportH = window.innerHeight;
    const viewportW = window.innerWidth;

    // Vertical placement: below the trigger by default, flip above if no room.
    const spaceBelow = viewportH - triggerRect.bottom;
    const spaceAbove = triggerRect.top;
    const flipped =
      spaceBelow < contentRect.height + sideOffset &&
      spaceAbove > spaceBelow;
    const top = flipped
      ? triggerRect.top - contentRect.height - sideOffset
      : triggerRect.bottom + sideOffset;

    // Horizontal placement — `start` and `end` flip in RTL.
    //   start: align content's leading edge with trigger's leading edge
    //   end:   align content's trailing edge with trigger's trailing edge
    //   center: center content on trigger
    let left: number;
    if (align === 'center') {
      left = triggerRect.left + triggerRect.width / 2 - contentRect.width / 2;
    } else {
      const startsAtLeft =
        (align === 'start' && !isRTL) || (align === 'end' && isRTL);
      left = startsAtLeft
        ? triggerRect.left
        : triggerRect.right - contentRect.width;
    }

    // Clamp inside the viewport with an 8px gutter so it never clips off-screen.
    const GUTTER = 8;
    left = Math.max(GUTTER, Math.min(left, viewportW - contentRect.width - GUTTER));

    setPosition({ top, left, flipped });
  }, [isOpen, align, sideOffset, triggerRef, contentRef, children]);

  if (!isMounted || !isOpen) return null;

  return createPortal(
    <div
      ref={contentRef}
      role="menu"
      // High z-index so dropdowns opened from inside a modal land above the
      // modal layer (BaseModal uses z-[9999]). Portaling already escapes
      // table stacking contexts; the z-index protects against z-9999 overlays.
      style={{
        position: 'fixed',
        top: position?.top ?? 0,
        left: position?.left ?? 0,
        // Hide content during the first layout pass so we don't see it
        // flicker at (0,0) before measurement completes.
        visibility: position ? 'visible' : 'hidden',
        zIndex: 10000,
      }}
      className={cn(
        'min-w-[8rem] overflow-hidden rounded-md border border-neutral-200 bg-white p-1 shadow-lg',
        className,
      )}
    >
      {children}
    </div>,
    document.body,
  );
}

// ---------------------------------------------------------------------------
// Item
// ---------------------------------------------------------------------------

export interface DropdownMenuItemProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  disabled?: boolean;
}

export function DropdownMenuItem({
  children,
  onClick,
  className,
  disabled = false,
}: DropdownMenuItemProps) {
  const { close } = React.useContext(DropdownMenuContext);

  const handleClick = (e: React.MouseEvent) => {
    if (disabled) return;
    e.stopPropagation();
    onClick?.(e);
    close(); // Close menu after clicking item
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        'relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors text-start',
        'hover:bg-neutral-100 focus:bg-neutral-100',
        disabled && 'pointer-events-none opacity-50',
        className,
      )}
    >
      {children}
    </button>
  );
}
