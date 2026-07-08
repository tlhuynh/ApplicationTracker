# CLAUDE.md

## Project Overview

ApplicationTracker is a full-stack .NET project for tracking job applications, built as a learning playground to explore modern technologies. The core focus is ASP.NET Core Web API with web frontends (React and Angular 21 both production-deployed on Azure SWA; Angular is the active client), alongside a .NET MAUI Blazor Hybrid app for mobile and desktop (planned for future development).

**Tech Stack:** .NET 10, C# 13, ASP.NET Core Web API, EF Core, SQL Server, ASP.NET Core Identity, JWT Bearer Auth, .NET MAUI, Blazor Hybrid, MudBlazor, SQLite, Scalar, ClosedXML, React, Angular 21, Vite, Vitest

**Deployed on:** Azure App Service (API), Azure Static Web Apps (Angular — active; React — standby)

## Build Commands

```bash
# Build MAUI app for specific platforms
dotnet build src/clients/ApplicationTracker.Maui -f net10.0-android
dotnet build src/clients/ApplicationTracker.Maui -f net10.0-ios
dotnet build src/clients/ApplicationTracker.Maui -f net10.0-maccatalyst
dotnet build src/clients/ApplicationTracker.Maui -f net10.0-windows10.0.19041.0

# Run the API (Scalar UI at /scalar/v1 in Development)
dotnet run --project src/backend/ApplicationTracker.Api

# Generate TypeScript types from OpenAPI spec (backend must be running)
# Run after any backend API change — never manually edit api.d.ts directly
# Only hand-edit custom types in api.types.ts that aren't derivable from the schema
# Both Angular and React clients have their own generate-types script and api.d.ts
npm run generate-types  # from src/clients/ApplicationTracker.Angular/ or src/clients/ApplicationTracker.React/

# Apply EF Core migrations (run this yourself — assistant cannot run dotnet ef)
dotnet ef database update --project src/backend/ApplicationTracker.Infrastructure --startup-project src/backend/ApplicationTracker.Api
```

## Backend Setup

- SQL Server 2022 runs via Docker (`docker-compose.yml` at project root)
- SA password stored in `.env` (gitignored); `.env.example` checked in as template
- Real connection string stored via `dotnet user-secrets` (not in appsettings)
- JWT secret key stored via `dotnet user-secrets` (`Jwt:Key`); non-secret settings (Issuer, Audience, ExpiryInMinutes) in `appsettings.json`
- EF Core migrations live in `ApplicationTracker.Infrastructure`, startup project is `ApplicationTracker.Api`
- Production uses Azure SQL; connection string set in Azure App Service → Connection Strings tab (type SQLAzure), not in appsettings

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
│   └── ApplicationTracker.Angular/       # Angular 21 SPA
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
- **MAUI patterns** (future dev): code-behind (`.razor` + `.razor.cs`), async `SQLiteAsyncConnection`, lazy `Init()` pattern on first use
- **MVC Controllers**: API uses traditional `[ApiController]` controllers, not Minimal APIs
- **Service Location**: Service implementations live in **Api project** (not Infrastructure) — keeps Infrastructure focused on data access
- **Manual Mapping**: Extension methods in `Shared/Mappings/` (no AutoMapper)
- **Request Validation**: DataAnnotations on request DTOs
- **Excel Import**: ClosedXML for parsing `.xlsx` uploads; service returns domain models, controller maps to DTOs. Validation: CompanyName required, Status must match enum name (numeric values rejected), AppliedDate required (culture-invariant parsing via `CultureInfo.InvariantCulture`), PostingUrl must be valid HTTP/HTTPS if provided. Duplicate detection: CompanyName + PostingUrl (when URL provided), fallback to CompanyName + AppliedDate (database check only, not within same batch). `IExcelImportService` has two methods: `ImportAsync` (parse + validate + save, requires userId) and `ParseAsync` (parse + validate only, no DB save, used by the public `/parse` endpoint for demo mode)
- **Domain Models**: Non-entity result types live in `Core/Models/` (e.g., `ExcelImportResult`)
- **Partial Updates**: `PATCH /api/applicationrecords/{id}/status` updates only the status field — uses `PatchStatusRequest` DTO and `UpdateStatusAsync` service method
- **Authentication**: ASP.NET Core Identity + JWT Bearer tokens. `AuthController` provides register, login, refresh, logout, confirm-email, resend-confirmation, forgot-password, and reset-password endpoints. `TokenService` generates JWT access tokens (15 min) and opaque refresh tokens (7 days); `RefreshTokens` stores **SHA-256 hashes** (never raw values) plus Identity **security stamp** — stale tokens rejected after password changes. Refresh token rotation on each use. Logout validates `stored.UserId == currentUserId` before revoking (403 on mismatch). Password reset and email confirm both revoke **all** active refresh tokens for the user. `LoginRequest.RememberMe` controls whether a refresh token is issued (false = session-only). Email confirmation required before login (403 if unconfirmed). **Email enumeration hardening**: register returns neutral 200 for all three cases (new account, existing unconfirmed, existing confirmed) — never reveal which case applies. **Rate limiting**: per-email cap (3 sends/hour via `IMemoryCache`) + IP-based fixed window (10 req/15 min via `[EnableRateLimiting("auth")]`) on register/resend-confirmation/forgot-password. Email sending via `IEmailService`: config-switchable between `ConsoleEmailService` and `ResendEmailService` (Resend API, sends branded HTML + plain-text fallback) for local dev; production always uses `ResendEmailService`. `ApplicationDbContext` extends `IdentityDbContext<IdentityUser>`. `[Authorize]` on `ApplicationRecordsController`; `AuthController` register/login/refresh and email confirmation/reset endpoints are public, logout requires auth. `BearerSecuritySchemeTransformer` adds JWT auth UI to Scalar
- **Per-User Data**: All repository queries filter by `UserId`. Controllers extract user ID via `TryGetUserId()` (returns 401 on missing claim — never use null-forgiving `FindFirstValue`). Service layer passes userId through to repositories. Records are stamped with `UserId` on creation and import. Users can only see/edit/delete their own records
- **CI/CD**: GitHub Actions in `.github/workflows/`. API (`deploy-api.yml`): test → migrate → deploy to App Service. Manual migrate safety valve: `migrate-database.yml` (workflow_dispatch). Frontend: test → build → deploy to Azure SWA. See workflow files for secrets and step details.
- **Azure Production**: `appsettings.Production.json` for non-secret config (CORS, FrontendBaseUrl). Azure App Settings: `Jwt__Key`, `ASPNETCORE_ENVIRONMENT=Production`, `App__FrontendBaseUrl`. CORS reads from `AllowedOrigins` config array

