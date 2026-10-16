import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';

export interface Column<T> {
  key: string;
  header: ReactNode;
  render?: (item: T, index: number) => ReactNode;
  className?: string;
}

interface AdminTableCardProps<T> {
  title: string;
  headerAction?: ReactNode;
  data: T[];
  columns: Column<T>[];
  viewAllHref?: string;
  className?: string;
  rowKey: (item: T, index: number) => string | number;
  rowHref?: (item: T) => string;
  headerOverflowVisible?: boolean;
}

 const TableCard = <T,>({
  title,
  headerAction,
  data,
  columns,
  viewAllHref,
  className = '',
  rowKey,
  rowHref,
  headerOverflowVisible = false,
}: AdminTableCardProps<T>) => {
  const navigate = useNavigate();
  return (
    <div
      className={`${headerOverflowVisible ? 'overflow-visible' : 'overflow-hidden'} rounded-2xl border border-border bg-card shadow-sm transition-shadow duration-200 hover:shadow-md ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="font-semibold font-display text-secondary-foreground">
          {title}
        </h2>

      {headerAction ? (
        headerAction
      ) : viewAllHref ? (
        <Link
          to={viewAllHref}
          className="text-xs text-primary hover:underline"
        >
          View all
        </Link>
      ) : null}
      </div>

      {/* Table */}
      <div className={headerOverflowVisible ? 'overflow-visible' : 'overflow-x-auto'}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/65">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide ${
                    column.className ?? ''
                  }`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {data.map((item, index) => (
              <tr
              onClick={() => {
                if (rowHref) {
                    navigate(rowHref(item));
                  }
                }}
                key={rowKey(item, index)}
                tabIndex={rowHref ? 0 : undefined}
                onKeyDown={(event) => {
                  if (rowHref && (event.key === 'Enter' || event.key === ' ')) {
                    event.preventDefault();
                    navigate(rowHref(item));
                  }
                }}
                className={`transition-colors hover:bg-primary/[.035] focus-visible:bg-primary/[.04] focus-visible:outline-none ${rowHref ? 'cursor-pointer' : ''}`}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-4 py-3 ${column.className ?? ''}`}
                  >
                    {column.render
                      ? column.render(item, index)
                      : String(item[column.key as keyof T] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TableCard;
