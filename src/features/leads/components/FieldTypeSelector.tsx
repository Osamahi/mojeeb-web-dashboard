/**
 * FieldTypeSelector Component
 * Dropdown selector for choosing custom field types
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronDown } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { FIELD_TYPE_OPTIONS, type FieldType } from '../types/customFieldSchema.types';

interface FieldTypeSelectorProps {
  value: FieldType;
  onChange: (type: FieldType) => void;
  disabled?: boolean;
}

export function FieldTypeSelector({ value, onChange, disabled }: FieldTypeSelectorProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = FIELD_TYPE_OPTIONS.find(opt => opt.value === value);

  const handleSelect = (type: FieldType) => {
    onChange(type);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full flex items-center justify-between px-3 py-2 border border-neutral-300 rounded-lg hover:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
      >
        <div className="flex items-center gap-2">
          {selectedOption && (
            <>
              {(() => {
                const IconComponent = (LucideIcons as any)[selectedOption.icon];
                return IconComponent ? <IconComponent className="w-4 h-4 text-neutral-600" /> : null;
              })()}
              <span className="text-sm font-medium text-neutral-900">{selectedOption.label}</span>
            </>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-neutral-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Menu */}
          <div className="absolute z-20 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
            {FIELD_TYPE_OPTIONS.map((option) => {
              const IconComponent = (LucideIcons as any)[option.icon];
              const isSelected = option.value === value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-neutral-50 transition-colors text-start"
                >
                  {IconComponent && <IconComponent className="w-5 h-5 text-neutral-600 flex-shrink-0 mt-0.5" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-neutral-900">{option.label}</span>
                      {isSelected && <Check className="w-4 h-4 text-primary-600 flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5">{option.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
