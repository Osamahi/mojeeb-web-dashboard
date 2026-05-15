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

import {
  useMemo,
  useState,
  useEffect,
  useCallback,
  useRef,
  type CSSProperties,
} from 'react';
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

  /**
   * When true, render N skeleton rows after the last real row to indicate
   * the next page is loading. The skeleton rows live inside <tbody> so they
   * scroll with real rows, stay aligned with column widths, and sit ABOVE
   * the horizontal scrollbar (not below it). Use with infinite-scroll
   * mutations.
   */
  isFetchingNextPage?: boolean;
  /** Number of skeleton rows to render while fetching. Defaults to 3. */
  fetchingSkeletonRows?: number;

  /**
   * Optional terminal row rendered after all real rows when there are no
   * more pages to load (e.g. "All N leads loaded"). Rendered as a single
   * full-width <tr> so it stays inside <tbody>'s flow.
   */
  endOfListMessage?: React.ReactNode;

  /**
   * When true, the table card fills its parent's available height: the
   * toolbar stays fixed at top, the body scrolls vertically AND horizontally
   * inside the card, and the <thead> sticks to the top of the scrolling
   * region. Requires the parent to be a flex column with a bounded height
   * (e.g. `flex flex-col h-full min-h-0`) — same pattern as Linear / Notion
   * / Airtable.
   *
   * Default: false (legacy "table grows to its natural height, page scrolls"
   * behavior used by every other table in the app).
   */
  fillHeight?: boolean;

  /**
   * Optional ref that receives the scroll container element. Accepts any
   * React ref shape — a `MutableRefObject` OR a callback ref (e.g. the setter
   * from `useState<HTMLDivElement | null>`). The callback-ref form is the
   * recommended pattern for `fillHeight` consumers because it lets a child
   * hook (e.g. `useInfiniteScroll`) re-run as soon as the DOM node lands,
   * without ref-mirroring boilerplate in the parent.
   */
  scrollContainerRef?: React.Ref<HTMLDivElement>;
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
 * Body cells get an opaque background so the scrolling content underneath
 * doesn't bleed through. No edge shadows — the pin itself is the separator.
 */
