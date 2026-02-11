import { useEffect, useState } from 'react';
import { type ApplicationRecord, getAll } from '@/api/applicationRecords';
import { ApplicationTable } from '@/components/applications/ApplicationTable';
import { columns } from '@/components/applications/columns';

export function HomePage() {
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAll()
      .then(setApplications)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load applications');
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Applications</h2>
      {isLoading && <p className="text-muted-foreground">Loading...</p>}
      {error && <p className="text-destructive">{error}</p>}
      {!isLoading && !error && <ApplicationTable columns={columns} data={applications} />}
    </div>
  );
}
