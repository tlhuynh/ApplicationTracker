import { useEffect, useState } from 'react';
import {
  type ApplicationRecord,
  type CreateRequest,
  create,
  getAll,
} from '@/api/applicationRecords';
import { ApplicationFormDialog } from
    '@/components/applications/ApplicationFormDialog';
import { ApplicationTable } from '@/components/applications/ApplicationTable';
import { columns } from '@/components/applications/columns';
import { Button } from '@/components/ui/button';



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
    refreshApplications(); // ASK ABOUT WHY not make this method async?
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Applications</h2>
        <Button onClick={() => setDialogOpen(true)}>New Application</Button>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading...</p>}
      {error && <p className="text-destructive">{error}</p>}
      {!isLoading && !error && <ApplicationTable columns={columns} data={applications} />}
      <ApplicationFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreate} />
    </div>
  );
}
