/**
 * Navigation Configuration
 * Defines the main navigation items for the sidebar
 */

import {
  Bot,
  Users,
  MessageSquare,
  Wrench,
  Plug,
  Contact,
  MessagesSquare,
  Building2,
  UserPlus,
  Receipt,
  CreditCard,
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
    name: 'Clients',
    href: '/leads',
    icon: Contact,
    requiresAgent: true,
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
  {
    name: 'Organizations',
    href: '/organizations',
    icon: Building2,
    requireSuperAdmin: true,
  },
  {
    name: 'Subscriptions',
    href: '/subscriptions',
    icon: Receipt,
    requireSuperAdmin: true,
  },
  {
    name: 'My Subscription',
    href: '/my-subscription',
    icon: CreditCard,
  },
  {
    name: 'Team',
    href: '/team-management',
    icon: UserPlus,
  },
  {
    name: 'Support',
    icon: MessagesSquare,
    // No href - this is a non-navigable item with custom click handler
    onClick: () => {
      // Open Mojeeb support widget (headless mode)
      if (window.MojeebWidget) {
        window.MojeebWidget.open();
      } else {
        console.warn('Mojeeb Widget is not loaded yet. Please wait for the script to load.');
      }
    },
  },
];
