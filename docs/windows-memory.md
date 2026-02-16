# Project Memory (Windows)

This is a snapshot of the Claude Code memory from the Windows development machine. It captures project state, setup details, and troubleshooting notes. If working on a different machine, use this as context for the current state of the project.

## User Preferences
- **Platform**: Windows, uses Docker Desktop
- **Command formatting**: Plain single-line commands, no PowerShell backtick continuation
- **Second device**: Mac (used for development as well)
- **Workflow**: Prefers to review and apply changes themselves — present step-by-step instructions with explanations
- **Responses**: Include links to official documentation when discussing tools/frameworks/concepts

## Docker & LAN Access
- Docker Desktop runs on Windows with WSL2 backend
- LAN IP of dev PC: `192.168.4.28`
- Mac device IP: `192.168.4.54`
- Windows Firewall rule "SQL Server Docker - LAN Access" allows Mac IP on port 1433
- **Port proxy required** for external LAN access (WSL2 Docker limitation):
  `netsh interface portproxy add v4tov4 listenport=1433 listenaddress=0.0.0.0 connectport=1433 connectaddress=127.0.0.1`
- Port proxy must be re-added after reboot (not persistent by default)
- Mac connects to SQL Server via: `Server=192.168.4.28,1433;User Id=sa;...`

## Troubleshooting Notes
- Connection string uses `User Id` (with space), not `UserId` — SqlClient throws "Keyword not supported: 'userid'" otherwise
- When testing SQL passwords in zsh (Mac), use single quotes to avoid `!` history expansion
- VS Code mssql extension on Mac can confuse local and remote SQL containers — use `sqlcmd` CLI to verify connectivity

## Excel Import Validation
- CompanyName: required
- Status: required, must match `ApplicationStatus` enum name (case-insensitive), numeric values rejected via `int.TryParse` guard
- AppliedDate: required, parsed with `CultureInfo.InvariantCulture` + `DateTime.SpecifyKind(UTC)`
- PostingUrl: optional, validated with `Uri.TryCreate(Absolute)` + HTTP/HTTPS scheme check
- Notes: optional, no validation
- Duplicate detection: CompanyName + PostingUrl when URL provided, CompanyName + AppliedDate fallback (DB check only, not within same import batch)
- `IApplicationRecordRepository.ExistsAsync(companyName, appliedDate, postingUrl)` — checks DB for duplicates, strategy based on whether postingUrl is null
- Base `Repository<T>._dbSet` is `protected` (changed from `private`) so derived repos can query directly
- `Enum.TryParse` accepts numeric strings by default — always guard with `int.TryParse` when validating enum names
- ClosedXML auto-converts date-like strings to Excel serial numbers — use `DataType = XLDataType.Text` in test helpers to prevent this

## Testing Notes
- Soft-delete logic lives in `ApplicationDbContext.SaveChangesAsync` (Infrastructure), not the service layer — can't be tested with mocked repositories, needs EF Core integration tests
- ASP.NET Core `[ApiController]` handles model validation (400 responses) before controller actions run — requires `WebApplicationFactory` integration tests to verify
- Backend services plan (`sharded-discovering-key.md`) is fully complete (Steps 1-8)

## Implementation Progress
- Backend API: Controllers, services, repositories, EF Core — done
- Excel import: ClosedXML service + endpoint (`POST /api/applicationrecords/import`) — done
- Unit tests: `ApplicationTracker.Api.Tests` (xUnit + Moq, 32 tests) — done
- PATCH status endpoint: `PATCH /api/applicationrecords/{id}/status` — `PatchStatusRequest` DTO, `UpdateStatusAsync` service method, frontend `patchStatus()` API function
- Authentication (backend only — Part 1 done, Part 2 frontend pending):
  - ASP.NET Core Identity + JWT Bearer tokens
  - `AuthController`: register (`POST /api/auth/register`), login (`POST /api/auth/login`), refresh (`POST /api/auth/refresh`)
  - `TokenService` / `ITokenService`: generates JWT access tokens (HS256, 15 min expiry) and cryptographic refresh tokens (7 days, stored in `RefreshTokens` table)
  - `ApplicationDbContext` extends `IdentityDbContext<IdentityUser>` (changed from `DbContext`)
  - `RefreshToken` entity (standalone, not extending `BaseEntity`) — token rotation on each refresh
  - JWT key stored in user-secrets (`Jwt:Key`); Issuer/Audience/ExpiryInMinutes in `appsettings.json`
  - NuGet: `Microsoft.AspNetCore.Identity.EntityFrameworkCore` (Infrastructure), `Microsoft.AspNetCore.Authentication.JwtBearer` (Api), `Microsoft.Extensions.Identity.Stores` (Core)
  - DTOs: `RegisterRequest`, `LoginRequest`, `AuthResponse`
  - `[Authorize]` not yet applied to endpoints — pending Part 3
