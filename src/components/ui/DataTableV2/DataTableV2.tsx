/**
 * DataTableV2
 *
 * Headless table powered by `@tanstack/react-table`. Replaces the hand-rolled
 * `DataTable` for surfaces that need:
 *   - Sticky-left identity column + sticky-right actions column with
 *     edge-fade shadow indicators (Stripe / Linear / Notion pattern)
 *   - User-controllable column visibility (Notion / Airtable-style chooser)
 *   - Density presets (Compact / Regular / Relaxed)
 *   - Horizontal scroll on narrow viewports, no card-mode fallback
 *   - RTL-aware (uses logical CSS — start-0 / end-0)
 *
 * This component is INTENTIONALLY a thin shell. TanStack owns row/column/
 * visibility state; we own the DOM and the styling. The consumer passes a
 * normal `ColumnDef[]` from `@tanstack/react-table`, plus optional toolbar
 * controls and a state-persistence key.
 *
 * State persistence: pass `tableId` to persist column visibility, density,
 * and pinning to localStorage (`mojeeb.table.<tableId>`). Without it the
 * state lives only for the component's lifetime.
 */

import { useMemo, useState, useEffect, useCallback, useRef, type CSSProperties } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type ColumnPinningState,
  type VisibilityState,
  type Row,
  type Column,
  type RowData,
} from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useScrollEdgeShadow } from '@/hooks/useScrollEdgeShadow';
import { ColumnChooser, type ColumnChooserItem } from './ColumnChooser';
import {
  DensityToggle,
  DENSITY_CELL_PADDING_CLASS,
  type TableDensity,
} from './DensityToggle';

export interface DataTableV2Props<T> {
  /** Row data. */
  data: T[];
  /** TanStack column definitions. */
  columns: ColumnDef<T, any>[];

  /**
   * Unique key for persisting visibility / density / pinning to localStorage.
   * Omit to skip persistence.
   */
  tableId?: string;

  /** Click handler for a row (skipped when click bubbles from a cell that stops propagation). */
  onRowClick?: (row: T) => void;

  /** Default column pinning. Most consumers want their identity column left + actions right. */
  initialColumnPinning?: ColumnPinningState;

  /** Default visibility (e.g. show only N columns out of many on first load). */
  initialColumnVisibility?: VisibilityState;

  /** Default density. */
  initialDensity?: TableDensity;

  /** Optional content rendered before the toolbar controls (left side). */
  toolbarStart?: React.ReactNode;
  /** Optional extra content on the right side of the toolbar. */
  toolbarEnd?: React.ReactNode;

  /** Show the built-in column chooser. Defaults to true. */
  showColumnChooser?: boolean;
  /** Show the built-in density toggle. Defaults to true. */
  showDensityToggle?: boolean;

  /** Optional empty-state node when `data.length === 0`. */
  emptyState?: React.ReactNode;

  /** Rendered below the table (e.g. infinite-scroll sentinel, "load more" spinner). */
  footer?: React.ReactNode;
}

// ----------------------------------------------------------------------------
// Persistence helpers
// ----------------------------------------------------------------------------

const STORAGE_PREFIX = 'mojeeb.table';

interface PersistedTableState {
  columnVisibility?: VisibilityState;
  columnPinning?: ColumnPinningState;
  density?: TableDensity;
}

function readPersisted(tableId: string | undefined): PersistedTableState {
  if (!tableId || typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}.${tableId}`);
    if (!raw) return {};
    return JSON.parse(raw) as PersistedTableState;
  } catch {
    return {};
  }
}

function writePersisted(tableId: string | undefined, value: PersistedTableState): void {
  if (!tableId || typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}.${tableId}`, JSON.stringify(value));
  } catch {
    // Quota exceeded / disabled storage — ignore; state still works in-memory.
  }
}

// ----------------------------------------------------------------------------
// Sticky column helper — turns TanStack's pinning state into the CSS we need
// ----------------------------------------------------------------------------

interface StickyStyle {
  className: string;
  style?: CSSProperties;
}

/**
 * Generate the sticky-positioning styles for a pinned column. Uses logical
 * `inset-inline-*` values so RTL flips naturally without per-direction code.
 *
 * The shadow is conditional — only the "edge" pinned columns (leftmost in
 * left-pinned group, rightmost in right-pinned group) get the shadow that
 * separates pinned content from the scrolling middle. The shadow itself is
 * inset-only here; the scroll-position-driven fade is handled by the wrapper.
 */
