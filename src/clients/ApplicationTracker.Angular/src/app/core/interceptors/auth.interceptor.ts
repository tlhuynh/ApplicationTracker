import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Module-level flag to prevent concurrent refresh attempts.
 * If multiple requests return 401 simultaneously, only one refresh call is made.
 */
let isRefreshing = false;

/**
 * Checks whether a URL belongs to the auth endpoints that should never
 * trigger a token refresh retry — avoids infinite refresh loops.
 */
function isAuthEndpoint(url: string): boolean {
  return url.includes('/api/Auth/refresh') || url.includes('/api/Auth/login');
}

/**
 * Returns a clone of the request with the Authorization header attached.
 * Cloning is required because HttpRequest objects are immutable in Angular.
 */
function addAuthHeader(req: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
  if (!token) {
    return req;
  }

  return req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });
}

/**
 * Functional HTTP interceptor that handles auth token attachment and 401 retry.
 *
 * Runs on every outgoing HttpClient request in the following order:
 * 1. Attach the Bearer token from AuthService (in-memory access token)
 * 2. If the response is 401 and the request is not an auth endpoint:
 *    a. Call AuthService.refresh() to get a new token pair
 *    b. Retry the original request with the new access token (switchMap)
 *    c. If refresh fails, log the user out and propagate the error
 */
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const authService = inject(AuthService);

  // Attach Bearer token to the outgoing request
  const authReq = addAuthHeader(req, authService.getAccessToken());

  // Pass the authReq along, pipe the response below to handle error if some issue occured
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      /**
       * Only attempt a token refresh when:
       * - The server returned 401 (Unauthorized — token expired)
       * - The failing request was not itself an auth endpoint (prevents infinite loop)
       * - A refresh is not already in progress (prevents concurrent refresh calls)
       */
      if (error.status === 401 && !isAuthEndpoint(req.url) && !isRefreshing) {
        isRefreshing = true;

        return authService.refresh().pipe(
          /**
           * switchMap cancels any pending inner observable and switches to a new one.
           * Here it discards the AuthResponse and retries the original request
           * with the updated token now held in AuthService memory.
           */
          switchMap(() => {
            isRefreshing = false;
            const retryReq = addAuthHeader(req, authService.getAccessToken());
            return next(retryReq);
          }),
          catchError((refreshError) => {
            // Refresh failed — session is unrecoverable, log the user out
            isRefreshing = false;
            authService.logout();
            return throwError(() => refreshError);
          })
        );
      }

      return throwError(() => error);
    })
  );
};
