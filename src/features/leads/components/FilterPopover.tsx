/**
 * FilterPopover Component
 * Popover for selecting date range filters
 * Used in compact inline toolbar (Linear/Notion style)
 */

import { useState, useRef, useEffect } from 'react';
import { Calendar, X } from 'lucide-react';
import { format, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { useTranslation } from 'react-i18next';
import type { DatePreset } from '../types';

interface FilterPopoverProps {
  activePreset: DatePreset | null;
  dateFrom?: string;
  dateTo?: string;
  onApply: (preset: DatePreset, dateFrom?: string, dateTo?: string) => void;
  onClose: () => void;
}

export function FilterPopover({ activePreset, dateFrom, dateTo, onApply, onClose }: FilterPopoverProps) {
  const { t } = useTranslation();
  const [selectedPreset, setSelectedPreset] = useState<DatePreset | null>(activePreset);
  const [customFrom, setCustomFrom] = useState(dateFrom || '');
  const [customTo, setCustomTo] = useState(dateTo || '');
  const popoverRef = useRef<HTMLDivElement>(null);

  const presets: Array<{ value: DatePreset; label: string }> = [
    { value: 'today', label: t('filter_popover.today') },
    { value: 'last7days', label: t('filter_popover.last_7_days') },
    { value: 'last30days', label: t('filter_popover.last_30_days') },
    { value: 'thisMonth', label: t('filter_popover.this_month') },
    { value: 'custom', label: t('filter_popover.custom_range') },
  ];

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handlePresetClick = (preset: DatePreset) => {
    setSelectedPreset(preset);

    if (preset === 'custom') {
      // Don't auto-apply for custom - wait for user to fill dates
      return;
    }

    // Calculate date ranges for presets
    const now = new Date();
    let calculatedFrom: string;
    let calculatedTo: string = format(endOfDay(now), 'yyyy-MM-dd');

    switch (preset) {
      case 'today':
        calculatedFrom = format(startOfDay(now), 'yyyy-MM-dd');
        break;
      case 'last7days':
        calculatedFrom = format(subDays(now, 7), 'yyyy-MM-dd');
        break;
      case 'last30days':
        calculatedFrom = format(subDays(now, 30), 'yyyy-MM-dd');
        break;
      case 'thisMonth':
        calculatedFrom = format(startOfMonth(now), 'yyyy-MM-dd');
        calculatedTo = format(endOfMonth(now), 'yyyy-MM-dd');
        break;
      default:
        return;
    }

    onApply(preset, calculatedFrom, calculatedTo);
    onClose();
  };

  const handleCustomApply = () => {
    if (!customFrom && !customTo) return;

    onApply('custom', customFrom || undefined, customTo || undefined);
    onClose();
  };

  return (
    <div
      ref={popoverRef}
      className="absolute top-full left-0 mt-2 w-72 bg-white rounded-lg border border-neutral-200 shadow-lg z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-neutral-600" />
          <span className="text-sm font-medium text-neutral-900">{t('filter_popover.date_range')}</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-neutral-100 rounded transition-colors"
        >
          <X className="w-4 h-4 text-neutral-500" />
        </button>
      </div>

      {/* Preset Options */}
      <div className="p-2">
        {presets.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => handlePresetClick(value)}
            className={`
              w-full px-3 py-2 text-left text-sm rounded-md transition-colors
              ${
                selectedPreset === value
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-700 hover:bg-neutral-50'
              }
            `}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Custom Date Inputs */}
      {selectedPreset === 'custom' && (
        <div className="p-4 border-t border-neutral-200 space-y-3">
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              {t('filter_popover.from_date')}
            </label>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:ring-2 focus:ring-black focus:border-black"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              {t('filter_popover.to_date')}
            </label>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:ring-2 focus:ring-black focus:border-black"
            />
          </div>
          <button
            onClick={handleCustomApply}
            disabled={!customFrom && !customTo}
            className="w-full px-4 py-2 text-sm font-medium bg-black text-white rounded-md hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t('filter_popover.apply_custom')}
          </button>
        </div>
      )}
    </div>
  );
}