function getStickyCellStyle<T>(
  column: Column<T, unknown>,
  isHeader: boolean,
  showStartShadow: boolean,
  showEndShadow: boolean,
): StickyStyle {
  const pin = column.getIsPinned();
  if (!pin) return { className: '' };

  const isLastLeft = pin === 'left' && column.getIsLastColumn('left');
  const isFirstRight = pin === 'right' && column.getIsFirstColumn('right');

  // Body cells need an opaque bg so scrolling content doesn't show through.
  // We use bg-white as the base and let the row's group-hover paint over.
  const baseBg = isHeader
    ? 'bg-neutral-50'
    : 'bg-white group-hover/row:bg-neutral-50';

  // Logical inset: start (LTR=left, RTL=right) and end (LTR=right, RTL=left).
  const offsetStyle: CSSProperties = {};
  if (pin === 'left') {
    offsetStyle.insetInlineStart = `${column.getStart('left')}px`;
  } else {
    offsetStyle.insetInlineEnd = `${column.getAfter('right')}px`;
  }

  const showShadow =
    (isLastLeft && showStartShadow) || (isFirstRight && showEndShadow);

  return {
    className: cn(
      'sticky',
      baseBg,
      isHeader ? 'z-20' : 'z-10',
      // Inset shadow on the inner edge of the pinned column when there is
      // content scrolled under it. Direction-aware via the boolean above.
      showShadow && isLastLeft && 'shadow-[inset_-1px_0_0_rgba(0,0,0,0.06)]',
      showShadow && isFirstRight && 'shadow-[inset_1px_0_0_rgba(0,0,0,0.06)]',
    ),
    style: offsetStyle,
  };
}

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

