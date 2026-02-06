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
- **Pattern**: AAA (Arrange, Act, Assert)
- Test projects go in the `tests/` directory

## Response Guidelines

- When discussing tools, frameworks, or concepts, include links to official documentation when available
- Prioritize Microsoft Learn, MDN, and other primary sources over third-party articles
- **Generate changes with explanations** — present file changes for the user to review and apply, rather than applying directly, unless the user explicitly asks otherwise
