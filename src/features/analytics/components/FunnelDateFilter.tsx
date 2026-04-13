import { useCallback } from 'react';
import type { DateRangePreset } from '../types/funnel.types';

interface FunnelDateFilterProps {
  selected: DateRangePreset;
  onChange: (preset: DateRangePreset) => void;
}

const presets: { value: DateRangePreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
];

export function FunnelDateFilter({ selected, onChange }: FunnelDateFilterProps) {
  return (
    <div className="flex gap-1">
      {presets.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            selected === p.value
              ? 'bg-neutral-900 text-white'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
