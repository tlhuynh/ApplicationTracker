# Application Tracker

A cross-platform job application tracker built with .NET MAUI Blazor and MudBlazor, with a backend API for data synchronization.

## Technologies

- **.NET 10 Preview**
- **.NET MAUI** - Cross-platform UI framework
- **Blazor Hybrid** - Web UI components within MAUI
- **ASP.NET Core Web API** - Backend REST API
- **MudBlazor** - Material Design component library
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
├── tests/                                  # Test projects
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
| **API** | `ApplicationTracker.Api` | REST endpoints, authentication |
| **Shared** | `ApplicationTracker.Shared` | DTOs shared between API and clients |

### Project References

```
Api → Core, Infrastructure, Shared
Infrastructure → Core
Maui → Shared
```

## MudBlazor Components

This project uses [MudBlazor](https://mudblazor.com/) for Material Design UI components.
See [MudBlazor Documentation](https://mudblazor.com/components) for available components.

## Resources

- [.NET MAUI Documentation](https://learn.microsoft.com/dotnet/maui/)
- [Blazor Hybrid Documentation](https://learn.microsoft.com/aspnet/core/blazor/hybrid/)
- [ASP.NET Core Web API](https://learn.microsoft.com/aspnet/core/web-api/)
- [MudBlazor Documentation](https://mudblazor.com/)
- [.NET 10 Preview](https://dotnet.microsoft.com/download/dotnet/10.0)
