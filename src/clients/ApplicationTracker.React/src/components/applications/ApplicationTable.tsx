import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
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


/*
* Prop contains column definitions and data to pass into ApplicationTable
* Contain generaic type so that you can specify it when use and make ApplicationTable reusable*
* */
interface ApplicationTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function ApplicationTable<TData, TValue>({
  columns,
  data,
}: ApplicationTableProps<TData, TValue>) {
  /*
  * Notes about useReactTable: a hook from tanstack table, you provide data and column definition, it will return
  * a table instance from that data and column config.
  *
  * the table instance contains methos like getHeaderGroups(), getRowModel(), etc. to return specific data for you
  * to render
  *
  * ASK ABOUT WHY INCLUDE getCoreRowModel
  *
  *
  * */
  // On going issue https://github.com/TanStack/table/issues/5567
  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table is not yet compatible with React Compiler
  const table = useReactTable({
    data,
    columns,
    // plugin to render rows, this is due to TanStack Table is modular thus required user to add what they need
    // getCoreRowModel is the minimum plugin, later there will be sort and pagination, etc.
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          // .map() is equivalent of @foreach
          // this code block is basically:
          //  loop thru each header group, render a row
          //  loop thru each header, render a table head
          //
          //  when rendering a table head, flexRender (TanStack Table utility) uses data from column config and provided
          //  data to render value. This is the bridge to combine TanStack Table and react element
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          // if there are rows, loop thru each and render, otherwise use fallback "No applications found"
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
  );
}
