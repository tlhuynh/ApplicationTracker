import {useState} from 'react';
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {ArrowDown, ArrowUp, ArrowUpDown} from 'lucide-react';
import {Button} from '@/components/ui/button';

/*
* Prop contains column definitions and data to pass into ApplicationTable
* Contain generaic type so that you can specify it when use and make ApplicationTable reusable*
* */
interface ApplicationTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  globalFilter?: string;
  onGlobalFilterChange?: (value: string) => void;
}

export function ApplicationTable<TData, TValue>({
  columns,
  data,
  globalFilter,
  onGlobalFilterChange,
}: ApplicationTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  /*
  * Notes about useReactTable: a hook from tanstack table, you provide data and column definition, it will return
  * a table instance from that data and column config.
  *
  * the table instance contains methos like getHeaderGroups(), getRowModel(), etc. to return specific data for you
  * to render
  * */
  // On going issue https://github.com/TanStack/table/issues/5567
  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table is not yet compatible with React Compiler
  const table = useReactTable({
    data,
    columns,
    // plugin to render rows, this is due to TanStack Table is modular thus required user to add what they need
    // getCoreRowModel is the minimum plugin, later there will be sort and pagination, etc.
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange,
    state: {sorting, globalFilter},
  });

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {/*.map() is equivalent of @foreach
              this code block is basically:
              loop thru each header group, render a row
              loop thru each header, render a table head
              when rendering a table head, flexRender (TanStack Table utility) uses data from column config and provided
              data to render value. This is the bridge to combine TanStack Table and react element*/}
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className={header.column.getCanSort() ? 'cursor-pointer select-none' : ''}>
                    {header.isPlaceholder ? null : (
                      <div className="flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          header.column.getIsSorted() === 'asc' ? <ArrowUp className="h-4 w-4"/>
                            : header.column.getIsSorted() === 'desc' ? <ArrowDown className="h-4 w-4"/>
                              : <ArrowUpDown className="h-4 w-4 text-muted-foreground"/>
                        )}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {/*if there are rows, loop thru each and render, otherwise use fallback "No applications found"*/}
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No applications found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {table.getPageCount() > 0 && (
        <div className="flex items-center justify-between px-2 py-4">
          <p className="text-sm text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount()}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}>
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}>
              Next
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
