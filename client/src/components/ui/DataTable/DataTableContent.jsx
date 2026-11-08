import { PageLoader } from '../Loader/Spinner';
import EmptyState from '../EmptyState/EmptyState';
import {
  DataTableTable,
  DataTableHead,
  DataTableBody,
  DataTableRow,
  DataTableCell,
} from './DataTableTable';

export function DataTableContent({
  isLoading = false,
  isEmpty = false,
  emptyState = null,
  columns = [],
  data = [],
  renderRow = null,
  onRowClick = null,
  children,
}) {
  if (isLoading) {
    return (
      <div style={{ marginTop: 24 }}>
        <PageLoader />
      </div>
    );
  }

  if (isEmpty) {
    if (!emptyState) return null;
    return (
      <div style={{ marginTop: 20 }}>
        <EmptyState
          icon={emptyState.icon}
          title={emptyState.title}
          description={emptyState.description}
          actionLabel={emptyState.actionLabel}
          onAction={emptyState.onAction}
        />
      </div>
    );
  }

  if (children) {
    return children;
  }

  // Declarative rendering mode with columns and data
  return (
    <DataTableTable columns={columns}>
      <DataTableHead columns={columns} />
      <DataTableBody>
        {data.map((item, index) => {
          if (renderRow) {
            return renderRow(item, index);
          }

          const handleRowClick = onRowClick ? () => onRowClick(item, index) : undefined;

          return (
            <DataTableRow key={item.id || index} onClick={handleRowClick}>
              {columns.map((col, colIdx) => {
                const cellValue = col.render
                  ? col.render(item, index)
                  : item[col.key];

                return (
                  <DataTableCell
                    key={col.key || colIdx}
                    num={col.align === 'right' || col.num}
                    price={col.price}
                    tax={col.tax}
                    className={col.className}
                  >
                    {cellValue}
                  </DataTableCell>
                );
              })}
            </DataTableRow>
          );
        })}
      </DataTableBody>
    </DataTableTable>
  );
}
