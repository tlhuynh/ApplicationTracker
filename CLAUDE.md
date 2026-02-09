# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ApplicationTracker is a cross-platform .NET MAUI Blazor Hybrid application for tracking job applications. It uses MudBlazor for Material Design UI components and SQLite for local data persistence. The project includes a backend API for future data synchronization.

**Tech Stack:** .NET 10 Preview, MAUI, Blazor Hybrid, ASP.NET Core Web API, MudBlazor, SQLite, C# 13

**Target Platforms:** Android, iOS, macOS (Catalyst), Windows

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

# Build and run the API
dotnet run --project src/backend/ApplicationTracker.Api
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
│   └── ApplicationTracker.Maui/          # .NET MAUI Blazor app
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
- **Excel Import**: ClosedXML for parsing `.xlsx` uploads; service returns domain models, controller maps to DTOs
- **Domain Models**: Non-entity result types live in `Core/Models/` (e.g., `ExcelImportResult`)

### MAUI App Structure

Located in `src/clients/ApplicationTracker.Maui/`:

- `Components/` - Blazor components (Pages, Layout, Dialogs, DataGrids)
- `Models/` - Data entities inheriting from `BaseEntity`
- `Services/` - Business logic and data access (`DatabaseService`)
- `Utilities/` - Constants and enums
- `Platforms/` - Platform-specific code (Android, iOS, macOS, Windows)

### Entity Design

`BaseEntity` provides common fields: `Id`, `CreatedAt`, `LastModified`, `UserId`, `ServerId`, `NeedsSync`, `IsDeleted` - designed for future server sync capability.

## Code Style (Enforced by .editorconfig)

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

## Testing

- **Framework**: xUnit (preferred)
- **Mocking**: Moq
- **Pattern**: AAA (Arrange, Act, Assert)
- **Scope**: Unit tests for service and controller layers
- Test projects go in the `tests/` directory

### Test Projects

| Project | Tests For | Mocks |
|---------|-----------|-------|
| `ApplicationTracker.Api.Tests` | Controllers, Services | `IApplicationRecordRepository`, `IApplicationRecordService`, `IExcelImportService` |

### Test Commands

```bash
# Run all tests
dotnet test

# Run specific test project
dotnet test tests/ApplicationTracker.Api.Tests
```

### Test Boundaries

- **Service tests** mock the repository layer — verify orchestration logic and correct repository calls via `Verify()`
- **Controller tests** mock the service layer — verify HTTP status codes and response shapes
- **Soft-delete, timestamps, validation (400s)** are infrastructure/framework concerns — need integration tests (not yet implemented)

## Response Guidelines

- When discussing tools, frameworks, or concepts, include links to official documentation when available
- Prioritize Microsoft Learn, MDN, and other primary sources over third-party articles
- **Generate changes with explanations** — present file changes for the user to review and apply, rather than applying directly, unless the user explicitly asks otherwise
- For file edits: ask "Should I make this change, or would you like to handle it?"
