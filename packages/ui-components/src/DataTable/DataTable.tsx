import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { cn } from '../lib/cn';
import { Icon } from '../Icon/Icon';
import { Input } from '../Input/Input';

/**
 * SS5 + SS6: sortable columns, inline filter, sticky header, a 3px coloured
 * left rule carrying row severity per the SS1 mapping, and a responsive
 * collapse to stacked cards below the table breakpoint.
 *
 * "Lists become tables become cards" is defined ONCE, here. No screen
 * reimplements it - the admin queue, the doctor's history and the org roster
 * all get the same behaviour from the same component.
 */
export type RowSeverity = 'high' | 'medium' | 'low' | 'ok' | 'none';

export interface Column<T> {
  key: string;
  header: string;
  /** Cell content. Keep it to one line; put detail on the row's detail page. */
  render: (row: T) => ReactNode;
  /** Value used for sorting. Omit to make the column unsortable. */
  sortValue?: (row: T) => string | number;
  /** Hidden below the table breakpoint, where space is scarce. */
  hideOnCards?: boolean;
  align?: 'left' | 'right';
}

export interface DataTableProps<T> {
  columns: Array<Column<T>>;
  rows: T[];
  rowKey: (row: T) => string;
  severity?: (row: T) => RowSeverity;
  /** Makes the whole row activatable by click and by Enter. */
  onRowActivate?: (row: T) => void;
  filterPlaceholder?: string;
  /** Free-text haystack per row. Omit to disable the inline filter. */
  filterText?: (row: T) => string;
  caption: string;
  emptyState?: ReactNode;
  className?: string;
}

const RULE: Record<RowSeverity, string> = {
  high: 'border-l-scarlet',
  medium: 'border-l-amber',
  low: 'border-l-ink-3',
  ok: 'border-l-tourmaline',
  none: 'border-l-transparent',
};

export function DataTable<T>({
  columns, rows, rowKey, severity, onRowActivate,
  filterPlaceholder = 'Filter rows', filterText, caption, emptyState, className,
}: DataTableProps<T>) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null);

  const visible = useMemo(() => {
    let out = rows;
    if (query && filterText) {
      const q = query.toLowerCase();
      out = out.filter((r) => filterText(r).toLowerCase().includes(q));
    }
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col?.sortValue) {
        const dir = sort.dir === 'asc' ? 1 : -1;
        out = [...out].sort((a, b) => {
          const av = col.sortValue!(a);
          const bv = col.sortValue!(b);
          if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
          return String(av).localeCompare(String(bv)) * dir;
        });
      }
    }
    return out;
  }, [rows, query, filterText, sort, columns]);

  function toggleSort(key: string) {
    setSort((s) =>
      s?.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' },
    );
  }

  return (
    <div className={cn('rounded-card border border-line bg-surface', className)}>
      {filterText ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-2 p-4">
          <div className="relative w-full max-w-[320px]">
            <label htmlFor={`${caption}-filter`} className="sr-only">{filterPlaceholder}</label>
            <Input
              id={`${caption}-filter`}
              value={query}
              placeholder={filterPlaceholder}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
            <Icon name="search" size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          </div>
          <span className="text-caption text-muted" aria-live="polite">
            {visible.length} of {rows.length} rows
          </span>
        </div>
      ) : null}

      {visible.length === 0 ? (
        <div className="p-6 text-body-sm text-muted">
          {emptyState ?? 'No rows match this filter. Clear it to see everything again.'}
        </div>
      ) : (
        /* The wrapper scrolls, never document.body (SS6). */
        <div className="scroll-thin overflow-x-auto">
          <table className="w-full border-collapse text-body-sm max-lg:block">
            <caption className="sr-only">{caption}</caption>

            <thead className="max-lg:sr-only">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    className={cn(
                      'sticky top-[64px] z-[5] border-b border-line bg-surface p-3',
                      'text-caption font-semibold text-muted',
                      col.align === 'right' ? 'text-right' : 'text-left',
                    )}
                  >
                    {col.sortValue ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(col.key)}
                        className="inline-flex min-h-[24px] items-center gap-1"
                        aria-sort={sort?.key === col.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                      >
                        {col.header}
                        <Icon
                          name={sort?.key === col.key && sort.dir === 'desc' ? 'chevronUp' : 'chevronDown'}
                          size={12}
                          className={sort?.key === col.key ? 'text-ink' : 'text-muted/60'}
                        />
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="max-lg:block">
              {visible.map((row) => {
                const sev = severity?.(row) ?? 'none';
                const interactive = Boolean(onRowActivate);
                return (
                  <tr
                    key={rowKey(row)}
                    tabIndex={interactive ? 0 : undefined}
                    onClick={interactive ? () => onRowActivate!(row) : undefined}
                    onKeyDown={
                      interactive
                        ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onRowActivate!(row); } }
                        : undefined
                    }
                    className={cn(
                      'border-l-[3px]', RULE[sev],
                      interactive && 'cursor-pointer hover:bg-canvas-2',
                      'max-lg:mb-3 max-lg:block max-lg:rounded-card max-lg:border max-lg:border-l-[3px] max-lg:border-line',
                      sev !== 'none' && 'max-lg:' + RULE[sev],
                    )}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        data-label={col.header}
                        className={cn(
                          'border-b border-line-2 p-3 align-middle last:border-b-0',
                          col.align === 'right' ? 'text-right' : 'text-left',
                          'max-lg:grid max-lg:grid-cols-[minmax(96px,0.7fr)_1fr] max-lg:items-center max-lg:gap-3',
                          'max-lg:before:content-[attr(data-label)] max-lg:before:text-caption max-lg:before:text-muted',
                          col.hideOnCards && 'max-lg:hidden',
                        )}
                      >
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
