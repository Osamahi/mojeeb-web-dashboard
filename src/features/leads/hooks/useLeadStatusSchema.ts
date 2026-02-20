/**
 * Hook for accessing lead status configuration from custom_field_schemas.
 *
 * Single source of truth for status options, transitions, colors, and labels.
 * Derives everything from the 'status' enum field in custom_field_schemas.
 *
 * Usage:
 *   const { statusOptions, getStatusLabel, getStatusColor, getInitialStatus, getAllowedTransitions } = useLeadStatusSchema();
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useCustomFieldSchemas } from './useCustomFieldSchemas';
import type { EnumOption } from '../types/customFieldSchema.types';

// Hardcoded fallback for edge cases (agent without schema, loading state)
const FALLBACK_OPTIONS: EnumOption[] = [
  { value: 'new', label_en: 'New', label_ar: 'جديد', color: '#00D084', is_initial: true, is_final: false, transitions: ['processing'] },
  { value: 'processing', label_en: 'Processing', label_ar: 'قيد المعالجة', color: '#FFB020', is_initial: false, is_final: false, transitions: ['completed', 'new'] },
  { value: 'completed', label_en: 'Completed', label_ar: 'مكتمل', color: '#6B7280', is_initial: false, is_final: true, transitions: [] },
];

export const useLeadStatusSchema = () => {
  const { data: schemas = [], isLoading } = useCustomFieldSchemas();
  const { i18n } = useTranslation();
  const isArabic = i18n.language.startsWith('ar');

  const statusSchema = useMemo(
    () => schemas.find((s) => s.field_key === 'status' && s.field_type === 'enum'),
    [schemas]
  );

  const statusOptions: EnumOption[] = useMemo(
    () => statusSchema?.options?.length ? statusSchema.options : FALLBACK_OPTIONS,
    [statusSchema]
  );

  /** Get localized label for a status value */
  const getStatusLabel = useMemo(() => {
    const map = new Map(statusOptions.map((opt) => [opt.value, opt]));
    return (status: string): string => {
      const opt = map.get(status);
      if (!opt) return status; // Unknown status: show raw value
      return isArabic ? opt.label_ar : opt.label_en;
    };
  }, [statusOptions, isArabic]);

  /** Get color for a status value */
  const getStatusColor = useMemo(() => {
    const map = new Map(statusOptions.map((opt) => [opt.value, opt.color || '#6B7280']));
    return (status: string): string => map.get(status) || '#6B7280';
  }, [statusOptions]);

  /** Get the initial status value (for new leads) */
  const initialStatus = useMemo(
    () => statusOptions.find((opt) => opt.is_initial)?.value || statusOptions[0]?.value || 'new',
    [statusOptions]
  );

  /** Get allowed transition targets from a given status */
  const getAllowedTransitions = useMemo(() => {
    const map = new Map(statusOptions.map((opt) => [opt.value, opt.transitions || []]));
    return (currentStatus: string): string[] => map.get(currentStatus) || [];
  }, [statusOptions]);

  /** Check if a transition is allowed */
  const isTransitionAllowed = useMemo(() => {
    const map = new Map(statusOptions.map((opt) => [opt.value, new Set(opt.transitions || [])]));
    return (from: string, to: string): boolean => {
      if (from === to) return true; // Same status is always allowed (idempotent)
      return map.get(from)?.has(to) || false;
    };
  }, [statusOptions]);

  return {
    /** All status options with labels, colors, transitions */
    statusOptions,
    /** The raw status schema row (for advanced use) */
    statusSchema,
    /** Whether schemas are still loading */
    isLoading,
    /** Get localized label for a status value */
    getStatusLabel,
    /** Get color hex for a status value */
    getStatusColor,
    /** The initial status for new leads */
    initialStatus,
    /** Get allowed next statuses from current status */
    getAllowedTransitions,
    /** Check if a specific transition is allowed */
    isTransitionAllowed,
  };
};