function getStickyCellStyle<T>(
  column: Column<T, unknown>,
  isHeader: boolean,
): StickyStyle {
  const pin = column.getIsPinned();
  if (!pin) return { className: '' };

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

  return {
    className: cn('sticky', baseBg, isHeader ? 'z-20' : 'z-10'),
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
  isFetchingNextPage = false,
  fetchingSkeletonRows = 3,
  endOfListMessage,
  fillHeight = false,
  scrollContainerRef,
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

  // Forward the scroll container DOM node to the consumer's ref. Accepts
  // both shapes React allows: a callback ref (function) or a mutable ref
  // object. Callback refs are the recommended pattern for fillHeight
  // consumers — passing `setState` directly drives a re-render when the
  // DOM lands, so a child `useInfiniteScroll` can observe it correctly.
  const setScrollContainerRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!scrollContainerRef) return;
      if (typeof scrollContainerRef === 'function') {
        scrollContainerRef(node);
      } else {
        (scrollContainerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }
    },
    [scrollContainerRef],
  );

  // ---- Density-driven row classes ----
  const cellPadding = DENSITY_CELL_PADDING_CLASS[density];

  // ---- Render ----
  const rows = table.getRowModel().rows;
  const isEmpty = rows.length === 0;

  return (
    <div
      className={cn(
        'space-y-3',
        // When the table must fill its parent's height, the OUTER wrapper
        // is the flex column that grows. Toolbar stays its natural height;
        // table card absorbs the rest.
        fillHeight && 'flex flex-col h-full min-h-0',
      )}
    >
      {(toolbarStart || toolbarEnd || showColumnChooser || showDensityToggle) && (
        <div className="flex items-center justify-between gap-2 flex-shrink-0">
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

      <div
        className={cn(
          // `isolate` creates a new stacking context for the card so the
          // sticky <thead>'s z-index stays local — it sits above pinned
          // column cells inside the table but never above app chrome
          // (sidebar, header) which live in the root stacking context.
          'isolate bg-white border border-neutral-200 rounded-lg overflow-hidden',
          // In fillHeight mode, the card itself is the bounded flex column
          // that contains thead + body + footer. min-h-0 is required so the
          // child scroll region can actually shrink.
          fillHeight && 'flex flex-col flex-1 min-h-0',
        )}
      >
        {/* Scrollable wrapper — drives horizontal scroll.
            tabIndex=0 + role=region so keyboard users can focus the table
            area and arrow-key / shift+wheel to scroll horizontally.
            Consumers that need infinite scroll observe this element via the
            `scrollContainerRef` callback prop (not a DOM-attribute selector). */}
        <div
          ref={setScrollContainerRef}
          className={cn(
            'overflow-x-auto',
            // In fillHeight mode the same element also scrolls vertically and
            // grows to fill the card. min-h-0 lets it shrink below its
            // natural content height when the viewport demands.
            fillHeight && 'overflow-y-auto flex-1 min-h-0',
          )}
          tabIndex={0}
          role="region"
          aria-label={t('data_table.scroll_region_label', 'Data table')}
        >
          <table
            // `min-w-max` so the table sizes to its natural column widths and
            // overflows the parent → wrapper scrolls horizontally.
            // `border-collapse: separate` is mandatory: `collapse` breaks
            // `position: sticky` borders on Safari.
            className="w-full min-w-max"
            style={{ borderCollapse: 'separate', borderSpacing: 0 }}
          >
            {/* Sticky thead in fillHeight mode so column labels stay visible
                while the user scrolls the body. z-30 keeps it above sticky
                pinned column cells (z-10/20) without conflicting with the
                desktop sidebar (z-30 — different stacking context). */}
            <thead
              className={cn(
                'bg-neutral-50',
                fillHeight && 'sticky top-0 z-30',
              )}
            >
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const sticky = getStickyCellStyle(header.column, true);
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
                <>
                  {rows.map((row) => (
                    <DataTableRow
                      key={row.id}
                      row={row}
                      cellPadding={cellPadding}
                      onRowClick={onRowClick}
                    />
                  ))}

                  {/* Infinite-scroll loading rows. Live inside <tbody> so they
                      scroll with real rows, stay column-aligned, and sit
                      ABOVE the native horizontal scrollbar at the bottom of
                      the scroll container — not below it. */}
                  {isFetchingNextPage && (
                    <SkeletonRows
                      count={fetchingSkeletonRows}
                      colSpan={table.getVisibleLeafColumns().length}
                      cellPadding={cellPadding}
                    />
                  )}

                  {/* Terminal "no more pages" row. Same flow rules as the
                      skeleton rows so it sits alongside content, not below
                      the scrollbar. */}
                  {endOfListMessage && (
                    <tr>
                      <td
                        colSpan={table.getVisibleLeafColumns().length}
                        className="px-6 py-4 text-center text-sm text-neutral-500 border-t border-neutral-100"
                      >
                        {endOfListMessage}
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

// ----------------------------------------------------------------------------
// SkeletonRows — N <tr>s with a shimmer block, used for infinite-scroll
// loading state. Renders inside <tbody> so the rows participate in column
// alignment and the table's scroll flow. Pulled out so the parent doesn't
// re-build the same JSX on every render of a long list.
// ----------------------------------------------------------------------------

interface SkeletonRowsProps {
  count: number;
  colSpan: number;
  cellPadding: string;
}

function SkeletonRows({ count, colSpan, cellPadding }: SkeletonRowsProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <tr key={`skeleton-${i}`} aria-hidden className="border-b border-neutral-100 last:border-b-0">
          <td colSpan={colSpan} className={cn('align-middle', cellPadding)}>
            <div className="h-4 w-full rounded bg-neutral-200/70 animate-pulse" />
          </td>
        </tr>
      ))}
    </>
  );
}

// ----------------------------------------------------------------------------
// Row component — pulled out so React can memo per-row if needed later
// ----------------------------------------------------------------------------

interface DataTableRowProps<T> {
  row: Row<T>;
  cellPadding: string;
  onRowClick?: (row: T) => void;
}

function DataTableRow<T>({
  row,
  cellPadding,
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
        const sticky = getStickyCellStyle(cell.column, false);
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
