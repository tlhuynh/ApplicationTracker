/*A single hook that returns either the real API module or the demo one, based on whether demo mode is active.
  Pages call this hook once and then use the returned functions — no if/else needed in the page code.*/
import { useAuth } from '@/hooks/use-auth';
import * as realApi from '@/api/applicationRecords';
import * as demoApi from '@/api/demoApplicationRecords';

/**
 * Returns the appropriate application records API based on the current mode.
 * In demo mode, returns in-memory functions that read/write sessionStorage.
 * In normal mode, returns the real API functions that call the backend.
 */
export function useApplicationRecordsApi() {
  const { isDemoMode } = useAuth();
  return isDemoMode ? demoApi : realApi;
}
