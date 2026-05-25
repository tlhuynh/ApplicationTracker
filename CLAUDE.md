# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ApplicationTracker is a full-stack .NET project for tracking job applications, built as a learning playground to explore modern technologies. The core focus is ASP.NET Core Web API with web frontends (React production-deployed, Angular 21 in progress), alongside a .NET MAUI Blazor Hybrid app for mobile and desktop.

**Tech Stack:** .NET 10, C# 13, ASP.NET Core Web API, EF Core, SQL Server, ASP.NET Core Identity, JWT Bearer Auth, .NET MAUI, Blazor Hybrid, MudBlazor, SQLite, Scalar, ClosedXML, React, Angular 21, Vite, Vitest

**Target Platforms:** Web (React), Android, iOS, macOS (Catalyst), Windows

## Build Commands

```bash
# Install workloads (required first time)
dotnet workload restore

# Restore dependencies
dotnet restore

# Build MAUI app for specific platforms
dotnet build src/clients/ApplicationTracker.Maui -f net10.0-android
dotnet build src/clients/ApplicationTracker.Maui -f net10.0-ios
dotnet build src/clients/ApplicationTracker.Maui -f net10.0-maccatalyst
dotnet build src/clients/ApplicationTracker.Maui -f net10.0-windows10.0.19041.0

# Build and run the API (Scalar UI at /scalar/v1 in Development)
dotnet run --project src/backend/ApplicationTracker.Api
```

```bash
# React client (from src/clients/ApplicationTracker.React/)
npm run dev            # Start dev server
npm run build          # Type-check and build for production
npm run lint           # Run ESLint
npm run format         # Run Prettier
npm test               # Run tests once
npm run test:watch     # Run tests in watch mode
npm run generate-types # Generate TypeScript types from OpenAPI spec (backend must be running)
```

```bash
# Angular client (from src/clients/ApplicationTracker.Angular/)
npm start              # Start dev server on http://localhost:4200 (proxies API to :5021)
npm run build          # Build for production
npm test               # Run Vitest tests once
npm run test:watch     # Run tests in watch mode
```

## Backend Setup

- SQL Server 2022 runs via Docker (`docker-compose.yml` at project root)
- SA password stored in `.env` (gitignored); `.env.example` checked in as template
- Real connection string stored via `dotnet user-secrets` (not in appsettings)
- JWT secret key stored via `dotnet user-secrets` (`Jwt:Key`); non-secret settings (Issuer, Audience, ExpiryInMinutes) in `appsettings.json`
- `appsettings.Development.json` has a placeholder password (`<see-user-secrets>`)
- EF Core migrations live in `ApplicationTracker.Infrastructure`, startup project is `ApplicationTracker.Api`

```bash
# Apply EF Core migrations
dotnet ef database update --project src/backend/ApplicationTracker.Infrastructure --startup-project src/backend/ApplicationTracker.Api
```

## Architecture

### Project Structure

```
src/
├── backend/
│   ├── ApplicationTracker.Api/           # ASP.NET Core Web API
│   ├── ApplicationTracker.Core/          # Domain entities, interfaces
│   └── ApplicationTracker.Infrastructure/# Data access, external services
├── clients/
│   ├── ApplicationTracker.Maui/          # .NET MAUI Blazor app
│   ├── ApplicationTracker.React/         # React SPA (Vite + TypeScript)
│   └── ApplicationTracker.Angular/       # Angular 21 SPA (WIP)
└── shared/
    └── ApplicationTracker.Shared/        # DTOs shared between API and clients
```

### Project References

```
Api → Core, Infrastructure, Shared
Infrastructure → Core
Shared → Core
Maui → Shared (gets Core transitively)
```

### Key Patterns

