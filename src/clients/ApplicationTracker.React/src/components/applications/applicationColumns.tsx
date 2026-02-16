import {type ColumnDef} from '@tanstack/react-table';
import type {ApplicationRecord} from 'src/api/applicationRecords';
import {STATUS_OPTIONS} from '@/lib/constants';
import {Button} from '@/components/ui/button';
import {NotesCell} from '@/components/applications/NotesCell';
import {Check, ExternalLink, X} from 'lucide-react';

/*
* Notes: helper function to format date into local date. For angular we can probably use a pipe
* */
function formatDate(value: string | null | undefined): string {
  if (!value) return '';
  return new Date(value).toLocaleDateString();
}

interface ColumnActions {
  onEdit: (record: ApplicationRecord) => void;
  onDelete: (record: ApplicationRecord) => void;
  onStatusChange: (record: ApplicationRecord, newStatus: number) => void;
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
export function createColumns({onEdit, onDelete, onStatusChange}: ColumnActions): ColumnDef<ApplicationRecord>[] {
  return [
    {
      accessorKey: "companyName",
      header: "Company Name",
    },
    {
      accessorKey: "appliedDate",
      header: "Date Applied",
      cell: ({getValue}) => formatDate(getValue<string | null>()),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({getValue, row}) => {
        const status = getValue<number>();
        const label = STATUS_OPTIONS.find(o => o.value === status)?.label;
        const isTerminal = status >= 3; // Rejected or Withdrawn
        const isMaxProgression = status >= 2; // Already Offered

        return (
          <div className="flex items-center gap-4">
            <span>{label}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6"
              aria-label="Advance status"
              disabled={isTerminal || isMaxProgression}
              onClick={() => onStatusChange(row.original, status + 1)}>
              <Check className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6"
              aria-label="Reject application"
              disabled={isTerminal}
              onClick={() => onStatusChange(row.original, 3)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        );
      },
      filterFn: (row, columnId, filterValue: string) => {
        const status = row.getValue<number>(columnId);
        const label = STATUS_OPTIONS.find(o => o.value === status)?.label ?? '';
        return label.toLowerCase().includes(filterValue.toLowerCase());
      },
    },
    {
      accessorKey: "postingUrl",
      header: "Job Url",
      enableSorting: false,
      cell: ({getValue}) => {
        const url = getValue<string | null>();
        if (!url) return null;
        return (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground"
            aria-label="Open job posting">
            <ExternalLink className="h-4 w-4"/>
          </a>
        );
      },
    },
    {
      accessorKey: "notes",
      header: "Notes",
      enableSorting: false,
      cell: ({getValue}) => <NotesCell value={getValue<string | null>()}/>,
    },
    {
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      cell: ({row}) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(row.original)}>
            Edit
          </Button>
          <Button variant="secondary" size="sm" onClick={() => onDelete(row.original)}>
            Delete
          </Button>
        </div>
      ),
    },
  ]
}
