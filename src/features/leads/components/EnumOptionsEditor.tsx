/**
 * EnumOptionsEditor Component
 * Manages dropdown options for enum-type custom fields with drag-and-drop sorting
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { EnumOption } from '../types/customFieldSchema.types';

interface EnumOptionsEditorProps {
  options: EnumOption[];
  onChange: (options: EnumOption[]) => void;
  /** Values that cannot be edited (key) or deleted (e.g., ['new'] for status field) */
  protectedValues?: string[];
}

interface SortableOptionItemProps {
  id: string;
  option: EnumOption;
  index: number;
  isProtected: boolean;
  onUpdate: (index: number, field: keyof EnumOption, value: string) => void;
  onRemove: (index: number) => void;
}

function SortableOptionItem({ id, option, index, isProtected, onUpdate, onRemove }: SortableOptionItemProps) {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: isProtected });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-2 p-3 border border-neutral-200 rounded-lg hover:border-neutral-300 transition-colors bg-white"
    >
      {/* Drag Handle */}
      <div
        {...(isProtected ? {} : { ...attributes, ...listeners })}
        className={`mt-2 ${isProtected ? 'text-neutral-200 cursor-default' : 'cursor-grab active:cursor-grabbing touch-none text-neutral-400 hover:text-neutral-600'}`}
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Color Picker */}
      <div className="mt-2">
        <input
          type="color"
          value={option.color || '#000000'}
          onChange={(e) => onUpdate(index, 'color', e.target.value)}
          className="w-8 h-8 rounded cursor-pointer border border-neutral-300"
          title={t('leads.option_color')}
        />
      </div>

      {/* Option Fields */}
      <div className="flex-1 grid grid-cols-3 gap-2">
        <input
          type="text"
          value={option.value}
          onChange={(e) => onUpdate(index, 'value', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
          placeholder={t('leads.option_key_placeholder')}
          disabled={isProtected}
          className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-neutral-50 disabled:text-neutral-500 disabled:cursor-not-allowed"
          required
        />
        <input
          type="text"
          value={option.label_en}
          onChange={(e) => onUpdate(index, 'label_en', e.target.value)}
          placeholder={t('leads.english_label')}
          className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          required
        />
        <input
          type="text"
          value={option.label_ar}
          onChange={(e) => onUpdate(index, 'label_ar', e.target.value)}
          placeholder={t('leads.arabic_label')}
          dir="rtl"
          className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          required
        />
      </div>

      {/* Delete Button */}
      <button
        type="button"
        onClick={() => !isProtected && onRemove(index)}
        disabled={isProtected}
        className={`mt-2 p-1 rounded transition-colors ${isProtected ? 'text-neutral-200 cursor-default' : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50'}`}
        title={isProtected ? undefined : t('leads.remove_option')}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

export function EnumOptionsEditor({ options, onChange, protectedValues = [] }: EnumOptionsEditorProps) {
  const { t } = useTranslation();
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Stable IDs for sortable items (use value if unique, fallback to index-based)
  const sortableIds = useMemo(
    () => options.map((_, i) => `option-${i}`),
    [options.length]
  );

  const addOption = () => {
    const newOption: EnumOption = {
      value: '',
      label_en: '',
      label_ar: '',
      color: '#000000',
    };
    onChange([...options, newOption]);
  };

  const updateOption = (index: number, field: keyof EnumOption, value: string) => {
    const updated = [...options];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeOption = (index: number) => {
    onChange(options.filter((_, i) => i !== index));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sortableIds.indexOf(active.id as string);
    const newIndex = sortableIds.indexOf(over.id as string);

    onChange(arrayMove(options, oldIndex, newIndex));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-neutral-700">
          {t('leads.dropdown_options_label')}
        </label>
        <button
          type="button"
          onClick={addOption}
          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('leads.add_option')}
        </button>
      </div>

      {options.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-neutral-200 rounded-lg">
          <p className="text-sm text-neutral-500">{t('leads.no_options_yet')}</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {options.map((option, index) => (
                <SortableOptionItem
                  key={sortableIds[index]}
                  id={sortableIds[index]}
                  option={option}
                  index={index}
                  isProtected={protectedValues.includes(option.value)}
                  onUpdate={updateOption}
                  onRemove={removeOption}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