- **Clean Architecture**: Backend follows layered architecture (Core → Application → Infrastructure → Api)
- **Dependency Injection**: Services registered in `MauiProgram.cs` and API's `Program.cs`
- **MVVM with Blazor**: Components use code-behind pattern (`.razor` + `.razor.cs`)
- **Async Data Access**: All database operations are async via `SQLiteAsyncConnection`
- **Lazy Initialization**: Database connection initialized on first use via `Init()` pattern
- **MVC Controllers**: API uses traditional `[ApiController]` controllers, not Minimal APIs
- **Service Location**: Service implementations live in **Api project** (not Infrastructure) — keeps Infrastructure focused on data access
- **Interface Organization**: Core interfaces organized into subfolders: `Interfaces/Repositories/`, `Interfaces/Services/`
- **Manual Mapping**: Extension methods in `Shared/Mappings/` (no AutoMapper)
- **Request Validation**: DataAnnotations on request DTOs
- **Excel Import**: ClosedXML for parsing `.xlsx` uploads; service returns domain models, controller maps to DTOs. Validation: CompanyName required, Status must match enum name (numeric values rejected), AppliedDate required (culture-invariant parsing via `CultureInfo.InvariantCulture`), PostingUrl must be valid HTTP/HTTPS if provided. Duplicate detection: CompanyName + PostingUrl (when URL provided), fallback to CompanyName + AppliedDate (database check only, not within same batch). `IExcelImportService` has two methods: `ImportAsync` (parse + validate + save, requires userId) and `ParseAsync` (parse + validate only, no DB save, used by the public `/parse` endpoint for demo mode)
- **Domain Models**: Non-entity result types live in `Core/Models/` (e.g., `ExcelImportResult`)
- **Partial Updates**: `PATCH /api/applicationrecords/{id}/status` updates only the status field — uses `PatchStatusRequest` DTO and `UpdateStatusAsync` service method
- **Authentication**: ASP.NET Core Identity + JWT Bearer tokens. `AuthController` provides register, login, refresh, logout, confirm-email, resend-confirmation, forgot-password, and reset-password endpoints. `TokenService` generates JWT access tokens (15 min) and opaque refresh tokens (7 days); `RefreshTokens` stores **SHA-256 hashes** plus Identity **security stamp** for invalidation on sensitive account changes. Refresh token rotation on each use. `LoginRequest.RememberMe` controls whether a refresh token is issued (false = session-only, no refresh token stored). Logout endpoint (`POST /api/auth/logout`, `[Authorize]`) revokes the refresh token server-side. Email confirmation required before login (403 if unconfirmed). `ConsoleEmailService` logs confirmation/reset links to console (dev); `IEmailService` abstraction for future SMTP. `ApplicationDbContext` extends `IdentityDbContext<IdentityUser>`. `[Authorize]` on `ApplicationRecordsController`; `AuthController` register/login/refresh and email confirmation/reset endpoints are public, logout requires auth. `BearerSecuritySchemeTransformer` adds JWT auth UI to Scalar
- **Per-User Data**: All repository queries filter by `UserId`. Controller extracts user ID from JWT `sub` claim via `User.FindFirstValue(ClaimTypes.NameIdentifier)`. Service layer passes userId through to repositories. Records are stamped with `UserId` on creation and import. Users can only see/edit/delete their own records
- **URL Param Validation (React)**: When a page requires URL query params (e.g. `ConfirmEmailPage`, `ResetPasswordPage`), validate them before any `useState` calls and use lazy initializers to set the correct initial state — never call `setStatus`/`setMessage` inside `useEffect` for a condition that's already known on mount. This prevents a flash of "loading" state and avoids the `react-hooks/set-state-in-effect` lint rule. Pattern: read params → derive `isMissingParams` → pass to `useState(() => isMissingParams ? 'error' : 'loading')`. The `useEffect` then guards with `if (isMissingParams) return;` before making any API call.
- **Frontend Auth**: `AuthProvider` manages in-memory access token + localStorage refresh token. `useAuth()` hook provides `login`, `register`, `logout`, `user`, `isAuthenticated`, `isLoading`, `isDemoMode`, `enterDemoMode`, `exitDemoMode`. `ProtectedRoute` layout route redirects unauthenticated users to `/login`. Silent session restore on page refresh via stored refresh token. Auto-refresh at 80% of token TTL. `authFetch()` wrapper in `client.ts` attaches Bearer header and retries once on 401 (refreshes token transparently). Login/Register pages redirect authenticated users to `/` via `<Navigate>`. "Remember me" checkbox on login — unchecked = session-only (no refresh token), checked = persistent session. Logout calls backend to revoke refresh token (fire-and-forget). Registration shows "check your email" success card. Login handles 403 (unconfirmed email) with resend button. Forgot password and reset password flows via dedicated pages
- **Demo Mode**: "Try Demo" button on `LoginPage` — no account required. `enterDemoMode()` seeds 6 sample records into `sessionStorage` and sets `isAuthenticated = true`/`user = 'Demo'` so `ProtectedRoute` passes through unchanged. `demoStore.ts` manages sessionStorage keys (`demo_mode`, `demo_applications`). `demoApplicationRecords.ts` mirrors `applicationRecords.ts` signatures but operates on the demo store. `useApplicationRecordsApi()` hook returns real or demo API functions based on `isDemoMode`. Excel import in demo mode calls the public `POST /api/applicationrecords/parse` endpoint (real ClosedXML validation, no DB save) and adds parsed rows to the demo store. Amber banner shown in `App.tsx` with "Sign In" CTA. Demo data survives page refresh (sessionStorage) but clears when browser closes. Duplicate detection not available in demo mode (noted in ImportPage UI)
- **Frontend Error Handling**: Auth form errors (Login/Register) use shadcn `Alert` (destructive variant) — more visible than plain text. Status-code-based messages: 5xx/405 → `"Something went wrong on our end. Please try again later."`, 4xx → API message passthrough, non-`ApiError` (network/connection) → `"Unable to reach the server. Please check your connection."`. Toast errors use `getToastErrorMessage(err, fallback)` in `src/lib/utils.ts` — same routing logic centralised as a helper. Toast duration set to 6000ms via `toastOptions` on `<Toaster />`
- **Loading States**: Auth pages (Login, Register, ForgotPassword, ResetPassword) show a semi-transparent `Loader2` overlay (`absolute inset-0`, Card needs `relative`) while `isSubmitting` is true — blocks all card interaction including links and secondary buttons. `ApplicationFormDialog` shows a `Loader2` spinner on the Save button and prevents close (X button, Escape) via `handleOpenChange` wrapper. `HomePage` tracks `isDeletingPending` (blocks AlertDialog buttons + keeps dialog open via `isDeletingRef` ref during delete) and `pendingStatusId` (disables advance/reject buttons on the specific row being updated). File input on `ImportPage` is `disabled` during upload.
- **Production API URL**: `API_BASE_URL` exported from `client.ts` reads `import.meta.env.VITE_API_URL ?? ''`. Prefixed in `authFetch`, `refreshToken`, and `auth.ts BASE_URL`. Empty in development (Vite proxy handles routing), full URL in production
- **CI/CD**: GitHub Actions in `.github/workflows/`. API (`deploy-api.yml`): test → **migrate** (`dotnet ef database update` against Azure SQL, temporary SQL firewall rule for the runner) → publish → deploy to App Service (publish profile). Manual migrate / safety valve: `migrate-database.yml` (`workflow_dispatch`, checklist + `confirm=yes`). Required GitHub secrets for migrate jobs: `AZURE_CREDENTIALS`, `AZURE_RESOURCE_GROUP`, `AZURE_SQL_SERVER_NAME`, `AZURE_SQL_CONNECTION_STRING` (plus existing `AZURE_APP_SERVICE_*` for deploy). Frontend: test → build (`VITE_API_URL` secret) → Azure Static Web Apps
- **Azure Production**: `appsettings.Production.json` for non-secret production config (CORS, FrontendBaseUrl). Azure App Settings: `Jwt__Key`, `ASPNETCORE_ENVIRONMENT=Production`, `App__FrontendBaseUrl`. Connection string in Connection Strings tab (type SQLAzure). CORS reads from `AllowedOrigins` config array

