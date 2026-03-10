import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Route guard that protects guest-only routes such as /login and /register.
 *
 * If the user is already authenticated, navigation is cancelled and they are
 * redirected to the home page — no point showing a login form to a logged-in user.
 *
 * Attach to guest-only routes in app.routes.ts via canActivate: [guestGuard].
 */
export const guestGuard: CanActivateFn = (): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  /**
   * Inverse of authGuard — allow access when NOT authenticated.
   * Redirect to home when the user already has a valid session.
   */
  if (!authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/']);
};
