/**
 * Navigation Configuration
 * Defines the main navigation items for the sidebar
 */

import {
  Bot,
  Users,
  MessageSquare,
  MessageCircleReply,
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
  Cable,
  Network,
  Puzzle,
  Layers,
  Workflow,
  Paperclip,
  Timer,
  ListOrdered,
  Settings,
  AlertTriangle,
  Activity,
  Megaphone,
} from 'lucide-react';
import { WhatsAppIcon } from './WhatsAppIcon';
import { PlanCode } from '@/features/subscriptions/types/subscription.types';
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
    name: 'Comments',
    translationKey: 'navigation.comments',
    href: '/comments',
    icon: MessageCircleReply,
    requiresAgent: true,
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
    name: 'Integrations',
    translationKey: 'navigation.integrations',
    href: '/integrations',
    icon: Cable,
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
    name: 'Action Executions',
    translationKey: 'navigation.action_executions',
    href: '/action-executions',
    icon: Activity,
    requireSuperAdmin: true,
  },
  {
    name: 'Attachments',
    translationKey: 'navigation.attachments',
    href: '/attachments',
    icon: Paperclip,
    requireSuperAdmin: true,
  },
  {
    name: 'Failed Messages',
    translationKey: 'navigation.failed_messages',
    href: '/failed-messages',
    icon: AlertTriangle,
    requireSuperAdmin: true,
  },
  {
    name: 'Follow-Up Jobs',
    translationKey: 'navigation.followup_jobs',
    href: '/followup-jobs',
    icon: Timer,
    requireSuperAdmin: true,
  },
  {
    name: 'Follow-Up Steps',
    translationKey: 'navigation.followup_steps',
    href: '/followup-steps',
    icon: ListOrdered,
    requireSuperAdmin: true,
  },
  {
    name: 'App Config',
    translationKey: 'navigation.app_config',
    href: '/app-config',
    icon: Settings,
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
    name: 'Broadcasts',
    translationKey: 'navigation.broadcasts',
    href: '/broadcasts',
    icon: Megaphone,
    // Visible to Starter + Professional. Starter users see the page but get
    // an in-page upgrade prompt (actual access gated inside the pages).
    // SuperAdmin bypasses this via NavigationList filtering.
    requiredPlans: [PlanCode.Starter, PlanCode.Professional],
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
