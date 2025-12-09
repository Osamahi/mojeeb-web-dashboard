/**
 * Navigation Configuration
 * Defines the main navigation items for the sidebar
 */

import {
  Bot,
  Users,
  UserCog,
  UserCheck,
  MessageSquare,
  Wrench,
  Plug,
} from 'lucide-react';
import type { NavigationItem } from './types';

/**
 * Main navigation items
 * Order matters - items appear in this order in the sidebar
 */
export const navigation: NavigationItem[] = [
  {
    name: 'Chats',
    href: '/conversations',
    icon: MessageSquare,
  },
  {
    name: 'Setup',
    href: '/studio',
    icon: Wrench,
    requiresAgent: true,
  },
  {
    name: 'Connect',
    href: '/connections',
    icon: Plug,
  },
  {
    name: 'Team',
    href: '/team',
    icon: UserCog,
  },
  {
    name: 'Leads',
    href: '/leads',
    icon: UserCheck,
    requiresAgent: true,
    requireSuperAdmin: true,
  },
  {
    name: 'Agents',
    href: '/agents',
    icon: Bot,
  },
  {
    name: 'Users',
    href: '/users',
    icon: Users,
    requireSuperAdmin: true,
  },
];