- Static import template at `templates/ApplicationRecords_Import_Template.xlsx`
- Scalar API docs at `/scalar/v1` (Development environment only)
- CORS configured in `Program.cs` for `http://localhost:5173` (Vite dev server)
- React client — all features below are done:
  - Boilerplate cleanup, React Router, API proxy, app shell
  - Applications data table with sorting, global filtering, pagination (TanStack Table + shadcn Table)
  - CRUD: Create/Edit form dialog (`ApplicationFormDialog`), delete with AlertDialog confirmation
  - Form validation: custom `validate()` function, red borders + error text on invalid fields
  - Error handling: Sonner toasts for API errors, form submission errors
  - Notes column: icon button opens dialog with full notes (`NotesCell` component)
  - Job URL column: `ExternalLink` icon with `aria-label` for accessibility
  - Excel import page (`/import`): file upload, results summary, error table
  - Dark/light theme toggle (`ThemeProvider` + `ThemeToggle`)
  - Sidebar: Dashboard + Import nav items, collapsed by default
- Tests: ApplicationTable (5 tests), HomePage (3 tests) — done

## React Client Setup
- Location: `src/clients/ApplicationTracker.React/`
- Node.js installed at `C:\Program Files (x86)\nodejs` (non-default path, added to PATH manually)
- Stack: Vite + React 19 + TypeScript (strict mode)
- Testing: Vitest + React Testing Library + MSW — installed and configured
- Formatting: `.prettierrc` (singleQuote, printWidth 100, 2-space indent, no tabs)
- Linting: ESLint with typescript-eslint, react-hooks, react-refresh, eslint-config-prettier
- `src/components/ui/` is ESLint-ignored (shadcn-generated code)
- `.editorconfig` has `[*.{ts,tsx}]` override for 2-space indent
- Code style: function declarations for components, arrow functions for handlers, named exports
- Tests colocated with source files (not in root `tests/`)
- Styling: Tailwind CSS v4 + shadcn/ui (new-york style, neutral base color, lucide icons)
- UI components installed: Button, Sidebar, Separator, Sheet, Tooltip, Table, Input, Skeleton, Dialog, Label, Select, Textarea, Sonner, AlertDialog, Card
- Data table: TanStack Table (`@tanstack/react-table`) with sorting, global filtering, pagination
- Feature components in `src/components/applications/` (ApplicationTable, ApplicationFormDialog, applicationColumns, NotesCell)
- API types: auto-generated via `openapi-typescript` (`npm run generate-types`, backend must be running on http://localhost:5021)
- API client: hand-written fetch functions in `src/api/applicationRecords.ts`
- API proxy: Vite proxies `/api` to `http://localhost:5021`
- App shell: header (with theme toggle) + collapsible sidebar (shadcn Sidebar), nav items: Dashboard, Import
- Theme: ThemeProvider + ThemeToggle (dark/light/system, persisted in localStorage)
- Test setup: `src/test/setup.ts` includes `window.matchMedia` mock for JSDOM
- Routes: `/` (HomePage), `/import` (ImportPage), `*` (NotFoundPage)

## Troubleshooting Notes (React)
- TypeScript 5.9 `erasableSyntaxOnly` — cannot use `public` in constructor parameters (use explicit property + assignment)
- JSDOM lacks `window.matchMedia` — mock in test setup.ts (required by shadcn sidebar's `useIsMobile` hook)
- Backend default launch profile is `http` (port 5021 only) — use `--launch-profile https` for port 7031
- TanStack Table `useReactTable` triggers React Compiler `incompatible-library` warning — suppress with eslint-disable comment; known issue (https://github.com/TanStack/table/issues/5567)
- React Compiler `set-state-in-effect`: don't call functions that synchronously setState inside useEffect — use inline `.then()/.catch()` callbacks, or call setState functions only from event handlers
- ESLint `react-refresh/only-export-components`: files must export ONLY components OR only non-components. Move contexts/hooks to separate files (e.g., `ThemeProviderContext` → `use-theme.ts`)
- Icon-only interactive elements need `aria-label` for accessibility and testability

## User Context
- New to React — see `docs/react-concepts.md` for topics already covered (don't re-explain these)
- Familiar with .NET/Blazor — React concepts explained via Blazor comparisons
- Prefers to review and apply changes themselves — present changes with explanations
- Conversation style: Q&A-driven. Explain *why* code is written a certain way, not just *what* to write. User asks follow-up questions before applying changes.
- Current branch: `Add-UI-components` — all React UI work is on this branch

## IDE Setup
- Rider settings sync via JetBrains account (plugins, keymaps, etc.)
- Rider Prettier: configure under Settings → Languages & Frameworks → JavaScript → Prettier (run on save)

## Mac Development Notes
- Node.js path on Mac may differ from Windows — check with `which node` if needed
- Mac connects to Windows Docker SQL Server via LAN IP (see Docker & LAN Access section)
- zsh is default shell on Mac — single-quote passwords with `!` to avoid history expansion
