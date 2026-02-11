/**
 * EnumOptionsEditor Component
 * Manages dropdown options for enum-type custom fields
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import type { EnumOption } from '../types/customFieldSchema.types';

interface EnumOptionsEditorProps {
  options: EnumOption[];
  onChange: (options: EnumOption[]) => void;
}

const DEFAULT_COLORS = [
  '#ef4444', // red
  '#f59e0b', // amber
  '#10b981', // green
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#6b7280', // gray
];

export function EnumOptionsEditor({ options, onChange }: EnumOptionsEditorProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';

  const addOption = () => {
    const newOption: EnumOption = {
      value: '',
      label_en: '',
      label_ar: '',
      color: DEFAULT_COLORS[options.length % DEFAULT_COLORS.length],
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

  const moveOption = (fromIndex: number, toIndex: number) => {
    const updated = [...options];
    const [movedItem] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, movedItem);
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-neutral-700">
          Dropdown Options
        </label>
        <button
          type="button"
          onClick={addOption}
          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Option
        </button>
      </div>

      {options.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-neutral-200 rounded-lg">
          <p className="text-sm text-neutral-500">No options yet. Click "Add Option" to create one.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {options.map((option, index) => (
            <div
              key={index}
              className="flex items-start gap-2 p-3 border border-neutral-200 rounded-lg hover:border-neutral-300 transition-colors bg-white"
            >
              {/* Drag Handle */}
              <button
                type="button"
                className="mt-2 cursor-move text-neutral-400 hover:text-neutral-600"
                onMouseDown={(e) => {
                  // Simple drag implementation - you can enhance this with a library like dnd-kit
                  e.preventDefault();
                }}
              >
                <GripVertical className="w-4 h-4" />
              </button>

              {/* Color Picker */}
              <div className="mt-2">
                <input
                  type="color"
                  value={option.color || DEFAULT_COLORS[0]}
                  onChange={(e) => updateOption(index, 'color', e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border border-neutral-300"
                  title="Option color"
                />
              </div>

              {/* Option Fields */}
              <div className="flex-1 grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={option.value}
                  onChange={(e) => updateOption(index, 'value', e.target.value)}
                  placeholder="value (e.g., high)"
                  className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
                <input
                  type="text"
                  value={option.label_en}
                  onChange={(e) => updateOption(index, 'label_en', e.target.value)}
                  placeholder="English label"
                  className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
                <input
                  type="text"
                  value={option.label_ar}
                  onChange={(e) => updateOption(index, 'label_ar', e.target.value)}
                  placeholder="Arabic label"
                  dir="rtl"
                  className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              {/* Delete Button */}
              <button
                type="button"
                onClick={() => removeOption(index)}
                className="mt-2 text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-colors"
                title="Remove option"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {options.length > 0 && options.some(opt => !opt.value || !opt.label_en || !opt.label_ar) && (
        <p className="text-xs text-amber-600">
          ⚠️ All options must have a value, English label, and Arabic label
        </p>
      )}
    </div>
  );
}
