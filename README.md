# Application Tracker

A full-stack .NET project for tracking job applications, built as a learning playground to explore modern technologies.

## Technologies

### Frameworks & Language
- [.NET 10](https://dotnet.microsoft.com/download/dotnet/10.0) / **C# 13**
- [ASP.NET Core Web API](https://learn.microsoft.com/aspnet/core/web-api/) - Backend REST API
- [.NET MAUI](https://learn.microsoft.com/dotnet/maui/) - Cross-platform native UI
- [Blazor Hybrid](https://learn.microsoft.com/aspnet/core/blazor/hybrid/) - Web UI components within MAUI
- [React 19](https://react.dev/) - Web frontend SPA
- [Vite](https://vite.dev/) - Frontend build tool and dev server
- [TanStack Table](https://tanstack.com/table/latest) - Headless table library for React

### Component Libraries
- [MudBlazor](https://mudblazor.com/) - Material Design component library (MAUI)
- [shadcn/ui](https://ui.shadcn.com/) - Accessible UI components built on Radix UI (React)
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework (React)
- [Lucide React](https://lucide.dev/) - Icon library (used by shadcn/ui)
- [Sonner](https://sonner.emilkowal.dev/) - Toast notifications (React)

### Frontend Tooling
- [Prettier](https://prettier.io/) - Code formatting
- [ESLint](https://eslint.org/) - Linting for TypeScript/React
- [openapi-typescript](https://openapi-ts.dev/) - TypeScript type generation from OpenAPI spec

### Authentication
- [ASP.NET Core Identity](https://learn.microsoft.com/aspnet/core/security/authentication/identity) - User management (registration, password hashing)
- [JWT Bearer Authentication](https://learn.microsoft.com/aspnet/core/security/authentication/jwt-authn) - Token-based API authentication

### Data & Infrastructure
- [Entity Framework Core](https://learn.microsoft.com/ef/core/) - ORM for backend data access
- [SQL Server 2022](https://learn.microsoft.com/sql/sql-server/) - Backend database (Docker)
- [SQLite](https://www.sqlite.org/) - Local MAUI app storage
- [ClosedXML](https://github.com/ClosedXML/ClosedXML) - Excel file parsing for bulk imports

### API Documentation
- [Scalar](https://github.com/scalar/scalar) - Interactive API reference UI

### Testing
- [xUnit](https://xunit.net/) - Unit testing framework
- [Moq](https://github.com/devlooped/moq) - Mocking library
- [Vitest](https://vitest.dev/) - Frontend test runner
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) - Component testing
- [MSW](https://mswjs.io/) - API mocking (Mock Service Worker)

## Platforms
- Web (React)
- Mobile/Desktop
	- Windows
	- macOS (Catalyst)
	- iOS	
  - Android

## Prerequisites

### Windows
- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- [Node.js 22+](https://nodejs.org/) (for React client)
- [Visual Studio 2022 (17.12+)](https://visualstudio.microsoft.com/) or [JetBrains Rider](https://www.jetbrains.com/rider/) with:
  - .NET MAUI workload
  - Android SDK
  - Windows SDK

### macOS
- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- [Node.js 22+](https://nodejs.org/) (for React client)
- [JetBrains Rider](https://www.jetbrains.com/rider/) or [VS Code](https://code.visualstudio.com/)
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

### 4. Install React Dependencies
```bash
cd src/clients/ApplicationTracker.React
npm install
```

### 5. Run the Application

**Visual Studio / Rider:**
- Open `ApplicationTracker.sln`
- Select run configuration (MAUI app, API, or Web)
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

# Run the React client
cd src/clients/ApplicationTracker.React && npm run dev
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
│   │   ├── ApplicationTracker.React/        # React SPA (Vite + TypeScript)
│   │   │   └── src/
│   │   │       ├── api/                     # API client (fetch functions)
│   │   │       ├── components/              # App components + shadcn/ui
│   │   │       │   ├── applications/        # Application feature components
│   │   │       │   └── ui/                  # shadcn/ui generated components
│   │   │       ├── hooks/                   # Custom React hooks (use-theme, use-mobile)
│   │   │       ├── lib/                     # Utilities and constants
│   │   │       ├── pages/                   # Route page components (Home, Import, NotFound)
│   │   │       ├── test/                    # Test setup
│   │   │       └── types/                   # Generated API types
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
Shared → Core
Maui → Shared (gets Core transitively)
```

## Testing

### Backend

The backend uses [xUnit](https://xunit.net/) with [Moq](https://github.com/devlooped/moq) for unit testing.

| Test Project | Tests For | Approach |
|---|---|---|
| `ApplicationTracker.Api.Tests` | Controllers, Services | Mock dependencies with Moq |

```bash
# Run all .NET tests
dotnet test

# Run a specific test project
dotnet test tests/ApplicationTracker.Api.Tests
```

### Frontend (React)

Tests are colocated with source files in `src/clients/ApplicationTracker.React/src/`.

```bash
# Run React tests (from src/clients/ApplicationTracker.React/)
npm test

# Watch mode
npm run test:watch
```

## API Documentation

When running in Development, the interactive Scalar API reference is available at `/scalar/v1`.

```bash
dotnet run --project src/backend/ApplicationTracker.Api
# Then open https://localhost:{port}/scalar/v1
```


## Features (React Client)

- **Dashboard** — view all application records in a sortable, filterable, paginated table
- **CRUD** — create, edit, and delete applications via form dialogs
- **Quick status updates** — advance or reject applications with one click (PATCH endpoint)
- **Form validation** — client-side validation with red borders and error text
- **Excel import** — upload `.xlsx` files to bulk import records, with row-level validation (required fields, enum matching, date parsing, URL format), duplicate detection (by company + URL or company + date), and error reporting
- **Toast notifications** — success/error feedback via Sonner
- **Dark/light theme** — toggle with system preference detection, persisted in localStorage
- **Responsive sidebar** — collapsible navigation with Dashboard and Import pages
- **Authentication (backend)** — register, login, and token refresh endpoints via ASP.NET Core Identity + JWT (frontend login page coming soon)

## Resources

- [.NET 10](https://dotnet.microsoft.com/download/dotnet/10.0)
- [ASP.NET Core Web API](https://learn.microsoft.com/aspnet/core/web-api/)
- [Entity Framework Core](https://learn.microsoft.com/ef/core/)
- [.NET MAUI](https://learn.microsoft.com/dotnet/maui/)
- [Blazor Hybrid](https://learn.microsoft.com/aspnet/core/blazor/hybrid/)
- [MudBlazor](https://mudblazor.com/docs)
- [ASP.NET Core Identity](https://learn.microsoft.com/aspnet/core/security/authentication/identity)
- [JWT Bearer Authentication](https://learn.microsoft.com/aspnet/core/security/authentication/jwt-authn)
- [Scalar](https://github.com/scalar/scalar/tree/main/integrations/aspnetcore)
- [ClosedXML](https://github.com/ClosedXML/ClosedXML/wiki)
- [xUnit](https://xunit.net/docs/getting-started/v3/cmdline)
- [Moq](https://github.com/devlooped/moq/wiki/Quickstart)
- [React](https://react.dev/learn)
- [Vite](https://vite.dev/guide/)
- [Vitest](https://vitest.dev/guide/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [MSW](https://mswjs.io/docs/)
- [shadcn/ui](https://ui.shadcn.com/docs)
- [TanStack Table](https://tanstack.com/table/latest/docs/introduction)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev/icons/)
- [Sonner](https://sonner.emilkowal.dev/)
- [openapi-typescript](https://openapi-ts.dev/)
- [Prettier](https://prettier.io/docs/)
