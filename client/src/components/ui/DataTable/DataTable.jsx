import {
  DataTableToolbar,
  DataTableSearch,
  DataTableTabs,
  DataTableActions,
  DataTableFilterButton,
  DataTableNewButton,
} from './DataTableToolbar';

import {
  DataTableTable,
  DataTableHead,
  DataTableBody,
  DataTableRow,
  DataTableCell,
} from './DataTableTable';

import {
  DataTableRowActions,
  DataTableActionButton,
} from './DataTableRowActions';

import { DataTableContent } from './DataTableContent';
import { DataTablePagination } from './DataTablePagination';

export function DataTable({ children, className = '' }) {
  return <div className={`datatable-root ${className}`.trim()}>{children}</div>;
}

DataTable.Toolbar = DataTableToolbar;
DataTable.Search = DataTableSearch;
DataTable.Tabs = DataTableTabs;
DataTable.Actions = DataTableActions;
DataTable.FilterButton = DataTableFilterButton;
DataTable.NewButton = DataTableNewButton;

DataTable.Content = DataTableContent;
DataTable.Table = DataTableTable;
DataTable.Head = DataTableHead;
DataTable.Body = DataTableBody;
DataTable.Row = DataTableRow;
DataTable.Cell = DataTableCell;

DataTable.RowActions = DataTableRowActions;
DataTable.ActionButton = DataTableActionButton;

DataTable.Pagination = DataTablePagination;

export default DataTable;
