import { useEffect, useState } from 'react';
import {
  type ApplicationRecord,
  type CreateRequest,
  create,
  getAll,
  remove,
  update,
} from '@/api/applicationRecords';
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
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

/*
* Page is where we put everything together
*
* Contains states (useState), make api calls(useEffect), and call components to display on the page
* */
export function HomePage() {
  /*
  * State variables for the page
  * */
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ApplicationRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<ApplicationRecord | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  /*
  * useEffect for API calls
  *
  * this one is run on mount/init
  * useEffect with an empty dependency array [] runs once after the first render,
  * equivalent to Blazor's OnInitializedAsync
  * */
  // Initial fetch on mount — setState calls are in async callbacks
  // (.then/.catch/.finally),
  // not synchronously in the effect body, which satisfies the React Compiler
  useEffect(() => {
    getAll()
      .then(setApplications)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load applications');
      })
      .finally(() => setIsLoading(false));
  }, []);

  /*
  * The difference matters:
  * useEffect is for side effects triggered by state/prop changes; regular functions
  * are for side effects triggered by user actions
  *
  * Since this method is mainly used in handleCreate, which is fine with asyncm this can be rewritten to be
  * an async method
  * */
  // Refetch data — only called from event handlers (not effects)
  const refreshApplications = () => {
    setIsLoading(true);
    setError(null);
    getAll()
      .then(setApplications)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load applications');
      })
      .finally(() => setIsLoading(false));
  };

  const handleCreate = async (data: CreateRequest) => {
    await create(data);
    refreshApplications();
  };

  const handleEdit = (record: ApplicationRecord) => {
    setEditingRecord(record);
    setDialogOpen(true);
  };

  const handleUpdate = async (data: CreateRequest) => {
    if (!editingRecord?.id) return;
    await update(Number(editingRecord.id), data);
    refreshApplications();
  };

  const handleDelete = (record: ApplicationRecord) => {
    setDeletingRecord(record);
  };

  const confirmDelete = () => {
    if (!deletingRecord?.id) return;
    remove(Number(deletingRecord.id))
      .then(refreshApplications)
      .catch((err: unknown) => {
        toast.error(err instanceof Error ? err.message : 'Failed to delete application');
      })
      .finally(() => setDeletingRecord(null));
  };

  const tableColumns = createColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
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
                                                 onGlobalFilterChange={setSearchFilter}/>}
      <ApplicationFormDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        onSubmit={editingRecord ? handleUpdate : handleCreate}
        initialData={editingRecord ?? undefined} />
      <AlertDialog open={!!deletingRecord} onOpenChange={(open) => { if (!open) setDeletingRecord(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Application</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this application? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
