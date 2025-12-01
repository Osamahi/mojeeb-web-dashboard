/**
 * Tooltip Component
 * Simple tooltip for hover interactions
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

const TooltipContext = React.createContext<{
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}>({
  isOpen: false,
  setIsOpen: () => {},
});

export interface TooltipProps {
  children: React.ReactNode;
  delayDuration?: number;
}

export function Tooltip({ children, delayDuration = 200 }: TooltipProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(true);
    }, delayDuration);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsOpen(false);
  };

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <TooltipContext.Provider value={{ isOpen, setIsOpen }}>
      <div
        className="relative inline-flex"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>
    </TooltipContext.Provider>
  );
}

export interface TooltipTriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
}

export const TooltipTrigger = React.forwardRef<HTMLDivElement, TooltipTriggerProps>(
  ({ children }, ref) => {
    return (
      <div ref={ref} className="inline-flex">
        {children}
      </div>
    );
  }
);

TooltipTrigger.displayName = 'TooltipTrigger';

export interface TooltipContentProps {
  children: React.ReactNode;
  className?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
}

export function TooltipContent({
  children,
  className,
  side = 'top',
  align = 'center',
}: TooltipContentProps) {
  const { isOpen } = React.useContext(TooltipContext);

  if (!isOpen) return null;

  const sideClass = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2',
  };

  const alignmentClass = {
    start: side === 'top' || side === 'bottom' ? 'left-0' : 'top-0',
    center: side === 'top' || side === 'bottom' ? 'left-1/2 -translate-x-1/2' : 'top-1/2 -translate-y-1/2',
    end: side === 'top' || side === 'bottom' ? 'right-0' : 'bottom-0',
  };

  return (
    <div
      className={cn(
        'absolute z-50 overflow-hidden rounded-md bg-neutral-900 px-3 py-1.5 text-xs text-white shadow-md animate-in fade-in-0 zoom-in-95 max-w-[200px]',
        sideClass[side],
        alignmentClass[align],
        className
      )}
    >
      {children}
    </div>
  );
}

// TooltipProvider is just a pass-through for API compatibility
export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