Client-specific patterns, app structure, code style, and testing for React and Angular are in `.claude/rules/` — loaded automatically when working in those directories.

### MAUI App Structure

Located in `src/clients/ApplicationTracker.Maui/`:

- `Components/` - Blazor components (Pages, Layout, Dialogs, DataGrids)
- `Models/` - Data entities inheriting from `BaseEntity`
- `Services/` - Business logic and data access (`DatabaseService`)
- `Utilities/` - Constants and enums
- `Platforms/` - Platform-specific code (Android, iOS, macOS, Windows)

### Entity Design

`BaseEntity` provides common fields: `Id`, `CreatedAt`, `LastModified`, `UserId`, `IsDeleted`.

`Interview` extends `BaseEntity` — fields: `ApplicationRecordId` (FK → `ApplicationRecord`, cascade delete), `Type` (`InterviewType` enum: Screening/Technical/Onsite/Other), `RoundNumber` (optional int, user-managed — not auto-assigned), `Date` (DateTime), `Outcome` (optional `InterviewOutcome` enum: Pending/Passed/Failed), `Notes` (optional, max 5000 chars). Scoped under `api/applicationrecords/{applicationRecordId:int}/interviews`; ownership validated by checking the parent `ApplicationRecord` belongs to the current user.

`RefreshToken` is a standalone entity (not extending `BaseEntity`) for auth infrastructure — stores SHA-256 token hash, user ID, security stamp, expiration, revocation flag, and `CreatedAt` (defaulted to `DateTime.UtcNow` via property initializer; never set explicitly in object initializers).

## Code Style

### C# (Enforced by .editorconfig)

