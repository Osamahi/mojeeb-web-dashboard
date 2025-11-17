/**
 * Platform Icon Component
 * Displays platform-specific icons with color coding
 */

import {
  Globe,
  MessageSquare,
  Facebook,
  Instagram,
  MessageCircle,
  Video,
  Twitter,
  Linkedin,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PlatformType } from '../types';
import { PLATFORM_CONFIG } from '../types';

export interface PlatformIconProps {
  platform: PlatformType;
  size?: 'sm' | 'md' | 'lg';
  showBackground?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
};

const iconSizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

const getIcon = (platform: PlatformType) => {
  switch (platform) {
    case 'web':
      return Globe;
    case 'widget':
      return MessageSquare;
    case 'facebook':
      return Facebook;
    case 'instagram':
      return Instagram;
    case 'whatsapp':
      return MessageCircle;
    case 'tiktok':
      return Video;
    case 'twitter':
      return Twitter;
    case 'linkedin':
      return Linkedin;
    default:
      return Globe;
  }
};

export function PlatformIcon({
  platform,
  size = 'md',
  showBackground = true,
  className,
}: PlatformIconProps) {
  const config = PLATFORM_CONFIG[platform];
  const Icon = getIcon(platform);

  if (!showBackground) {
    return (
      <div className={cn('inline-flex', className)}>
        <Icon className={iconSizeClasses[size]} style={{ color: config.color }} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-lg',
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor: config.bgColor }}
    >
      <Icon className={iconSizeClasses[size]} style={{ color: config.color }} />
    </div>
  );
}
