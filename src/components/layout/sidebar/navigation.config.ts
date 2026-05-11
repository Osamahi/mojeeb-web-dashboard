/**
 * Navigation Configuration
 * Defines the main navigation items for the sidebar
 */

import {
  Bot,
  Users,
  MessageSquare,
  MessageCircleReply,
  Plug,
  Contact,
  MessagesSquare,
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
  BarChart3,
  Ticket,
  BadgeCheck,
  HandCoins,
  KeyRound,
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
    name: 'Analytics',
    translationKey: 'navigation.analytics',
    href: '/analytics',
    icon: BarChart3,
    requiresAgent: true,
    requireSuperAdmin: true,
  },
  {
    name: 'Comments',
    translationKey: 'navigation.comments',
    href: '/comments',
    icon: MessageCircleReply,
    requiresAgent: true,
  },
  {
    // Renamed from "Setup" → "Agent Setup" (Apr 2026) to make the surface's
    // job explicit: this is where the user configures the agent itself.
    // Icon flipped from `Wrench` → `Bot` for the same reason — Wrench reads
    // as generic "settings"; Bot ties the entry to its actual subject.
    name: 'Agent Setup',
    translationKey: 'navigation.setup',
    href: '/setup',
    icon: Bot,
    requiresAgent: true,
  },
  {
    // Customer-facing tools page — agent-scoped CRUD over actions, available
    // to org members. Same underlying concept as /actions (SuperAdmin admin
    // view), just scoped to one agent and presented for non-technical users —
    // hence both surfaces share the `Workflow` icon for visual consistency.
    name: 'Tools',
    translationKey: 'navigation.tools',
    href: '/tools',
    icon: Workflow,
    requiresAgent: true,
    // Recently shipped — surface a small "NEW" pill in the sidebar so existing
    // users notice the tab. Remove this line after the tab has been in prod
    // for ~30 days (or when the next major surface ships and steals the spotlight).
    badge: 'navigation.badge_new',
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
    // SuperAdmin-only — cross-org listing of all agents in the system. The
    // customer-facing "Agent Setup" entry above covers the same intent for
    // single-agent users, and the agent switcher in the top bar handles
    // selection across the user's own agents.
    name: 'Agents',
    translationKey: 'navigation.agents',
    href: '/agents',
    icon: Bot,
    requireSuperAdmin: true,
  },
  {
    name: 'Users',
    translationKey: 'navigation.users',
    href: '/users',
    icon: Users,
    requireSuperAdmin: true,
  },
  // Organizations: hidden from sidebar — Subscriptions admin now exposes the same agents/team
  // management via the row-level kebab menu. Route at /organizations still works for direct URLs.
  // {
  //   name: 'Organizations',
  //   translationKey: 'navigation.organizations',
  //   href: '/organizations',
  //   icon: Building2,
  //   requireSuperAdmin: true,
  // },
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
    name: 'Coupons',
    translationKey: 'navigation.coupons',
    href: '/coupons',
    icon: Ticket,
    requireSuperAdmin: true,
  },
  {
    name: 'Coupon Redemptions',
    translationKey: 'navigation.coupon_redemptions',
    href: '/coupon-redemptions',
    icon: BadgeCheck,
    requireSuperAdmin: true,
  },
  {
    name: 'Affiliate Redemptions',
    translationKey: 'navigation.affiliate_redemptions',
    href: '/my-redemptions',
    icon: HandCoins,
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
    // Legacy SuperAdmin surface — the customer-facing way to manage integrations
    // is now the Tools tab (which uses the same data but a non-technical UX).
    // Kept around for SuperAdmin debugging/access to the raw connections list.
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
    // SuperAdmin cross-agent admin view of the same action primitives that
    // Tools surfaces to customers. Both share the `Workflow` icon by design —
    // they're two views into the same underlying concept, just at different
    // privilege levels (Tools = customer-facing, agent-scoped; Actions =
    // SuperAdmin-only, cross-agent admin view).
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
    name: 'Funnel Analytics',
    translationKey: 'navigation.funnel_analytics',
    href: '/funnel-analytics',
    icon: BarChart3,
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
    // Plan-gated to Professional. Customer-grade template management page —
    // browse templates, view details, send template messages. Scoped by
    // agentId via useAgentContext, so cross-org access isn't possible.
    // SuperAdmin bypasses requiredPlans (no subscription).
    requiredPlans: [PlanCode.Professional],
  },
  {
    name: 'Broadcasts',
    translationKey: 'navigation.broadcasts',
    href: '/broadcasts',
    icon: Megaphone,
    // Plan-gated to Professional. Page itself uses useHasBroadcastsAccess
    // for direct-URL navigators, same defense-in-depth pattern as API Keys.
    requiredPlans: [PlanCode.Professional],
  },
  {
    name: 'API Keys',
    translationKey: 'navigation.api_keys',
    href: '/api-keys',
    icon: KeyRound,
    // Plan-gated to plans with the api_access feature. The page itself
    // (useHasApiAccess) re-checks for direct-URL navigators on lower plans.
    // Sidebar visibility uses requiredPlans for now; could evolve to a
    // requiredFeature field if more feature-gated entries appear.
    requiredPlans: [PlanCode.Professional],
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
