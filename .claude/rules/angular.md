---
paths:
  - "src/clients/ApplicationTracker.Angular/**"
---

## Key Patterns

- **Auth**: `auth.service.ts` manages token state (login/register/logout/refresh). `auth.interceptor.ts` attaches Bearer token to every request and handles 401 → silent token refresh → retry original request transparently. Route guards: `auth.guard.ts` redirects unauthenticated users to /login; `guest.guard.ts` redirects already-authenticated users to /home. Login 403 (unconfirmed email): shows inline "Resend confirmation email" button, calls `POST /api/auth/resend-confirmation`, displays feedback in place
- **Dialog pattern**: all modals use `MatDialog` with dedicated standalone components — `application-dialog` (add/edit), `detail-dialog` (read-only detail; opens `description-dialog` in read-only mode when `hasDescription` is true), `note-dialog` (notes viewer), `description-dialog` (job posting description viewer/editor; accepts `readOnly?: boolean` in dialog data to hide the Edit button), `confirm-dialog` (generic confirmation). Follow this pattern for any new dialogs; do not use inline modals
- **Demo mode**: not yet implemented — planned for future development; backend `/parse` endpoint already supports it
- **Production API URL**: `environment.prod.ts` holds `apiUrl`; CI/CD (`deploy-angular.yml`) injects `API_URL` via `sed` before build — never hardcode the URL in source
- **Error handling**: components implement a private `handleError(err: HttpErrorResponse)` method — `5xx/405` → `'Something went wrong on our end. Please try again later.'`; `status > 0` (other 4xx) → `err.error` API message passthrough; `status === 0` → `'Unable to reach the server. Please check your connection.'`. Errors shown via a `serverError` signal rendered inline (not toast). Data-load errors (e.g. home page) use a simpler static `loadError` message without status branching. Silent action errors (delete, status patch, export) just reset the loading state with no message. 401 is handled centrally in `auth.interceptor.ts` — components never handle 401 themselves.

## App Structure

Located in `src/clients/ApplicationTracker.Angular/`:

- `src/app/app.ts` / `app.config.ts` / `app.routes.ts` — root component, DI config, top-level routes
- `src/app/core/` — singleton infrastructure
  - `api/` — generated OpenAPI types (`api.d.ts`) and mapped TypeScript types (`api.types.ts`)
  - `guards/` — `auth.guard.ts`, `guest.guard.ts`
  - `interceptors/` — `auth.interceptor.ts`
  - `services/` — `auth.service.ts`, `application.service.ts` (getAll with filtering/pagination/sort, CRUD, patchStatus, patchDescription, getDescription, importRecords), `theme.service.ts` (light/dark toggle)
- `src/app/features/` — lazy-loaded feature areas
  - `auth/login/` — login form (Reactive Forms, Angular Material)
  - `auth/register/` — registration form
  - `auth/forgot-password/` — forgot password form
  - `auth/reset-password/` — reset password form (token + email from URL params)
  - `auth/confirm-email/` — email confirmation (token + email from URL params)
  - `shell/` — authenticated shell layout (sidebar, nav, router outlet)
  - `applications/home/` — applications table with server-side pagination, sorting, filtering (search, status chips, date range)
  - `applications/import/` — Excel import (.xlsx upload, results table with per-row errors)
  - `applications/application-dialog/` — add/edit
  - `applications/detail-dialog/` — read-only detail
  - `applications/note-dialog/` — notes viewer
  - `applications/description-dialog/` — job posting description viewer/editor (supports `readOnly` flag via dialog data)
- `src/app/shared/` — shared components used across features
  - `confirm-dialog/` — generic confirmation
  - `not-found/` — 404 page
- `src/test/setup.ts` — Vitest global setup

## Code Style

- **Standalone components** — never set `standalone: true` explicitly (default in v20+)
- **`inject()` function** — for all DI, not constructor injection; template/style paths relative to the component TS file
- **Signals** — `signal()` for local state, `computed()` for derived; use `update()`/`set()`, never `mutate()`
- **`input()` and `output()`** — instead of `@Input()` / `@Output()` decorators
- **`ChangeDetectionStrategy.OnPush`** — on every component
- **Reactive Forms** — `FormGroup` / `FormControl` / `Validators`; never template-driven
- **Native control flow** — `@if`, `@for`, `@switch` in templates; never `*ngIf`, `*ngFor`, `*ngSwitch`
- **No `ngClass`** — use `[class]` bindings
- **No `ngStyle`** — use `[style]` bindings
- **No `@HostBinding`/`@HostListener`** — put host bindings in the `host` object of `@Component`/`@Directive`
- **Lazy loading** — via `loadComponent()` or `loadChildren()`
- **`providedIn: 'root'`** — for singleton services
- **`NgOptimizedImage`** — for all static images (not inline base64)
- **Async pipe** — for observables in templates
- **Angular Material** — for UI components (Azure/Blue theme); **SCSS** for component styles
- **Explicit access modifiers** — on all class methods (`public`, `private`, `protected`); never omit
- **File naming** — CLI-generated files omit `.component` suffix: `login.ts` not `login.component.ts`, class is `Login` not `LoginComponent`. Manually created files may use the `.component` convention — check filenames before importing
- **Angular Material card titles** — use as directives on semantic elements: `<h2 mat-card-title>`, `<p mat-card-subtitle>` — not standalone tags — for proper heading roles and WCAG AA compliance
- **Angular Material tests** — always include `provideNoopAnimations()` in providers for any component using Angular Material

## Testing

- **Run command**: `ng test --watch=false` — never `npx vitest run` directly (bypasses the Angular builder; causes `@angular/compiler` not to load and Vitest globals to be missing)
- **Component Testing**: `@testing-library/angular` — `render`, `screen`, `userEvent`
- **Mocking**: `vi.fn()` for service methods; provide mock via `{ provide: ServiceClass, useValue: mock }`
- **Required providers**: always include `provideNoopAnimations()` for any Material component; add `provideRouter([])` when component uses router; add `provideHttpClient()` + `provideHttpClientTesting()` when the service under test injects `HttpClient` even if mocked
- **Setup helper**: extract a `setup()` function per describe block that calls `render()` with all providers — keeps individual tests focused on assertions
- **Error path pattern**: `throwError(() => new HttpErrorResponse({ status: N, error: 'message' }))` to simulate API failures; assert on the error message or UI state rendered in response