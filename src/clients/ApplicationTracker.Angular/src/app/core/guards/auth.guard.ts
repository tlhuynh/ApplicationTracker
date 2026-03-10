import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Route guard that protects routes requiring authentication.
 *
 * Reads the isAuthenticated signal from AuthService — if the user is not
 * authenticated, navigation is cancelled and the user is redirected to /login.
 *
 * Attach to protected routes in app.routes.ts via canActivate: [authGuard].
 */
export const authGuard: CanActivateFn = (): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  /**
   * isAuthenticated is a signal — calling it as a function reads the current value.
   * No subscription needed, signals are synchronous.
   */
  if (authService.isAuthenticated()) {
    return true;
  }

  /**
   * Return a UrlTree instead of calling router.navigate() directly.
   * This lets Angular handle the redirect as part of the navigation cycle,
   * which is cleaner and avoids potential race conditions with the router.
   */
  return router.createUrlTree(['/login']);
};
