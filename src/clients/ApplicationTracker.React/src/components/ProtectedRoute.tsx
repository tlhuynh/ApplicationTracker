import { Navigate, Outlet } from 'react-router';
import { useAuth } from '@/hooks/use-auth';

/**
 * Route guard that redirects unauthenticated users to /login.
 *
 * Used as a layout route in the router config — wraps child routes with an auth check.
 * Shows nothing while the initial session restore is in progress (isLoading),
 * preventing a flash of the login page before the refresh token is validated.
 */
export function ProtectedRoute() {
  // Get context access from useAuth()
  const { isAuthenticated, isLoading } = useAuth();

  // Show a place holder div if page is still loading session information. Since checking and restoring session, takes
  // time, without this the login page can be visible.
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // If user is not authenticated, then navigate to login, "replace" prevent user from going back to this protected page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Similar to App.tsx, this will render the "App"/children components
  return <Outlet />;
}
