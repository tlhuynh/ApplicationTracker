# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ApplicationTracker is a cross-platform .NET MAUI Blazor Hybrid application for tracking job applications. It uses MudBlazor for Material Design UI components and SQLite for local data persistence.

**Tech Stack:** .NET 10 Preview, MAUI, Blazor Hybrid, MudBlazor, SQLite, C# 13

**Target Platforms:** Android, iOS, macOS (Catalyst), Windows

## Build Commands

```bash
# Install workloads (required first time)
dotnet workload restore

# Restore dependencies
dotnet restore

# Build for specific platforms
dotnet build -f net10.0-android
dotnet build -f net10.0-ios
dotnet build -f net10.0-maccatalyst
dotnet build -f net10.0-windows10.0.19041.0
```

## Architecture

### Key Patterns

- **Dependency Injection**: Services registered in `MauiProgram.cs` as singletons (e.g., `DatabaseService`)
- **MVVM with Blazor**: Components use code-behind pattern (`.razor` + `.razor.cs`)
- **Async Data Access**: All database operations are async via `SQLiteAsyncConnection`
- **Lazy Initialization**: Database connection initialized on first use via `Init()` pattern

### Directory Structure

- `Components/` - Blazor components (Pages, Layout, Dialogs)
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
- No test project currently exists in the solution
