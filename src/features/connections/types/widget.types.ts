/**
 * Widget Configuration Types
 * TypeScript types matching backend WidgetConfiguration model
 */

/**
 * Widget mode options
 */
export type WidgetMode = 'default' | 'headless';

/**
 * Widget position options
 */
export type WidgetPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

/**
 * Complete widget configuration
 * Matches backend Models/WidgetModels.cs
 */
export interface WidgetConfiguration {
  id: string;
  agentId: string;
  ownerId: string;
  name: string;
  isActive: boolean;

  // Appearance
  primaryColor: string;
  position: WidgetPosition;
  botAvatarUrl: string | null;
  chatIconUrl: string | null;
  customCssUrl: string | null;

  // Content
  welcomeMessage: string | null;
  initialMessage: string | null;
  launcherText: string;
  agentNameOverride: string | null;

  // Behavior
  language: string;
  showPoweredBy: boolean;
  delayAutoOpen: number | null;
  maxConcurrentChats: number;

  // Metadata
  widgetVersion: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Request payload for updating widget configuration
 * All fields are optional to support partial updates
 */
export interface UpdateWidgetRequest {
  // Appearance
  primaryColor?: string;
  position?: WidgetPosition;
  botAvatarUrl?: string | null;
  chatIconUrl?: string | null;
  customCssUrl?: string | null;

  // Content
  welcomeMessage?: string | null;
  initialMessage?: string | null;
  launcherText?: string;
  agentNameOverride?: string | null;

  // Behavior
  language?: string;
  showPoweredBy?: boolean;
  delayAutoOpen?: number | null;
  maxConcurrentChats?: number;

  // Metadata
  name?: string;
  isActive?: boolean;
}

/**
 * Widget customization form state
 * Used in the customization modal
 */
export interface WidgetCustomizationForm {
  // Appearance
  primaryColor: string;
  position: WidgetPosition;

  // Content
  launcherText: string;
  welcomeMessage: string;
  initialMessage: string;
  agentNameOverride: string;

  // Behavior
  language: string;
  showPoweredBy: boolean;
  delayAutoOpen: number | null;
}

/**
 * Language options for widget
 */
export interface LanguageOption {
  value: string;
  label: string;
}

/**
 * Available language options
 */
export const WIDGET_LANGUAGES: LanguageOption[] = [
  { value: 'en', label: 'English' },
  { value: 'ar', label: 'Arabic (العربية)' },
];

/**
 * Position options with labels
 */
export interface PositionOption {
  value: WidgetPosition;
  label: string;
}

/**
 * Available position options
 */
export const WIDGET_POSITIONS: PositionOption[] = [
  { value: 'bottom-right', label: 'Bottom Right' },
  { value: 'bottom-left', label: 'Bottom Left' },
  { value: 'top-right', label: 'Top Right' },
  { value: 'top-left', label: 'Top Left' },
];

/**
 * Default widget configuration values
 */
export const DEFAULT_WIDGET_CONFIG: Partial<WidgetCustomizationForm> = {
  primaryColor: '#000000',
  position: 'bottom-right',
  launcherText: 'Chat with us',
  welcomeMessage: 'Hello! How can we help you today?',
  initialMessage: 'Hi! Need any help?',
  agentNameOverride: '',
  language: 'en',
  showPoweredBy: true,
  delayAutoOpen: null,
};

/**
 * Widget mode option interface
 */
export interface WidgetModeOption {
  value: WidgetMode;
  label: string;
  description: string;
  badge?: string;
  badgeVariant?: 'recommended' | 'advanced';
}

/**
 * Available widget mode options
 */
export const WIDGET_MODES: WidgetModeOption[] = [
  {
    value: 'default',
    label: 'Ready Made Widget',
    description: 'Includes launcher button, zero configuration, perfect for most websites',
    badge: 'Recommended',
    badgeVariant: 'recommended',
  },
  {
    value: 'headless',
    label: 'Customized Integration',
    description: 'Use your own buttons/triggers, full control, for custom integrations',
    badge: 'Advanced',
    badgeVariant: 'advanced',
  },
];