export function DataTableV2<T>({
  data,
  columns,
  tableId,
  onRowClick,
  initialColumnPinning,
  initialColumnVisibility,
  initialDensity = 'regular',
  toolbarStart,
  toolbarEnd,
  showColumnChooser = true,
  showDensityToggle = true,
  emptyState,
  footer,
}: DataTableV2Props<T>) {
  const { t } = useTranslation();

  // ---- Persisted state ----
  const persistedRef = useRef<PersistedTableState>(readPersisted(tableId));

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    () => persistedRef.current.columnVisibility ?? initialColumnVisibility ?? {},
  );
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>(
    () => persistedRef.current.columnPinning ?? initialColumnPinning ?? {},
  );
  const [density, setDensity] = useState<TableDensity>(
    () => persistedRef.current.density ?? initialDensity,
  );

  // Allow `initialColumnPinning` to act as a controlled input when the parent
  // varies it (e.g. responsive pinning: pin "name" on desktop but not on
  // mobile). We sync only when the value changes, so user-driven pinning
  // (drag-to-pin, when we expose UI for it later) still wins for the
  // intermediate frames. No UI currently mutates pinning, so this is safe.
  const pinningKey = JSON.stringify(initialColumnPinning ?? {});
  useEffect(() => {
    setColumnPinning(initialColumnPinning ?? {});
    // eslint-disable-next-line react-hooks/exhaustive-deps -- compare via serialized key, not reference
  }, [pinningKey]);

  // Persist on any change to the user-controllable state.
  useEffect(() => {
    writePersisted(tableId, { columnVisibility, columnPinning, density });
  }, [tableId, columnVisibility, columnPinning, density]);

  // ---- TanStack table instance ----
  const table = useReactTable({
    data,
    columns,
    state: { columnVisibility, columnPinning },
    onColumnVisibilityChange: setColumnVisibility,
    onColumnPinningChange: setColumnPinning,
    getCoreRowModel: getCoreRowModel(),
    // Keep pinned columns where the user put them even if data shape changes.
    enablePinning: true,
  });

  // ---- Column chooser items ----
  const chooserItems = useMemo<ColumnChooserItem[]>(() => {
    return table
      .getAllLeafColumns()
      .filter((c) => c.getCanHide())
      .map((c) => ({
        id: c.id,
        label: c.columnDef.meta?.label ?? c.id,
        visible: c.getIsVisible(),
        pinned: c.getIsPinned() !== false,
      }));
  }, [table, columnVisibility]);

  const handleToggleColumn = useCallback(
    (id: string, next: boolean) => {
      setColumnVisibility((prev) => ({ ...prev, [id]: next }));
    },
    [],
  );

  const handleResetColumns = useCallback(() => {
    setColumnVisibility(initialColumnVisibility ?? {});
  }, [initialColumnVisibility]);

  // ---- Edge shadow tracking ----
  const { ref: scrollRef, showStart, showEnd } = useScrollEdgeShadow<HTMLDivElement>();

  // ---- Density-driven row classes ----
  const cellPadding = DENSITY_CELL_PADDING_CLASS[density];

  // ---- Render ----
  const rows = table.getRowModel().rows;
  const isEmpty = rows.length === 0;

  return (
    <div className="space-y-3">
      {(toolbarStart || toolbarEnd || showColumnChooser || showDensityToggle) && (
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">{toolbarStart}</div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {toolbarEnd}
            {showColumnChooser && (
              <ColumnChooser
                items={chooserItems}
                onToggle={handleToggleColumn}
                onReset={handleResetColumns}
              />
            )}
            {showDensityToggle && (
              <DensityToggle value={density} onChange={setDensity} />
            )}
          </div>
        </div>
      )}

      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        {/* Scrollable wrapper — drives horizontal scroll + tracks edge state */}
        <div ref={scrollRef} className="overflow-x-auto">
          <table
            // `min-w-max` so the table sizes to its natural column widths and
            // overflows the parent → wrapper scrolls horizontally.
            // `border-collapse: separate` is mandatory: `collapse` breaks
            // `position: sticky` borders on Safari.
            className="w-full min-w-max"
            style={{ borderCollapse: 'separate', borderSpacing: 0 }}
          >
            <thead className="bg-neutral-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const sticky = getStickyCellStyle(
                      header.column,
                      true,
                      showStart,
                      showEnd,
                    );
                    return (
                      <th
                        key={header.id}
                        colSpan={header.colSpan}
                        className={cn(
                          'text-start text-xs font-semibold text-neutral-700 uppercase tracking-wider whitespace-nowrap',
                          'border-b border-neutral-200',
                          cellPadding,
                          sticky.className,
                          header.column.columnDef.meta?.headerClassName,
                        )}
                        style={{
                          ...sticky.style,
                          width: header.getSize() === 150
                            // 150 is TanStack's default — treat as "auto"
                            ? undefined
                            : `${header.getSize()}px`,
                        }}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>

            <tbody>
              {isEmpty ? (
                <tr>
                  <td
                    colSpan={table.getAllLeafColumns().length}
                    className="px-6 py-12 text-center text-sm text-neutral-500"
                  >
                    {emptyState ?? t('data_table.empty_default', 'No data')}
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <DataTableRow
                    key={row.id}
                    row={row}
                    cellPadding={cellPadding}
                    showStart={showStart}
                    showEnd={showEnd}
                    onRowClick={onRowClick}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {footer}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Row component — pulled out so React can memo per-row if needed later
// ----------------------------------------------------------------------------

interface DataTableRowProps<T> {
  row: Row<T>;
  cellPadding: string;
  showStart: boolean;
  showEnd: boolean;
  onRowClick?: (row: T) => void;
}

function DataTableRow<T>({
  row,
  cellPadding,
  showStart,
  showEnd,
  onRowClick,
}: DataTableRowProps<T>) {
  return (
    <tr
      onClick={onRowClick ? () => onRowClick(row.original) : undefined}
      className={cn(
        'group/row border-b border-neutral-100 last:border-b-0 transition-colors',
        onRowClick && 'cursor-pointer',
        'hover:bg-neutral-50',
      )}
    >
      {row.getVisibleCells().map((cell) => {
        const sticky = getStickyCellStyle(cell.column, false, showStart, showEnd);
        return (
          <td
            key={cell.id}
            className={cn(
              'align-middle',
              cellPadding,
              sticky.className,
              cell.column.columnDef.meta?.cellClassName,
            )}
            style={{
              ...sticky.style,
              width: cell.column.getSize() === 150
                ? undefined
                : `${cell.column.getSize()}px`,
            }}
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </td>
        );
      })}
    </tr>
  );
}

// ----------------------------------------------------------------------------
// TanStack type augmentation — `meta` is `unknown` by default; we narrow it
// so consumers get autocomplete on `label` / `headerClassName` / `cellClassName`.
// ----------------------------------------------------------------------------

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    /** Localized label shown in the column chooser. Falls back to `column.id`. */
    label?: string;
    /** Extra className applied to the <th>. */
    headerClassName?: string;
    /** Extra className applied to every <td>. */
    cellClassName?: string;
  }
}
