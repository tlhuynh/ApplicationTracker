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
 * /login        — guest only (guestGuard redirects authenticated users to /)
 * /register     — guest only
 * /             — protected shell (authGuard redirects unauthenticated users to /login)
 *   (index)     — applications list (home)
 *   /import     — excel import page
 * **            — 404 not found
 */
export const routes: Routes = [
  // ── Guest routes ────────────────────────────────────────────────────────
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
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
      import('./features/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/applications/home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'import',
        loadComponent: () =>
          import('./features/applications/import/import.component').then((m) => m.ImportComponent),
      },
    ],
  },

  // ── Fallback ──────────────────────────────────────────────────────────────
  {
    path: '**',
    loadComponent: () =>
      import('./shared/not-found/not-found.component').then((m) => m.NotFoundComponent),
  },
];
