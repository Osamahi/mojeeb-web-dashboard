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
  Package,
  BookOpen,
  Network,
  Puzzle,
  Layers,
  Workflow,
} from 'lucide-react';
import { WhatsAppIcon } from './WhatsAppIcon';
import type { NavigationItem } from './types';

/**
 * Main navigation items
 * Order matters - items appear in this order in the sidebar
 */
export const navigation: NavigationItem[] = [
  {
    name: 'Chats', // Fallback for non-translated contexts
    translationKey: 'navigation.chats',
    href: '/conversations',
    icon: MessageSquare,
  },
  {
    name: 'Setup',
    translationKey: 'navigation.setup',
    href: '/studio',
    icon: Wrench,
    requiresAgent: true,
  },
  {
    name: 'Connect',
    translationKey: 'navigation.connect',
    href: '/connections',
    icon: Plug,
  },
  {
    name: 'Clients',
    translationKey: 'navigation.clients',
    href: '/leads',
    icon: Contact,
    requiresAgent: true,
  },
  {
    name: 'Agents',
    translationKey: 'navigation.agents',
    href: '/agents',
    icon: Bot,
  },
  {
    name: 'Users',
    translationKey: 'navigation.users',
    href: '/users',
    icon: Users,
    requireSuperAdmin: true,
  },
  {
    name: 'Organizations',
    translationKey: 'navigation.organizations',
    href: '/organizations',
    icon: Building2,
    requireSuperAdmin: true,
  },
  {
    name: 'All Connections',
    translationKey: 'navigation.admin_connections',
    href: '/admin-connections',
    icon: Network,
    requireSuperAdmin: true,
  },
  {
    name: 'Subscriptions',
    translationKey: 'navigation.subscriptions',
    href: '/subscriptions',
    icon: Receipt,
    requireSuperAdmin: true,
  },
  {
    name: 'Add-on Plans',
    translationKey: 'navigation.addon_plans',
    href: '/addon-plans',
    icon: Layers,
    requireSuperAdmin: true,
  },
  {
    name: 'Add-ons',
    translationKey: 'navigation.addons',
    href: '/addons',
    icon: Puzzle,
    requireSuperAdmin: true,
  },
  {
    name: 'Stripe Products',
    translationKey: 'navigation.stripe_products',
    href: '/pricing',
    icon: Package,
    requireSuperAdmin: true,
  },
  {
    name: 'Plan Catalogue',
    translationKey: 'navigation.plan_catalogue',
    href: '/catalogue',
    icon: BookOpen,
    requireSuperAdmin: true,
  },
  {
    name: 'My Subscription',
    translationKey: 'navigation.my_subscription',
    href: '/my-subscription',
    icon: CreditCard,
  },
  {
    name: 'Team',
    translationKey: 'navigation.team',
    href: '/team-management',
    icon: UserPlus,
  },
  {
    name: 'Actions',
    translationKey: 'navigation.actions',
    href: '/actions',
    icon: Workflow,
    requireSuperAdmin: true,
  },
  {
    name: 'WhatsApp',
    translationKey: 'navigation.whatsapp',
    href: '/whatsapp-management',
    icon: WhatsAppIcon,
    requireSuperAdmin: true,
  },
  {
    name: 'Support',
    translationKey: 'navigation.support',
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