- **Use explicit types** - no `var` keyword
- **K&R brace style** - opening braces on same line
- **File-scoped namespaces** - `namespace Foo;` not `namespace Foo { }`
- **Private fields**: `_camelCase` with underscore prefix
- **No `ConfigureAwait(false)`** - not needed in ASP.NET Core or MAUI — don't add it
- **XML doc comments** (`/// <summary>`) on classes, methods, and properties
- **Primary constructors** for DI injection (C# 12+ syntax)
- **Target-typed `new()`** when type is clear from context (C# 9+)
- **Collection expressions** `[]` for collection initialization (C# 12+)
- **Null checks**: use `is null` / `is not null` — never `== null` / `!= null`
- **Empty strings**: use `string.Empty` — never `""`
- **Route constraints** `{id:int}` on API endpoints with route parameters
- **`/// <inheritdoc />`** on interface implementation methods instead of repeating docs

### TypeScript (Shared)

- **Strict mode** — no `any`; use `unknown` when type is uncertain
- **Type inference** — prefer inferred types when the type is obvious from context
- **`interface` over `type`** — for object shapes; `type` for unions and aliases
- **Named exports** — preferred over default exports
- **K&R brace style** — opening braces on same line
- **2-space indentation** — for TS, TSX, SCSS, CSS, JSON
- **Single quotes** for strings, **backticks** for interpolation
- **Semicolons** required
- **Naming** — `camelCase` for variables and functions; `PascalCase` for components, interfaces, and type aliases
- **JSDoc comments** on exported functions when intent isn't obvious
- **Accessibility** — WCAG AA minimums: focus management, color contrast, ARIA attributes

## Testing

### Backend (.NET)

- **Framework**: xUnit — **Mocking**: Moq — **Pattern**: AAA — test projects in `tests/`

| Layer | Tests For | Approach |
|-------|-----------|----------|
| Controllers | HTTP status codes, response shapes | Mock service layer; `DefaultHttpContext` + `ClaimsPrincipal` for auth |
| Services | Orchestration logic, correct repository calls | Mock repository layer; verify calls via `Verify()` |
| Repositories | Duplicate detection, query filters | EF Core InMemory — integration tests, no mocks |

```bash
dotnet test tests/ApplicationTracker.Api.Tests
```

- **Soft-delete, timestamps, validation (400s)** are framework concerns — need real integration tests (not yet implemented)
- **Failure cases**: controller tests must cover service returning `null` → `NotFoundResult`, invalid input → `BadRequestResult`, and unauthorized access — not just the happy path

### Frontend (Shared)

- **Test Runner**: Vitest — used by both Angular and React clients. For Angular, always run via `ng test --watch=false` (not `npx vitest run` directly — the Angular builder must load `@angular/compiler` and configure globals first)
- **Pattern**: AAA (Arrange, Act, Assert)
- **Test both paths** — every feature test should cover the success path and at least one failure path (API error, validation rejection, empty/null response); a suite that only covers the happy path is incomplete
- **E2E**: Playwright — future, not yet implemented

## Memory Protocol

- **Session start — read everything**: When the user opens a session or says "let's continue", read ALL individual files listed in the memory index (not just `MEMORY.md`) before responding. Then verify any state-sensitive claims (active branch, in-progress work, MCP/tool status) against current reality (`git log`, `git status`, `git branch`) — never trust a memory claim about branch or task state without checking. Then check GitHub Issues via `mcp__github__list_issues` (use `ToolSearch` to load the schema first — do NOT use `gh` CLI, it is not authenticated) to get the current task state before summarizing where things stand.
- **Update immediately**: When anything changes during a session (branch merged, feature started, tool updated, decision made), update the relevant memory file and `MEMORY.md` index right then — don't defer to end of session.
- **Stale = wrong**: If memory says X is in-progress but git shows it merged, update the memory before acting on it. A stale memory is worse than no memory.
- **MEMORY.md index entries must stay current**: Each line in the index should reflect the current state, not historical state. When updating a memory file, also update its index line if the one-liner no longer matches.

## Response Guidelines

- **Source transparency**: end every response with a brief "Sources" section — note whether information came from training data, a web search, or documentation; include links to references when available; prioritize Microsoft Learn and MDN over third-party articles when linking
- **Judgment-based edits** — apply changes directly for routine, clear-scope, single-file work; propose first (objective, files, steps, risks) for multi-file, architectural, or non-obvious changes
- **Security checkpoint**: when touching auth code, token handling, or data access boundaries, flag it and offer to run `/security-review`
- **"Why" questions mean explain reasoning** — when the user asks why a question was asked or why something was implemented a certain way, they are asking for the thinking process behind the decision, not expressing disagreement — respond with the reasoning, not with "you're right, I was wrong"
- **Use latest information for packages and setup** — when working with package versions, project configuration, or cloud service portal instructions (Azure, GitHub Actions, etc.), look up the current official documentation rather than relying on training data; APIs, portal UIs, and default configs change frequently
- **Guided coding**: when the user proposes a guided coding session, switch to step-by-step pair programming — explain each step and let the user write the code; only show code snippets to unblock, never generate full files unprompted
