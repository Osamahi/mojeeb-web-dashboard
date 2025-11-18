/**
 * Editable Title Component
 * Click to edit inline, auto-save on blur
 * Minimal design with hover state
 */

import { useState, useRef, useEffect } from 'react';
import { Edit2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditableTitleProps {
  value: string;
  onSave: (newValue: string) => Promise<void>;
  className?: string;
  suffix?: string; // e.g., " Knowledge"
}

export function EditableTitle({
  value,
  onSave,
  className = '',
  suffix = '',
}: EditableTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = async () => {
    if (editValue.trim() === '' || editValue === value) {
      setIsEditing(false);
      setEditValue(value);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(editValue.trim());
      setIsEditing(false);
    } catch (error) {
      // Reset to original value on error
      setEditValue(value);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          className={cn(
            'px-3 py-1 rounded-lg border border-neutral-300',
            'focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent',
            'disabled:opacity-50',
            className
          )}
        />
        <span className={cn('text-neutral-600', className)}>{suffix}</span>
        {isSaving && (
          <div className="flex items-center gap-1 text-xs text-neutral-500">
            <div className="w-3 h-3 border-2 border-neutral-300 border-t-black rounded-full animate-spin" />
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="group flex items-center gap-2 hover:opacity-70 transition-opacity"
    >
      <h1 className={cn('text-left', className)}>
        {value}
        {suffix}
      </h1>
      <Edit2 className="w-4 h-4 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}
