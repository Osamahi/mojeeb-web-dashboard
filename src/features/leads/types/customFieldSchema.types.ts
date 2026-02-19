/**
 * Custom Field Schema Types
 * Defines the structure for dynamic custom fields in the CRM system
 */

export type FieldType =
  | 'string'
  | 'text'
  | 'number'
  | 'currency'
  | 'email'
  | 'phone'
  | 'url'
  | 'date'
  | 'datetime'
  | 'timestamp'
  | 'boolean'
  | 'enum';

export interface EnumOption {
  value: string;
  label_en: string;
  label_ar: string;
  color?: string;
}

export interface ValidationRules {
  min?: number;
  max?: number;
  pattern?: string;
  required?: boolean;
  custom?: Record<string, any>;
}

export interface CustomFieldSchema {
  id: string;
  agent_id: string;
  field_key: string;
  name_en: string;
  name_ar: string;
  field_type: FieldType;
  display_order: number;
  show_in_table: boolean;
  show_in_form: boolean;
  is_required: boolean;
  is_system: boolean;
  validation_rules?: ValidationRules | null;
  options?: EnumOption[] | null;
  created_at: string;
  updated_at: string;
}

// DTOs for API requests
export interface CreateCustomFieldSchemaRequest {
  field_key: string;
  name_en: string;
  name_ar: string;
  field_type: FieldType;
  display_order?: number;
  show_in_table?: boolean;
  show_in_form?: boolean;
  is_required?: boolean;
  validation_rules?: ValidationRules;
  options?: EnumOption[];
}

export interface UpdateCustomFieldSchemaRequest {
  field_key?: string;
  name_en?: string;
  name_ar?: string;
  field_type?: FieldType;
  display_order?: number;
  show_in_table?: boolean;
  show_in_form?: boolean;
  is_required?: boolean;
  validation_rules?: ValidationRules;
  options?: EnumOption[];
}

export interface ReorderCustomFieldSchemasRequest {
  schema_ids: string[];
}

// Cursor pagination
export interface CursorPaginatedCustomFieldSchemaResponse {
  items: CustomFieldSchema[];
  next_cursor: string | null;
  has_more: boolean;
}

// Field type metadata for UI
export interface FieldTypeOption {
  value: FieldType;
  label: string;
  icon: string;
  description: string;
  supportsOptions: boolean;
}

export const FIELD_TYPE_OPTIONS: FieldTypeOption[] = [
  {
    value: 'string',
    label: 'Text (Short)',
    icon: 'Type',
    description: 'Single line text input',
    supportsOptions: false,
  },
  {
    value: 'text',
    label: 'Text (Long)',
    icon: 'AlignLeft',
    description: 'Multi-line text area',
    supportsOptions: false,
  },
  {
    value: 'number',
    label: 'Number',
    icon: 'Hash',
    description: 'Numeric value',
    supportsOptions: false,
  },
  {
    value: 'currency',
    label: 'Currency',
    icon: 'DollarSign',
    description: 'Monetary value',
    supportsOptions: false,
  },
  {
    value: 'email',
    label: 'Email',
    icon: 'Mail',
    description: 'Email address',
    supportsOptions: false,
  },
  {
    value: 'phone',
    label: 'Phone',
    icon: 'Phone',
    description: 'Phone number',
    supportsOptions: false,
  },
  {
    value: 'url',
    label: 'URL',
    icon: 'Link',
    description: 'Website link',
    supportsOptions: false,
  },
  {
    value: 'date',
    label: 'Date',
    icon: 'Calendar',
    description: 'Date picker',
    supportsOptions: false,
  },
  {
    value: 'datetime',
    label: 'Date & Time',
    icon: 'Clock',
    description: 'Date and time picker',
    supportsOptions: false,
  },
  {
    value: 'timestamp',
    label: 'Timestamp',
    icon: 'Timer',
    description: 'Unix timestamp',
    supportsOptions: false,
  },
  {
    value: 'boolean',
    label: 'Yes/No',
    icon: 'ToggleLeft',
    description: 'Boolean checkbox',
    supportsOptions: false,
  },
  {
    value: 'enum',
    label: 'Dropdown',
    icon: 'List',
    description: 'Select from predefined options',
    supportsOptions: true,
  },
];

// System field keys that map to Lead entity properties
export const SYSTEM_FIELD_KEYS = [
  'name',
  'phone',
  'summary',
  'status',
  'notes',
  'created_at',
] as const;

export type SystemFieldKey = typeof SYSTEM_FIELD_KEYS[number];

// Reserved field keys that cannot be used
export const RESERVED_FIELD_KEYS = [
  'id',
  'agent_id',
  'name',
  'phone',
  'status',
  'summary',
  'created_at',
  'updated_at',
  'conversation_id',
  'notes',
  'custom_fields',
];
