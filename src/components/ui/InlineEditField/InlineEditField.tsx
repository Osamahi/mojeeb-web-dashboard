import React, { useState, useRef, useEffect } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PhoneNumber } from '@/components/ui/PhoneNumber';

interface InlineEditFieldProps {
  value: string | null;
  placeholder?: string;
  onSave: (newValue: string) => Promise<void>;
  validationFn?: (value: string) => { valid: boolean; error?: string };
  isPhone?: boolean;
  isLoading?: boolean;
  /**
   * Native HTML input type. Defaults to 'text'. Used to render type-aware
   * editors (numeric keypad on mobile for 'number', native date picker for
   * 'date', etc.). The save value is still a string — schema-driven parsing
   * happens at the API layer.
   */
  inputType?: 'text' | 'number' | 'email' | 'url' | 'tel' | 'date' | 'datetime-local';
  /** Optional `step` attribute, mainly for 'number' (e.g. 0.01 for currency). */
  inputStep?: string;
  /**
   * Typography classes for the display-state span (text size + color).
   * Defaults to `text-sm text-neutral-900`. Override per surface to match
   * the surrounding cell typography (e.g. the leads table uses 13px to
   * align with the Notes column).
   */
  displayClassName?: string;
  /**
   * Optional renderer for the filled-state display. When omitted the value
   * is rendered as plain text (or via PhoneNumber when `isPhone`). Used to
   * style a value as a link (mailto/url), a colored badge, etc., while
   * keeping the click-to-edit affordance intact.
   */
  renderValue?: (value: string) => React.ReactNode;
}

export const InlineEditField: React.FC<InlineEditFieldProps> = ({
  value,
  placeholder,
  onSave,
  validationFn,
  isPhone = false,
  isLoading = false,
  inputType = 'text',
  inputStep,
  displayClassName = 'text-sm text-neutral-900',
  renderValue,
}) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditValue(value || '');
    setError(null);
  };

  const handleCancel = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsEditing(false);
    setEditValue(value || '');
    setError(null);
  };

  const handleSave = async (e?: React.MouseEvent) => {
    e?.stopPropagation();

    const trimmedValue = editValue.trim();

    // Validate
    if (validationFn) {
      const validation = validationFn(trimmedValue);
      if (!validation.valid) {
        setError(validation.error || t('inline_edit.invalid_value'));
        return;
      }
    }

    // Don't save if value hasn't changed
    if (trimmedValue === (value || '')) {
      setIsEditing(false);
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      await onSave(trimmedValue);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('inline_edit.save_failed'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  const handleInputClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Display Mode
  if (!isEditing) {
    const isEmpty = !value || value.trim() === '';

    return (
      <div
        onClick={handleStartEdit}
        className="inline-flex items-center gap-2 px-2 py-1 -mx-2 -my-1 rounded transition-colors group cursor-pointer hover:bg-neutral-50"
      >
        {isEmpty ? (
          <span className="text-sm text-neutral-400">
            {t('inline_edit.add_field')}
          </span>
        ) : (
          <>
            {renderValue ? (
              renderValue(value!)
            ) : isPhone ? (
              <PhoneNumber value={value!} className={displayClassName} />
            ) : (
              <span className={displayClassName}>{value}</span>
            )}
            <Pencil className="w-3 h-3 text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </>
        )}
      </div>
    );
  }

  // Edit Mode
  return (
    <div onClick={(e) => e.stopPropagation()} className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type={inputType}
          step={inputStep}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onClick={handleInputClick}
          placeholder={placeholder || t('inline_edit.enter_value')}
          disabled={isSaving || isLoading}
          className="flex-1 px-2 py-1 text-sm text-neutral-900 bg-white border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-black focus:border-black disabled:bg-neutral-50 disabled:cursor-not-allowed min-w-[150px]"
        />

        <button
          onClick={handleSave}
          disabled={isSaving || isLoading}
          className="flex items-center justify-center w-7 h-7 bg-black text-white rounded hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={t('inline_edit.save')}
        >
          {isSaving ? (
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
        </button>

        <button
          onClick={handleCancel}
          disabled={isSaving || isLoading}
          className="flex items-center justify-center w-7 h-7 border border-neutral-300 text-neutral-700 rounded hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={t('inline_edit.cancel')}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <span className="text-xs text-red-600">{error}</span>
      )}
    </div>
  );
};
