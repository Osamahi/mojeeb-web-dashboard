/**
 * User picker field for coupon forms.
 *
 * Wraps the existing /api/organization/search-users endpoint (searches name, email, phone)
 * and returns the selected user's id. Kept deliberately light — the heavy lifting lives in
 * `organizationService.searchUsers` + the shared UserSearchResult type.
 *
 * Used for both:
 *   - "Affiliate user" (who earns credit for each redemption)
 *   - "Locked to user" (who is the only person who can redeem)
 */

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Search, X, Loader2, User as UserIcon } from 'lucide-react';
import { organizationService } from '@/features/organizations/services/organizationService';
import type { UserSearchResult } from '@/features/organizations/types';

interface UserPickerFieldProps {
  /** Current user id (may be null / empty). */
  value: string | null | undefined;
  /** Called with the newly selected user id, or null when cleared. */
  onChange: (userId: string | null) => void;
  /** Optional: pre-resolved display for the current value (shown as a chip). */
  initialUser?: UserSearchResult | null;
  placeholder?: string;
  disabled?: boolean;
  /**
   * When `value` is set but no `initialUser` is supplied (e.g. editing a coupon loaded
   * by ID only), show this opaque chip so the admin knows a value is stored. Clicking
   * "Change" clears it and re-opens the picker.
   */
  fallbackLabel?: string;
}

export function UserPickerField({
  value,
  onChange,
  initialUser,
  placeholder,
  disabled,
  fallbackLabel,
}: UserPickerFieldProps) {
  const { t } = useTranslation();
  const rootRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(initialUser ?? null);

  // Sync with props. Covers two cases:
  //   1. Parent clears `value` (Change button / form reset) → drop the chip.
  //   2. Parent supplies an `initialUser` AFTER mount (common in Edit modals
  //      where the coupon data arrives via prop after the modal is already
  //      mounted for a different coupon). The useState initializer only runs
  //      on first mount; without this effect, the chip would keep showing
  //      whichever user was initial at mount time.
  useEffect(() => {
    if (!value) {
      setSelectedUser(null);
      return;
    }
    if (initialUser && initialUser.id === value) {
      setSelectedUser(initialUser);
    }
  }, [value, initialUser]);

  // Debounce the search query (300ms — matches existing UserSearchDropdown).
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const { data: results = [], isLoading } = useQuery({
    queryKey: ['user-search', debouncedQuery],
    queryFn: () => organizationService.searchUsers(debouncedQuery),
    enabled: debouncedQuery.trim().length >= 2,
    staleTime: 30_000,
  });

  // Close on outside click.
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const handleSelect = (user: UserSearchResult) => {
    setSelectedUser(user);
    onChange(user.id);
    setSearchQuery('');
    setShowDropdown(false);
  };

  const handleClear = () => {
    setSelectedUser(null);
    onChange(null);
    setSearchQuery('');
  };

  // Opaque chip — we have an id but no resolved user (e.g. editing a coupon).
  if (value && !selectedUser) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-md border border-neutral-300 bg-neutral-50 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-neutral-200">
            <UserIcon className="h-3 w-3 text-neutral-600" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm text-neutral-900">
              {fallbackLabel || t('user_picker.current_user', 'Current user')}
            </div>
            <div className="truncate font-mono text-xs text-neutral-500">{value}</div>
          </div>
        </div>
        {!disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="flex-shrink-0 rounded px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900"
          >
            {t('common.change', 'Change')}
          </button>
        )}
      </div>
    );
  }

  // Selected chip display (when we have a user).
  if (selectedUser && value) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-md border border-neutral-300 bg-neutral-50 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-neutral-200">
            <UserIcon className="h-3 w-3 text-neutral-600" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-neutral-900">
              {selectedUser.name || selectedUser.email}
            </div>
            <div className="truncate text-xs text-neutral-500">
              {selectedUser.email}
              {selectedUser.phone && ` · ${selectedUser.phone}`}
            </div>
          </div>
        </div>
        {!disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="flex-shrink-0 rounded p-1 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700"
            aria-label={t('common.clear', 'Clear')}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  // Empty state — show search input.
  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder={placeholder || t('user_picker.placeholder', 'Search by name, email, or phone…')}
          disabled={disabled}
          className="w-full rounded-md border border-neutral-300 py-2 pl-9 pr-3 text-sm disabled:opacity-50"
        />
      </div>

      {showDropdown && (
        <div className="absolute z-[100] mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-neutral-200 bg-white shadow-lg">
          {searchQuery.trim().length < 2 ? (
            <div className="p-3 text-center text-xs text-neutral-500">
              {t('user_picker.min_chars', 'Type at least 2 characters to search.')}
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center gap-2 p-3 text-xs text-neutral-500">
              <Loader2 className="h-3 w-3 animate-spin" />
              {t('common.loading', 'Loading…')}
            </div>
          ) : results.length === 0 ? (
            <div className="p-3 text-center text-xs text-neutral-500">
              {t('user_picker.no_results', 'No users match "{{query}}"', { query: searchQuery })}
            </div>
          ) : (
            <div className="py-1">
              {results.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleSelect(user)}
                  className="flex w-full items-start gap-3 px-3 py-2 text-left hover:bg-neutral-50"
                >
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-neutral-100">
                    <UserIcon className="h-3.5 w-3.5 text-neutral-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-neutral-900">
                      {user.name || user.email}
                    </div>
                    <div className="truncate text-xs text-neutral-500">
                      {user.email}
                      {user.phone && ` · ${user.phone}`}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
