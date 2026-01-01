/**
 * Metadata and SEO-related TypeScript types
 *
 * This module provides type definitions for document metadata,
 * page titles, and SEO-related functionality.
 */

/**
 * Valid page title translation keys.
 * These correspond to keys in the `pages` namespace of translation files.
 *
 * @example
 * const titleKey: PageTitleKey = 'pages.title_agents';
 */
export type PageTitleKey =
  // Main application pages
  | 'pages.title_agents'
  | 'pages.title_studio'
  | 'pages.title_connections'
  | 'pages.title_leads'
  | 'pages.title_conversations'
  | 'pages.title_settings'
  | 'pages.title_install_widget'

  // Admin pages
  | 'pages.title_users'
  | 'pages.title_organizations'
  | 'pages.title_team_management'
  | 'pages.title_subscriptions'
  | 'pages.title_logs'

  // User pages
  | 'pages.title_my_subscription'

  // Auth pages
  | 'pages.title_login'
  | 'pages.title_signup'
  | 'pages.title_forgot_password'

  // Onboarding & Success
  | 'pages.title_onboarding'
  | 'pages.title_subscription_success'
  | 'pages.title_subscription_cancel';

/**
 * Options for customizing document title via useDocumentTitle hook
 */
export interface DocumentTitleOptions {
  /**
   * Text to prepend before the title
   * @example prefix: "Admin"  → "Admin | AI Agents | Mojeeb"
   */
  prefix?: string;

  /**
   * Text to append after the title. Pass `false` to disable default suffix.
   * @default "Mojeeb"
   * @example suffix: false  → "AI Agents"
   * @example suffix: "Dashboard"  → "AI Agents | Dashboard"
   */
  suffix?: string | false;

  /**
   * Whether to translate the title using i18n.
   * Set to `false` for pre-translated strings.
   * @default true
   */
  translateTitle?: boolean;
}

/**
 * Document metadata for SEO and social sharing
 * (Future enhancement for Open Graph, Twitter Cards, etc.)
 */
export interface DocumentMetadata {
  /** Page title */
  title: string;

  /** Meta description */
  description?: string;

  /** Canonical URL */
  canonical?: string;

  /** Keywords (deprecated for SEO but still used by some platforms) */
  keywords?: string[];

  /** Open Graph metadata */
  og?: {
    title?: string;
    description?: string;
    image?: string;
    type?: 'website' | 'article' | 'profile';
  };

  /** Twitter Card metadata */
  twitter?: {
    card?: 'summary' | 'summary_large_image' | 'app' | 'player';
    title?: string;
    description?: string;
    image?: string;
  };
}