### MAUI App Structure

Located in `src/clients/ApplicationTracker.Maui/`:

- `Components/` - Blazor components (Pages, Layout, Dialogs, DataGrids)
- `Models/` - Data entities inheriting from `BaseEntity`
- `Services/` - Business logic and data access (`DatabaseService`)
- `Utilities/` - Constants and enums
- `Platforms/` - Platform-specific code (Android, iOS, macOS, Windows)

### Angular App Structure

Located in `src/clients/ApplicationTracker.Angular/`:

- `src/app/app.ts` / `app.config.ts` / `app.routes.ts` — root component, DI config, top-level routes
- `src/app/core/` — singleton infrastructure
  - `api/` — generated OpenAPI types (`api.d.ts`) and mapped TypeScript types (`api.types.ts`)
  - `guards/` — `auth.guard.ts` (redirect to /login if not authenticated), `guest.guard.ts` (redirect to /home if already authenticated)
  - `interceptors/` — `auth.interceptor.ts` (attaches Bearer token, handles 401 → token refresh → retry)
  - `services/` — `auth.service.ts` (login/register/logout/token state), `application.service.ts` (CRUD for application records)
- `src/app/features/` — lazy-loaded feature areas
  - `auth/login/` — login form (Reactive Forms, Angular Material)
  - `auth/register/` — registration form
  - `shell/` — authenticated shell layout (sidebar, nav, router outlet)
  - `applications/home/` — applications list/table (WIP — placeholder content)
  - `applications/import/` — Excel import (WIP — empty component)
  - `applications/application-dialog/` — add/edit dialog (Angular Material `MatDialog`)
