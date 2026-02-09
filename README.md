# Application Tracker

A cross-platform job application tracker built with .NET MAUI Blazor and MudBlazor, with a backend API for data synchronization.

## Technologies

- **.NET 10 Preview**
- **.NET MAUI** - Cross-platform UI framework
- **Blazor Hybrid** - Web UI components within MAUI
- **ASP.NET Core Web API** - Backend REST API
- **MudBlazor** - Material Design component library
- **[ClosedXML](https://github.com/ClosedXML/ClosedXML)** - Excel file parsing for bulk imports
- **[xUnit](https://xunit.net/)** - Unit testing framework
- **[Moq](https://github.com/devlooped/moq)** - Mocking library for tests
- **C# 13** - Latest C# features

## Platforms

- Android
- iOS
- macOS (Catalyst)
- Windows
- Web (planned)

## Prerequisites

### Windows
- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- [Visual Studio 2022 (17.12+)](https://visualstudio.microsoft.com/) with:
  - .NET MAUI workload
  - Android SDK
  - Windows SDK

### macOS
- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- [Visual Studio 2022 for Mac](https://visualstudio.microsoft.com/vs/mac/) or [VS Code](https://code.visualstudio.com/)
- [Xcode 15+](https://developer.apple.com/xcode/) (for iOS/macOS development)
- Command Line Tools: `xcode-select --install`

## Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/tlhuynh/ApplicationTracker.git
cd ApplicationTracker
```

### 2. Install Workloads
```bash
dotnet workload restore
```

### 3. Restore Dependencies
```bash
dotnet restore
```

### 4. Run the Application

**Visual Studio (Windows/Mac):**
- Open `ApplicationTracker.sln`
- Select target platform (Android/iOS/Windows/macOS)
- Press `F5` or click Run

**Command Line:**
```bash
# Build MAUI app for specific platform
dotnet build src/clients/ApplicationTracker.Maui -f net10.0-android
dotnet build src/clients/ApplicationTracker.Maui -f net10.0-ios
dotnet build src/clients/ApplicationTracker.Maui -f net10.0-maccatalyst
dotnet build src/clients/ApplicationTracker.Maui -f net10.0-windows10.0.19041.0

# Run the API
dotnet run --project src/backend/ApplicationTracker.Api
```

## Project Structure

```
ApplicationTracker/
├── src/
│   ├── backend/                            # Backend services
│   │   ├── ApplicationTracker.Api/         # ASP.NET Core Web API
│   │   ├── ApplicationTracker.Core/        # Domain entities, interfaces
│   │   └── ApplicationTracker.Infrastructure/ # Data access, external services
│   ├── clients/
│   │   └── ApplicationTracker.Maui/        # .NET MAUI Blazor app
│   │       ├── Components/                 # Blazor components
│   │       │   ├── Layout/                 # Layout components
│   │       │   ├── Pages/                  # Page components
│   │       │   ├── Dialogs/                # Dialog components
│   │       │   └── DataGrids/              # Data grid components
│   │       ├── Models/                     # Data models
│   │       ├── Services/                   # App services
│   │       ├── Platforms/                  # Platform-specific code
│   │       ├── Resources/                  # App resources
│   │       └── wwwroot/                    # Static web assets
│   └── shared/
│       └── ApplicationTracker.Shared/      # Shared DTOs and models
├── tests/
│   └── ApplicationTracker.Api.Tests/      # Unit tests (xUnit + Moq)
│       ├── Controllers/                   # Controller tests
│       └── Services/                      # Service tests
├── templates/                               # Static files (import templates)
│   └── ApplicationRecords_Import_Template.xlsx
├── ApplicationTracker.sln
├── Directory.Build.props
├── global.json
└── .editorconfig
```

## Architecture

The solution follows Clean Architecture principles:

| Layer | Project | Responsibility |
|-------|---------|----------------|
| **Core** | `ApplicationTracker.Core` | Domain entities, interfaces (no dependencies) |
| **Infrastructure** | `ApplicationTracker.Infrastructure` | Data access, external services |
| **API** | `ApplicationTracker.Api` | REST endpoints, services, Excel import |
| **Shared** | `ApplicationTracker.Shared` | DTOs shared between API and clients |

### Project References

```
Api → Core, Infrastructure, Shared
Infrastructure → Core
Maui → Shared
```

## Testing

The project uses [xUnit](https://xunit.net/) with [Moq](https://github.com/devlooped/moq) for unit testing.

| Test Project | Tests For | Approach |
|---|---|---|
| `ApplicationTracker.Api.Tests` | Controllers, Services | Mock dependencies with Moq |

```bash
# Run all tests
dotnet test

# Run a specific test project
dotnet test tests/ApplicationTracker.Api.Tests
```

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/applicationrecords` | List all records |
| GET | `/api/applicationrecords/{id}` | Get record by ID |
| POST | `/api/applicationrecords` | Create a record |
| PUT | `/api/applicationrecords/{id}` | Update a record |
| DELETE | `/api/applicationrecords/{id}` | Soft-delete a record |
| POST | `/api/applicationrecords/import` | Bulk import from `.xlsx` file |

### Excel Import

Upload a `.xlsx` file to `POST /api/applicationrecords/import`. A template is available at `templates/ApplicationRecords_Import_Template.xlsx`.

Expected columns:

| CompanyName (required) | Status (required) | AppliedDate (optional) | PostingUrl (optional) | Notes (optional) |
|---|---|---|---|---|

Status values: `Applied`, `Interviewing`, `Offered`, `Rejected`, `Withdrawn`

Invalid rows are skipped — the response includes a report of imported/failed counts and per-row errors.

## MudBlazor Components

This project uses [MudBlazor](https://mudblazor.com/) for Material Design UI components.
See [MudBlazor Documentation](https://mudblazor.com/components) for available components.

## Resources

- [.NET MAUI Documentation](https://learn.microsoft.com/dotnet/maui/)
- [Blazor Hybrid Documentation](https://learn.microsoft.com/aspnet/core/blazor/hybrid/)
- [ASP.NET Core Web API](https://learn.microsoft.com/aspnet/core/web-api/)
- [MudBlazor Documentation](https://mudblazor.com/)
- [.NET 10 Preview](https://dotnet.microsoft.com/download/dotnet/10.0)
