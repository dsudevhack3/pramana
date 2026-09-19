/**
 * CONFLICT NOTE (design system SS5/SS10 vs the provided file structure)
 *
 * The file structure lists components/common/DataTable.tsx inside this app, but
 * the design system says the "lists become tables become cards" behaviour is
 * defined once, in the shared component package, and not re-implemented per
 * screen or per app.
 *
 * Resolved in favour of the design system while keeping the import path the
 * structure expects: this is a re-export, not a second table. The admin queue,
 * the doctor's history and the org roster all get identical sorting, filtering
 * and responsive collapse because they are all the same component.
 */
export { DataTable } from '@pramana/ui-components';
export type { Column, DataTableProps, RowSeverity } from '@pramana/ui-components';