- `src/app/shared/` — shared components used across features
  - `confirm-dialog/` — generic confirmation dialog
  - `not-found/` — 404 page
- `src/test/setup.ts` — Vitest global setup

**Status (2026-05-25):** Auth flows (login, register), shell layout, guards, interceptor, and ApplicationService are complete. Home and Import pages are next to build — see React equivalents for feature reference.

### React App Structure

Located in `src/clients/ApplicationTracker.React/`:

- `src/api/` - API client functions (`applicationRecords.ts` + `parseExcel()` public endpoint, `auth.ts`, `client.ts`, `demoStore.ts` sessionStorage helpers, `demoApplicationRecords.ts` mock API for demo mode)
- `src/components/` - App components (`AppSidebar.tsx`, `AuthProvider.tsx`, `ProtectedRoute.tsx`, `ThemeProvider.tsx`, `ThemeToggle.tsx`)
- `src/components/applications/` - Application feature components (`ApplicationTable`, `ApplicationFormDialog`, `applicationColumns`, `NotesCell`)
- `src/components/ui/` - shadcn/ui generated components (ESLint-ignored)
- `src/hooks/` - Custom hooks (`use-auth.ts`, `use-application-records-api.ts` API switcher, `use-mobile.ts`, `use-theme.ts`)
- `src/lib/` - Utilities (`utils.ts` with `cn()` helper) and constants (`constants.ts`)
- `src/pages/` - Route page components (`HomePage`, `ImportPage`, `LoginPage`, `RegisterPage`, `ConfirmEmailPage`, `ForgotPasswordPage`, `ResetPasswordPage`, `NotFoundPage`)
- `src/types/` - Generated TypeScript types from OpenAPI spec (`api.d.ts`)
- `src/test/` - Test setup (`setup.ts` with JSDOM mocks)
- `vite.config.ts` - Vite + Vitest + API proxy configuration
- `eslint.config.js` - ESLint with TypeScript and React rules
- `.prettierrc` - Prettier formatting config (singleQuote, printWidth 100, 2-space indent)
- `components.json` - shadcn/ui configuration

### Entity Design

`BaseEntity` provides common fields: `Id`, `CreatedAt`, `LastModified`, `UserId`, `ServerId`, `NeedsSync`, `IsDeleted` - designed for future server sync capability.

