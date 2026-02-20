/**
 * CustomFieldSchemaModal Component
 * Main modal for managing custom field schemas (add, edit, sort, delete)
 * Uses BaseModal following project standards
 */

import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit2, Trash2, GripVertical, Table2 } from 'lucide-react';
import { BaseModal } from '@/components/ui/BaseModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { FieldTypeSelector } from './FieldTypeSelector';
import { EnumOptionsEditor } from './EnumOptionsEditor';
import { useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAgentContext } from '@/hooks/useAgentContext';
import {
  useCustomFieldSchemas,
  useCreateCustomFieldSchema,
  useUpdateCustomFieldSchema,
  useDeleteCustomFieldSchema,
  useReorderCustomFieldSchemas,
  customFieldSchemaKeys,
} from '../hooks/useCustomFieldSchemas';
import type {
  CustomFieldSchema,
  CreateCustomFieldSchemaRequest,
  FieldType,
  EnumOption,
} from '../types/customFieldSchema.types';
import { FIELD_TYPE_OPTIONS, RESERVED_FIELD_KEYS } from '../types/customFieldSchema.types';

interface CustomFieldSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ViewMode = 'list' | 'add' | 'edit';

export function CustomFieldSchemaModal({ isOpen, onClose }: CustomFieldSchemaModalProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';
  const queryClient = useQueryClient();
  const { agentId } = useAgentContext();

  // Clear cache when modal opens to force fresh data
  useEffect(() => {
    if (isOpen && agentId) {
      console.log('[CustomFieldSchemaModal] Modal opened, invalidating cache for agentId:', agentId);
      queryClient.invalidateQueries({ queryKey: customFieldSchemaKeys.all(agentId) });
    }
  }, [isOpen, agentId, queryClient]);

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingSchema, setEditingSchema] = useState<CustomFieldSchema | null>(null);
  const [deleteSchemaId, setDeleteSchemaId] = useState<string | null>(null);

  // Form state
  const [fieldKey, setFieldKey] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [fieldType, setFieldType] = useState<FieldType>('string');
  const [isRequired, setIsRequired] = useState(false);
  const [enumOptions, setEnumOptions] = useState<EnumOption[]>([]);

  // Queries and mutations
  const { data: schemas = [], isLoading } = useCustomFieldSchemas();
  const createMutation = useCreateCustomFieldSchema();
  const updateMutation = useUpdateCustomFieldSchema();
  const deleteMutation = useDeleteCustomFieldSchema();
  const reorderMutation = useReorderCustomFieldSchemas();

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Debug logging
  console.log('Custom Field Schemas Debug:', {
    schemasCount: schemas.length,
    isLoading,
    schemas: schemas.slice(0, 5), // First 5 for inspection
  });

  // Sorted schemas by display_order
  const sortedSchemas = useMemo(() => {
    return [...schemas].sort((a, b) => a.display_order - b.display_order);
  }, [schemas]);

  // Reset form
  const resetForm = () => {
    setFieldKey('');
    setNameEn('');
    setNameAr('');
    setFieldType('string');
    setIsRequired(false);
    setEnumOptions([]);
    setEditingSchema(null);
  };

  // Handle add button click
  const handleAddClick = () => {
    resetForm();
    setViewMode('add');
  };

  // Handle edit button click
  const handleEditClick = (schema: CustomFieldSchema) => {
    setEditingSchema(schema);
    setFieldKey(schema.field_key);
    setNameEn(schema.name_en);
    setNameAr(schema.name_ar);
    setFieldType(schema.field_type);
    setIsRequired(schema.is_required);
    setEnumOptions(schema.options || []);
    setViewMode('edit');
  };

  // Handle cancel
  const handleCancel = () => {
    resetForm();
    setViewMode('list');
  };

  // Validate form
  const validateForm = (): string | null => {
    if (!fieldKey.trim()) return 'Field key is required';
    if (!nameEn.trim()) return 'English name is required';
    if (!nameAr.trim()) return 'Arabic name is required';

    // Check if field key is valid (snake_case)
    if (!/^[a-z][a-z0-9_]*$/.test(fieldKey)) {
      return 'Field key must start with lowercase letter and contain only lowercase letters, numbers, and underscores';
    }

    // Check if field key is reserved
    if (RESERVED_FIELD_KEYS.includes(fieldKey)) {
      return `Field key "${fieldKey}" is reserved and cannot be used`;
    }

    // Check for duplicate field keys (only for new schemas)
    if (viewMode === 'add') {
      const isDuplicate = schemas.some(s => s.field_key === fieldKey);
      if (isDuplicate) {
        return `Field key "${fieldKey}" already exists`;
      }
    }

    // Validate enum options
    if (fieldType === 'enum') {
      if (enumOptions.length === 0) {
        return 'Dropdown fields must have at least one option';
      }
      const hasInvalidOptions = enumOptions.some(opt => !opt.value || !opt.label_en || !opt.label_ar);
      if (hasInvalidOptions) {
        return 'All dropdown options must have a value, English label, and Arabic label';
      }
    }

    return null;
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }

    const requestData: CreateCustomFieldSchemaRequest = {
      field_key: fieldKey,
      name_en: nameEn,
      name_ar: nameAr,
      field_type: fieldType,
      show_in_table: true, // Always enabled
      show_in_form: true, // Always enabled
      is_required: isRequired,
      display_order: viewMode === 'add' ? schemas.length : editingSchema?.display_order,
      ...(fieldType === 'enum' && { options: enumOptions }),
    };

    if (viewMode === 'add') {
      createMutation.mutate(requestData, {
        onSuccess: () => {
          handleCancel();
        },
      });
    } else if (viewMode === 'edit' && editingSchema) {
      updateMutation.mutate(
        { schemaId: editingSchema.id, data: requestData },
        {
          onSuccess: () => {
            handleCancel();
          },
        }
      );
    }
  };

  // Handle delete
  const handleDelete = (schemaId: string) => {
    setDeleteSchemaId(schemaId);
  };

  const confirmDelete = () => {
    if (deleteSchemaId) {
      deleteMutation.mutate(deleteSchemaId, {
        onSuccess: () => {
          setDeleteSchemaId(null);
        },
      });
    }
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sortedSchemas.findIndex((s) => s.id === active.id);
      const newIndex = sortedSchemas.findIndex((s) => s.id === over.id);

      const newOrder = arrayMove(sortedSchemas, oldIndex, newIndex);
      const schemaIds = newOrder.map((s) => s.id);

      // Call reorder mutation
      reorderMutation.mutate({ schema_ids: schemaIds });
    }
  };

  // Get modal title based on mode
  const getModalTitle = () => {
    if (viewMode === 'add') return 'Add Custom Field';
    if (viewMode === 'edit') return 'Edit Custom Field';
    return 'Manage Custom Fields';
  };

  // Get modal subtitle
  const getModalSubtitle = () => {
    if (viewMode === 'list') return 'Configure custom fields for your leads table';
    return 'Define the custom field properties';
  };

  const selectedFieldTypeOption = FIELD_TYPE_OPTIONS.find(opt => opt.value === fieldType);

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title={getModalTitle()}
        subtitle={getModalSubtitle()}
        maxWidth="2xl"
        isLoading={createMutation.isPending || updateMutation.isPending}
        closable={!createMutation.isPending && !updateMutation.isPending}
      >
        {viewMode === 'list' ? (
          // List View
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-neutral-600">
                {sortedSchemas.length} custom field{sortedSchemas.length !== 1 ? 's' : ''}
              </p>
              <Button
                onClick={handleAddClick}
                variant="primary"
                size="sm"
              >
                <Plus className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                Add Field
              </Button>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-mojeeb"></div>
                <p className="text-sm text-neutral-500 mt-2">Loading...</p>
              </div>
            ) : sortedSchemas.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-neutral-200 rounded-lg">
                <Table2 className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                <p className="text-neutral-600 font-medium mb-1">No custom fields yet</p>
                <p className="text-sm text-neutral-500 mb-4">Add your first custom field to get started</p>
                <Button
                  onClick={handleAddClick}
                  variant="primary"
                  size="md"
                >
                  <Plus className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                  Add Field
                </Button>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={sortedSchemas.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {sortedSchemas.map((schema) => (
                      <SortableSchemaItem
                        key={schema.id}
                        schema={schema}
                        isRTL={isRTL}
                        onEdit={handleEditClick}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        ) : (
          // Add/Edit Form View
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Field Key */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Field Key *
                </label>
                <input
                  type="text"
                  value={fieldKey}
                  onChange={(e) => setFieldKey(e.target.value.toLowerCase())}
                  placeholder="e.g., customer_company"
                  disabled={viewMode === 'edit'}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-cyan/20 focus:border-brand-cyan disabled:bg-neutral-100 disabled:cursor-not-allowed"
                  required
                />
                {viewMode === 'add' && (
                  <p className="text-xs text-neutral-500 mt-1">
                    Lowercase letters, numbers, underscores only. Cannot be changed after creation.
                  </p>
                )}
              </div>

              {/* Field Type */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Field Type *
                </label>
                <FieldTypeSelector
                  value={fieldType}
                  onChange={(type) => {
                    setFieldType(type);
                    if (type !== 'enum') setEnumOptions([]);
                  }}
                  disabled={viewMode === 'edit'}
                />
              </div>
            </div>

            {/* English Name */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                English Label *
              </label>
              <input
                type="text"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="e.g., Company Name"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-cyan/20 focus:border-brand-cyan"
                required
              />
            </div>

            {/* Arabic Name */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Arabic Label *
              </label>
              <input
                type="text"
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                placeholder="e.g., اسم الشركة"
                dir="rtl"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-cyan/20 focus:border-brand-cyan"
                required
              />
            </div>

            {/* Enum Options */}
            {fieldType === 'enum' && (
              <EnumOptionsEditor
                options={enumOptions}
                onChange={setEnumOptions}
                protectedValues={fieldKey === 'status' ? ['new'] : undefined}
              />
            )}

            {/* Checkboxes */}
            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRequired}
                  onChange={(e) => setIsRequired(e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-300 focus:ring-2 focus:ring-brand-cyan/20"
                  style={{ accentColor: '#00D084' }}
                />
                <span className="text-sm text-neutral-700">Required field</span>
              </label>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
              <Button
                type="button"
                variant="secondary"
                onClick={handleCancel}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                Back
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={createMutation.isPending || updateMutation.isPending}
              >
                {viewMode === 'add' ? 'Create Field' : 'Update Field'}
              </Button>
            </div>
          </form>
        )}
      </BaseModal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteSchemaId}
        title="Delete Custom Field"
        message="Are you sure you want to delete this custom field? This action cannot be undone."
        confirmText="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteSchemaId(null)}
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}

// Sortable Item Component for Drag and Drop
interface SortableSchemaItemProps {
  schema: CustomFieldSchema;
  isRTL: boolean;
  onEdit: (schema: CustomFieldSchema) => void;
  onDelete: (id: string) => void;
}

function SortableSchemaItem({ schema, isRTL, onEdit, onDelete }: SortableSchemaItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: schema.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-4 border border-neutral-200 rounded-lg hover:border-neutral-300 transition-colors bg-white"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical className="w-5 h-5 text-neutral-400 flex-shrink-0" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-neutral-900">
            {isRTL ? schema.name_ar : schema.name_en}
          </span>
          <span className="text-xs px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded">
            {schema.field_key}
          </span>
          <span className="text-xs px-2 py-0.5 bg-brand-mojeeb/10 text-brand-mojeeb rounded font-medium">
            {FIELD_TYPE_OPTIONS.find(opt => opt.value === schema.field_type)?.label}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
          {schema.is_required && <span>✓ Required</span>}
          {schema.field_type === 'enum' && <span>({schema.options?.length || 0} options)</span>}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onEdit(schema)}
          className="p-2 text-neutral-600 hover:text-brand-mojeeb hover:bg-brand-mojeeb/10 rounded-lg transition-colors"
          title="Edit"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(schema.id)}
          className="p-2 text-neutral-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
