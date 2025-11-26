/**
 * Navigation Configuration
 * Defines the main navigation items for the sidebar
 */

import {
  Bot,
  Users,
  UserCog,
  MessageSquare,
  Sliders,
  Link2,
} from 'lucide-react';
import type { NavigationItem } from './types';

/**
 * Main navigation items
 * Order matters - items appear in this order in the sidebar
 */
export const navigation: NavigationItem[] = [
  {
    name: 'Conversations',
    href: '/conversations',
    icon: MessageSquare,
  },
  {
    name: 'Agents',
    href: '/agents',
    icon: Bot,
  },
  {
    name: 'Studio',
    href: '/studio',
    icon: Sliders,
    requiresAgent: true,
  },
  {
    name: 'Team',
    href: '/team',
    icon: UserCog,
  },
  {
    name: 'Connections',
    href: '/connections',
    icon: Link2,
  },
  {
    name: 'Users',
    href: '/users',
    icon: Users,
    requireSuperAdmin: true,
  },
];
