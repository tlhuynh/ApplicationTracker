import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

/**
 * Application route configuration.
 *
 * All feature components are lazy loaded — their JS bundles are only downloaded
 * when the user navigates to that route for the first time.
 *
 * Route structure:
 * /login            — guest only (guestGuard redirects authenticated users to /)
 * /register         — guest only
 * /forgot-password  — guest only
 * /reset-password   — guest only (requires ?email=&token= query params from reset email)
 * /                 — protected shell (authGuard redirects unauthenticated users to /login)
 *   (index)         — applications list (home)
 *   /import         — excel import page
 * **                — 404 not found
 */
export const routes: Routes = [
  // ── Guest routes ────────────────────────────────────────────────────────
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/register/register').then((m) => m.Register),
  },
  {
    path: 'forgot-password',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password').then((m) => m.ForgotPassword),
  },
  {
    path: 'reset-password',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/reset-password/reset-password').then((m) => m.ResetPassword),
  },

  // ── Protected routes ─────────────────────────────────────────────────────
  {
    path: '',
    canActivate: [authGuard],
    /**
     * Shell component provides the app layout (sidebar, header, toolbar).
     * Child routes render inside the shell's <router-outlet>.
     */
    loadComponent: () =>
      import('./features/shell/shell').then((m) => m.ShellComponent), // shell uses .component convention (manually created)
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/applications/home/home').then((m) => m.Home),
      },
      {
        path: 'import',
        loadComponent: () =>
          import('./features/applications/import/import').then((m) => m.Import),
      },
    ],
  },

  // ── Fallback ──────────────────────────────────────────────────────────────
  {
    path: '**',
    loadComponent: () =>
      import('./shared/not-found/not-found').then((m) => m.NotFound),
  },
];
