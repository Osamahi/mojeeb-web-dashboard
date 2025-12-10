import React, { useState, useRef, useEffect } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { formatPhoneNumber } from '@/features/leads/utils/formatting';

interface InlineEditFieldProps {
  value: string | null;
  fieldName: string;
  placeholder?: string;
  onSave: (newValue: string) => Promise<void>;
  validationFn?: (value: string) => { valid: boolean; error?: string };
  isPhone?: boolean;
  isLoading?: boolean;
}

export const InlineEditField: React.FC<InlineEditFieldProps> = ({
  value,
  fieldName,
  placeholder,
  onSave,
  validationFn,
  isPhone = false,
  isLoading = false,
}) => {
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
        setError(validation.error || 'Invalid value');
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
      setError(err instanceof Error ? err.message : 'Failed to save');
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
    const displayValue = isPhone && value ? formatPhoneNumber(value) : value;

    return (
      <div
        onClick={handleStartEdit}
        className="group cursor-pointer inline-flex items-center gap-2 hover:bg-neutral-50 px-2 py-1 -mx-2 -my-1 rounded transition-colors"
      >
        {isEmpty ? (
          <>
            <span className="text-sm text-neutral-400">
              Add {fieldName}
            </span>
          </>
        ) : (
          <>
            <span className="text-sm text-neutral-900">
              {displayValue}
            </span>
            <Pencil className="w-3.5 h-3.5 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
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
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onClick={handleInputClick}
          placeholder={placeholder || `Enter ${fieldName.toLowerCase()}`}
          disabled={isSaving || isLoading}
          className="flex-1 px-2 py-1 text-sm text-neutral-900 bg-white border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-black focus:border-black disabled:bg-neutral-50 disabled:cursor-not-allowed min-w-[150px]"
        />

        <button
          onClick={handleSave}
          disabled={isSaving || isLoading}
          className="flex items-center justify-center w-7 h-7 bg-black text-white rounded hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Save"
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
          title="Cancel"
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
