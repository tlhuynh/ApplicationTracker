import {type ColumnDef} from '@tanstack/react-table';
import type {ApplicationRecord} from 'src/api/applicationRecords';
import { STATUS_OPTIONS } from '@/lib/constants';

function formatDate(value: string | null | undefined): string {
  if (!value) return '';
  return new Date(value).toLocaleDateString();
}

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
