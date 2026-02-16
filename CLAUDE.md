# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ApplicationTracker is a full-stack .NET project for tracking job applications, built as a learning playground to explore modern technologies. The core focus is ASP.NET Core Web API with web frontends (React, Angular planned), alongside a .NET MAUI Blazor Hybrid app for mobile and desktop.

**Tech Stack:** .NET 10, C# 13, ASP.NET Core Web API, EF Core, SQL Server, .NET MAUI, Blazor Hybrid, MudBlazor, SQLite, Scalar, ClosedXML, React, Vite, Vitest

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

## Backend Setup

- SQL Server 2022 runs via Docker (`docker-compose.yml` at project root)
- SA password stored in `.env` (gitignored); `.env.example` checked in as template
- Real connection string stored via `dotnet user-secrets` (not in appsettings)
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
│   └── ApplicationTracker.React/         # React SPA (Vite + TypeScript)
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
- **Excel Import**: ClosedXML for parsing `.xlsx` uploads; service returns domain models, controller maps to DTOs. Validation: CompanyName required, Status must match enum name (numeric values rejected), AppliedDate required (culture-invariant parsing via `CultureInfo.InvariantCulture`), PostingUrl must be valid HTTP/HTTPS if provided. Duplicate detection: CompanyName + PostingUrl (when URL provided), fallback to CompanyName + AppliedDate (database check only, not within same batch)
- **Domain Models**: Non-entity result types live in `Core/Models/` (e.g., `ExcelImportResult`)
- **Partial Updates**: `PATCH /api/applicationrecords/{id}/status` updates only the status field — uses `PatchStatusRequest` DTO and `UpdateStatusAsync` service method

### MAUI App Structure

Located in `src/clients/ApplicationTracker.Maui/`:

- `Components/` - Blazor components (Pages, Layout, Dialogs, DataGrids)
- `Models/` - Data entities inheriting from `BaseEntity`
- `Services/` - Business logic and data access (`DatabaseService`)
- `Utilities/` - Constants and enums
- `Platforms/` - Platform-specific code (Android, iOS, macOS, Windows)

### React App Structure

Located in `src/clients/ApplicationTracker.React/`:

- `src/api/` - API client functions (hand-written fetch wrappers)
- `src/components/` - App components (`AppSidebar.tsx`, `ThemeProvider.tsx`, `ThemeToggle.tsx`)
- `src/components/applications/` - Application feature components (`ApplicationTable`, `ApplicationFormDialog`, `applicationColumns`, `NotesCell`)
- `src/components/ui/` - shadcn/ui generated components (ESLint-ignored)
- `src/hooks/` - Custom hooks (`use-mobile.ts`, `use-theme.ts`)
- `src/lib/` - Utilities (`utils.ts` with `cn()` helper) and constants (`constants.ts`)
- `src/pages/` - Route page components (`HomePage`, `ImportPage`, `NotFoundPage`)
- `src/types/` - Generated TypeScript types from OpenAPI spec (`api.d.ts`)
- `src/test/` - Test setup (`setup.ts` with JSDOM mocks)
- `vite.config.ts` - Vite + Vitest + API proxy configuration
- `eslint.config.js` - ESLint with TypeScript and React rules
- `.prettierrc` - Prettier formatting config (singleQuote, printWidth 100, 2-space indent)
- `components.json` - shadcn/ui configuration

### Entity Design

`BaseEntity` provides common fields: `Id`, `CreatedAt`, `LastModified`, `UserId`, `ServerId`, `NeedsSync`, `IsDeleted` - designed for future server sync capability.

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
- **Controller tests** mock the service layer — verify HTTP status codes and response shapes
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
- **Generate changes with explanations** — present file changes for the user to review and apply, rather than applying directly, unless the user explicitly asks otherwise
- For file edits: ask "Should I make this change, or would you like to handle it?"
- **React concepts**: see `docs/react-concepts.md` for topics already covered — don't re-explain these from scratch
- **Project context**: see `docs/windows-memory.md` for implementation progress, setup details, and troubleshooting notes
