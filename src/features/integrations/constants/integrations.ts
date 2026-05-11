/**
 * Integration Catalog Metadata
 *
 * Centralized definitions for the Tools page (formerly the actions table — now
 * the integration catalog view). Mirrors the pattern established by
 * `features/connections/constants/platforms.ts` so the messaging-platform and
 * integration-connector surfaces share the same mental model.
 *
 * Each entry describes ONE integration kind (e.g. Google Sheets) — independent of
 * how many connections the user has actually created. The user's connections are
 * fetched separately via `useIntegrationConnections` and joined in the UI by
 * `connectorType`.
 */

/**
 * Connector identifier — must match backend `connectors.connector_id` enum.
 * Add new ids here as new connectors land.
 */
export type IntegrationConnectorId =
  | 'google_sheets'
  | 'google_calendar'
  | 'notion'
  | 'shopify';

export type IntegrationStatus = 'available' | 'coming_soon';

/**
 * Per-operation descriptor — drives the chip row on Connected cards and the
 * ops-count subtitle on Available cards. The id matches `connectors[X].operations[].operation_id`
 * exactly so we can derive "enabled for this connection" by joining against the
 * agent's actions.
 */
export interface IntegrationOperationMeta {
  id: string;            // e.g. 'add_row', 'update_row', 'read_row'
  i18nKey: string;       // e.g. 'tools.op_add_row' — short verb chip label
}

/**
 * Catalog entry for a single integration. UI-only — DO NOT use this for runtime
 * dispatch (that comes from the backend's IConnectorRegistry).
 */
export interface IntegrationMetadata {
  id: IntegrationConnectorId;
  /** Vendor name in original script (Latin even in AR per Salla/Zid/Bayzat convention). */
  name: string;
  /** i18n key for the 1-2 line description shown under the name. */
  descriptionKey: string;
  status: IntegrationStatus;
  /** Brand color for the icon background tint. */
  brandColor: string;
  /** Light tint for the icon background fill. */
  brandBgColor: string;
  /** Operations the LLM can call once connected. */
  operations: IntegrationOperationMeta[];
  /** "By Mojeeb · Native" trust badge — true for officially-supported integrations. */
  isFirstParty: boolean;
  /** Functional grouping — currently informational only; sets up future filtering. */
  category: 'data' | 'calendar' | 'crm' | 'communication' | 'docs' | 'commerce';
  /** When true, coming-soon row shows a "Notify me" CTA (frontend-only capture for now). */
  notifyEnabled?: boolean;
}

/**
 * Full integration catalog. Order = display order in the Available section.
 * Available items always render before coming-soon items regardless of array order
 * (sorted client-side in the section component).
 */
export const INTEGRATIONS: IntegrationMetadata[] = [
  {
    id: 'google_sheets',
    name: 'Google Sheets',
    descriptionKey: 'tools.catalog_google_sheets_desc',
    status: 'available',
    // Official simple-icons brand color for Google Sheets
    brandColor: '#34A853',
    brandBgColor: '#E8F5E9',
    operations: [
      { id: 'add_row',    i18nKey: 'tools.op_add_row' },
      { id: 'update_row', i18nKey: 'tools.op_update_row' },
      { id: 'read_row',   i18nKey: 'tools.op_read_row' },
    ],
    isFirstParty: true,
    category: 'data',
  },
  {
    id: 'google_calendar',
    name: 'Google Calendar',
    descriptionKey: 'tools.catalog_google_calendar_desc',
    status: 'coming_soon',
    // Official simple-icons brand color for Google Calendar
    brandColor: '#4285F4',
    brandBgColor: '#E8F0FE',
    operations: [
      { id: 'create_event',     i18nKey: 'tools.op_create_event' },
      { id: 'list_availability', i18nKey: 'tools.op_list_availability' },
    ],
    isFirstParty: true,
    category: 'calendar',
    notifyEnabled: true,
  },
  {
    id: 'shopify',
    name: 'Shopify',
    descriptionKey: 'tools.catalog_shopify_desc',
    status: 'coming_soon',
    // Official simple-icons brand color for Shopify (their signature green)
    brandColor: '#7AB55C',
    brandBgColor: '#F1F8E9',
    operations: [
      { id: 'create_order',  i18nKey: 'tools.op_create_order' },
      { id: 'find_product',  i18nKey: 'tools.op_find_product' },
      { id: 'update_order',  i18nKey: 'tools.op_update_order' },
    ],
    isFirstParty: true,
    category: 'commerce',
    notifyEnabled: true,
  },
  {
    id: 'notion',
    name: 'Notion',
    descriptionKey: 'tools.catalog_notion_desc',
    status: 'coming_soon',
    brandColor: '#000000',
    brandBgColor: '#F5F5F5',
    operations: [
      { id: 'create_page', i18nKey: 'tools.op_create_page' },
      { id: 'update_page', i18nKey: 'tools.op_update_page' },
    ],
    isFirstParty: true,
    category: 'docs',
    notifyEnabled: true,
  },
];

/**
 * Lookup helper — finds a catalog entry by connector id. Returns undefined for
 * unknown ids (e.g. an old connection whose connector type we've deprecated).
 */
export function getIntegrationById(id: string): IntegrationMetadata | undefined {
  return INTEGRATIONS.find((i) => i.id === id);
}
