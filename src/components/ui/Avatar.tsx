import { HTMLAttributes, forwardRef } from 'react';
import { cn, getInitials, getAvatarColor } from '@/lib/utils';

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, name, size = 'md', ...props }, ref) => {
    const initials = name ? getInitials(name) : '?';
    const bgColor = name ? getAvatarColor(name) : 'bg-neutral-400';

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-full overflow-hidden',
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {src ? (
          <img
            src={src}
            alt={alt || name || 'Avatar'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={cn('w-full h-full flex items-center justify-center text-white font-semibold', bgColor)}>
            {initials}
          </div>
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';
