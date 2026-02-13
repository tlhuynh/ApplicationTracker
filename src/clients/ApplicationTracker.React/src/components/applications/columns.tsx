import {type ColumnDef} from '@tanstack/react-table';
import type {ApplicationRecord} from 'src/api/applicationRecords';
import { STATUS_OPTIONS } from '@/lib/constants';

/*
* Notes: helper function to format date into local date. For angular we can probably use a pipe
* */
function formatDate(value: string | null | undefined): string {
  if (!value) return '';
  return new Date(value).toLocaleDateString();
}

/*
* Notes: Configuration data for column definition. This is separated from the table file since we're using
* TanStack Table which is a headless UI (i.e. it only handle table logic such as sorting, filtering, pagination)
* Since headless UI doesn't provide html, we need this file (data configuration) and the Application Table file (for html)
* to create a full table.
*
* This way, we can have multiple columns definition file (name would have to change here to be more specific)
* and reuse the ApplicationTable for the general layout
*
* About the element:
*   accessorKey tell TanStack table which property to read
*   head is the text to display for the column
*   cell contains the custom render function to transform value into what we want to display
*     e.g status on frontend is presented as number, we need to transform it into texts
* */
export const columns: ColumnDef<ApplicationRecord>[] = [
  {
    accessorKey: "companyName",
    header: "Company Name",
  },
  {
    accessorKey: "appliedDate",
    header: "Date Applied",
    cell: ({ getValue }) => formatDate(getValue<string | null>()),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) =>
      STATUS_OPTIONS.find(o => o.value === getValue<number>())?.label,
  },
  {
    accessorKey: "postingUrl",
    header: "Job Url",
    cell: ({ getValue }) => {
      const url = getValue<string | null>();
      if (!url) return null;
      return (
        // TODO see if it is possible to use icon instead
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline hover:text-blue-800">
          Link
        </a>
      );
    },
  },
  {
    accessorKey: "notes",
    header: "Notes",
    cell: ({ getValue }) => (
      <span className="max-w-xs truncate block">{getValue<string | null>()}</span>
    ),
  },
]
