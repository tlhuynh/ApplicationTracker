import { useEffect, useRef, useState } from 'react';
import type { SortingState } from '@tanstack/react-table';
import { type ApplicationRecord, type CreateRequest } from '@/api/applicationRecords';
import { useApplicationRecordsApi } from '@/hooks/use-application-records-api';
import { ApplicationFormDialog } from
    '@/components/applications/ApplicationFormDialog';
import { ApplicationTable } from '@/components/applications/ApplicationTable';
import { createColumns } from '@/components/applications/applicationColumns';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { getToastErrorMessage } from '@/lib/utils';

/** sessionStorage keys for persisting table UI state across navigation. */
const TABLE_SORT_KEY = 'table_sorting';
const TABLE_FILTER_KEY = 'table_filter';

/*
* Page is where we put everything together
*
* Contains states (useState), make api calls(useEffect), and call components to display on the page
* */
export function HomePage() {
  const api = useApplicationRecordsApi();
  /*
  * State variables for the page
  * */
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ApplicationRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<ApplicationRecord | null>(null);
  const [searchFilter, setSearchFilter] = useState<string>(
    () => sessionStorage.getItem(TABLE_FILTER_KEY) ?? ''
  );
  const [sorting, setSorting] = useState<SortingState>(
    () => JSON.parse(sessionStorage.getItem(TABLE_SORT_KEY) ?? '[]') as SortingState
  );
  const [isDeletingPending, setIsDeletingPending] = useState(false);
  const [pendingStatusId, setPendingStatusId] = useState<number | null>(null);
  const isDeletingRef = useRef(false);

  // Persist table UI state to sessionStorage so it survives navigation but clears on page refresh.
  useEffect(() => { sessionStorage.setItem(TABLE_FILTER_KEY, searchFilter); }, [searchFilter]);
  useEffect(() => { sessionStorage.setItem(TABLE_SORT_KEY, JSON.stringify(sorting)); }, [sorting]);

  /*
  * useEffect for API calls
  *
  * this one is run on mount/init
  * useEffect with an empty dependency array [] runs once after the first render,
  * equivalent to Blazor's OnInitializedAsync
  * */
  // useEffect on mount — replace getAll() with api.getAll()
  useEffect(() => {
    api
      .getAll()
      .then(setApplications)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load applications');
      })
      .finally(() => setIsLoading(false));
  }, [api]);

  /*
  * The difference matters:
  * useEffect is for side effects triggered by state/prop changes; regular functions
  * are for side effects triggered by user actions
  *
  * Since this method is mainly used in handleCreate, which is fine with asyncm this can be rewritten to be
  * an async method
  * */
  // refreshApplications — replace getAll() with api.getAll()
  const refreshApplications = () => {
    setIsLoading(true);
    setError(null);
    api
      .getAll()
      .then(setApplications)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load applications');
      })
      .finally(() => setIsLoading(false));
  };

  // handleCreate — replace create() with api.create()
  const handleCreate = async (data: CreateRequest) => {
    await api.create(data);
    refreshApplications();
  };

  const handleEdit = (record: ApplicationRecord) => {
    setEditingRecord(record);
    setDialogOpen(true);
  };

  // handleUpdate — replace update() with api.update()
  const handleUpdate = async (data: CreateRequest) => {
    if (!editingRecord?.id) return;
    await api.update(Number(editingRecord.id), data);
    refreshApplications();
  };

  const handleDelete = (record: ApplicationRecord) => {
    setDeletingRecord(record);
  };

  // confirmDelete — replace remove() with api.remove()
  const confirmDelete = () => {
    if (!deletingRecord?.id) return;
    isDeletingRef.current = true;
    setIsDeletingPending(true);
    api
      .remove(Number(deletingRecord.id))
      .then(refreshApplications)
      .catch((err: unknown) => {
        toast.error(getToastErrorMessage(err, 'Failed to delete application'));
      })
      .finally(() => {
        isDeletingRef.current = false;
        setIsDeletingPending(false);
        setDeletingRecord(null);
      });
  };

  // handleStatusChange — replace patchStatus() with api.patchStatus()
  const handleStatusChange = (record: ApplicationRecord, newStatus: number) => {
    if (!record.id) return;
    setPendingStatusId(Number(record.id));
    api
      .patchStatus(Number(record.id), newStatus)
      .then(refreshApplications)
      .catch((err: unknown) => {
        toast.error(getToastErrorMessage(err, 'Failed to update status'));
      })
      .finally(() => setPendingStatusId(null));
  };

  const tableColumns = createColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
    onStatusChange: handleStatusChange,
    pendingStatusId,
  });

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) setEditingRecord(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Applications</h2>
        <Button onClick={() => setDialogOpen(true)}>New Application</Button>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search applications..."
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          className="max-w-sm" />
      </div>

      {isLoading && <p className="text-muted-foreground">Loading...</p>}
      {error && <p className="text-destructive">{error}</p>}
      {!isLoading && !error && <ApplicationTable columns={tableColumns}
                                                 data={applications}
                                                 globalFilter={searchFilter}
                                                 onGlobalFilterChange={setSearchFilter}
                                                 sorting={sorting}
                                                 onSortingChange={setSorting}/>}
      <ApplicationFormDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        onSubmit={editingRecord ? handleUpdate : handleCreate}
        initialData={editingRecord ?? undefined} />
      <AlertDialog open={!!deletingRecord} onOpenChange={(open) => { if (!open && !isDeletingRef.current) setDeletingRecord(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Application</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this application? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isDeletingPending}>
              {isDeletingPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