`RefreshToken` is a standalone entity (not extending `BaseEntity`) for auth infrastructure — stores SHA-256 token hash, user ID, security stamp, expiration, revocation flag, and `CreatedAt` (defaulted to `DateTime.UtcNow` via property initializer; never set explicitly in object initializers).

## Code Style

### C# (Enforced by .editorconfig)

- **Use explicit types** - no `var` keyword
- **K&R brace style** - opening braces on same line
- **File-scoped namespaces** - `namespace Foo;` not `namespace Foo { }`
- **4-space indentation** for C#, Razor, XAML
- **Private fields**: `_camelCase` with underscore prefix
- **Public members**: `PascalCase`
- **Interfaces**: `IPascalCase` with 'I' prefix
- **No `ConfigureAwait(false)`** - not needed in MAUI apps
- **XML doc comments** (`/// <summary>`) on classes, methods, and properties
- **Primary constructors** for DI injection (C# 12+ syntax)
- **Target-typed `new()`** when type is clear from context (C# 9+)
- **Collection expressions** `[]` for collection initialization (C# 12+)
- **Route constraints** `{id:int}` on API endpoints with route parameters
- **`/// <inheritdoc />`** on interface implementation methods instead of repeating docs

### Example

```csharp
namespace ApplicationTracker.Services;

public class ExampleService {
    private readonly ILogger<ExampleService> _logger;

    public async Task<List<string>> GetItemsAsync() {
        List<string> items = await FetchItemsAsync();
        return items;
    }
}
```

### TypeScript / Angular

- **Strict type checking** — strict mode enabled, no `any`; use `unknown` when type is uncertain
- **Prefer type inference** when the type is obvious from context
- **Standalone components** — always use standalone; do NOT set `standalone: true` explicitly (default in Angular v20+)
- **`inject()` function** for dependency injection — not constructor injection
- **Signals for state** — `signal()` for local state, `computed()` for derived state; never use `mutate()`, use `update()` or `set()` instead
- **`input()` and `output()` functions** instead of `@Input()` / `@Output()` decorators
- **`ChangeDetectionStrategy.OnPush`** on every component
- **Reactive Forms** — `FormGroup` / `FormControl` / `Validators`; avoid template-driven forms
- **Native control flow** — `@if`, `@for`, `@switch` in templates; never use `*ngIf`, `*ngFor`, `*ngSwitch`
- **No `ngClass`** — use `class` bindings instead
- **No `ngStyle`** — use `style` bindings instead
- **No `@HostBinding` / `@HostListener`** — put host bindings inside the `host` object of `@Component` or `@Directive`
- **Lazy loading** — feature routes loaded lazily via `loadComponent()` or `loadChildren()`
- **`providedIn: 'root'`** for singleton services
- **`NgOptimizedImage`** for all static images (not for inline base64)
- **Async pipe** to handle observables in templates
- **Accessibility** — must pass AXE checks and meet WCAG AA minimums (focus management, color contrast, ARIA attributes)
- **Angular Material** for UI components — Azure/Blue theme
- **SCSS** for component styles
- **`inject()` for DI**, paths relative to component TS file for external templates/styles
- **Explicit access modifiers** on all methods (`public`, `private`, `protected`) — never omit
- **Angular 21 file naming**: CLI-generated files omit `.component` suffix — `login.ts` not `login.component.ts`, class name is `Login` not `LoginComponent`. Manually created files (written without CLI) may use the `.component` convention — check actual filenames before importing
- **Angular Material card titles**: `mat-card-title` and `mat-card-subtitle` render as `div` by default — always use them as directives on semantic elements: `<h2 mat-card-title>` and `<p mat-card-subtitle>` for proper heading roles and WCAG AA compliance
- **Angular Material tests**: always include `provideNoopAnimations()` in providers for any component that uses Angular Material — required for components to render their content correctly in tests

### TypeScript / React

- **TypeScript** — strict mode, no `any` unless unavoidable
- **K&R brace style** — opening braces on same line (consistent with C#)
- **2-space indentation** for TS, TSX, CSS, JSON
- **Single quotes** for strings, **backticks** for interpolation
- **Semicolons** required
- **Functional components** only — no class components
- **Function declarations** for components, **arrow functions** for handlers and helpers
- **Named exports** preferred over default exports
- **`interface`** over `type` for object shapes
- **`camelCase`** for variables, functions, props
- **`PascalCase`** for components, interfaces, type aliases
- **Tailwind CSS** for styling, **shadcn/ui** for pre-built components
- **JSDoc comments** on exported functions and components when intent isn't obvious

#### Example

```tsx
import styles from './ApplicationList.module.css';

interface ApplicationListProps {
  title: string;
  count: number;
}

export function ApplicationList({ title, count }: ApplicationListProps) {
  const handleClick = () => {
    console.log('clicked');
  };

  return (
    <div className={styles.container}>
      <h2>{title}</h2>
      <span>{count}</span>
      <button onClick={handleClick}>Refresh</button>
    </div>
  );
}
```

## Testing

### Backend (.NET)

- **Framework**: xUnit (preferred)
- **Mocking**: Moq
- **Pattern**: AAA (Arrange, Act, Assert)
- **Scope**: Unit tests for service and controller layers
- Test projects go in the `tests/` directory

| Project | Tests For | Mocks |
|---------|-----------|-------|
| `ApplicationTracker.Api.Tests` | Controllers, Services | `IApplicationRecordRepository`, `IApplicationRecordService`, `IExcelImportService` |

```bash
# Run all .NET tests
dotnet test

# Run specific test project
dotnet test tests/ApplicationTracker.Api.Tests
```

#### Test Boundaries

- **Service tests** mock the repository layer — verify orchestration logic and correct repository calls via `Verify()`
- **Controller tests** mock the service layer — verify HTTP status codes and response shapes. Use `DefaultHttpContext` with `ClaimsPrincipal` to mock the authenticated user
- **Soft-delete, timestamps, validation (400s)** are infrastructure/framework concerns — need integration tests (not yet implemented)

### Frontend (React)

- **Test Runner**: [Vitest](https://vitest.dev/) — fast, Vite-native
- **Component Testing**: [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) — test from the user's perspective (render, click, assert on DOM)
- **API Mocking**: [MSW (Mock Service Worker)](https://mswjs.io/) — intercept network requests at the service worker level
- **E2E**: [Playwright](https://playwright.dev/) — full browser automation (future)
- **Pattern**: AAA (Arrange, Act, Assert) — consistent with backend

#### What to test

- **Components**: renders with given props, conditional rendering (loading/error/empty states), user interactions (click → state change → UI update)
- **Hooks**: custom hooks with `renderHook` from React Testing Library
- **API integration**: components that fetch data, mocked with MSW
- **Forms**: validation, submission, error display

```bash
# Run React tests (from src/clients/ApplicationTracker.React/)
npm test

# Watch mode
npm run test:watch
```

## Response Guidelines

- When discussing tools, frameworks, or concepts, include links to official documentation when available
- Prioritize Microsoft Learn, MDN, and other primary sources over third-party articles
- **Judgment-based edits** — apply changes directly for routine, clear-scope, single-file work; propose first (objective, files, steps, risks) for multi-file, architectural, or non-obvious changes
- **No database or EF Core commands** — never run `dotnet ef`, `database update`, SQL scripts, or any migration-related commands; flag the need and let the user handle it
- **React concepts**: see `docs/react-concepts.md` for topics already covered — don't re-explain these from scratch
- **Code comments**: only when the *why* is non-obvious — a hidden constraint, a subtle invariant, a workaround for a specific bug. Skip self-evident lines. XML `/// <summary>` for C# public members, JSDoc for exported TS functions when intent isn't obvious
- **New RxJS operators**: when introducing an RxJS operator not previously used in the Angular client, provide a brief explanation of what it does, when to use it, and any important gotchas before or alongside the code
- **Security checkpoint**: when touching auth code, token handling, or data access boundaries, flag it and offer to run `/security-review`
