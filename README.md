# Job Application Tracker

A full-stack .NET project for tracking job applications, built as a learning playground to explore modern technologies.

## Features

- **Application tracking** — create, view, edit, and delete job applications with fields for company, status, applied date, posting URL, notes, and long-form description
- **Description field** — dedicated per-record description for storing full job posting details; editable inline in the add/edit dialog (pre-filled via lazy fetch in edit mode) and via the dedicated description dialog; excluded from list queries to keep responses lightweight
- **Status management** — advance or reject applications directly from the table; status follows a fixed progression (Applied → Interviewing → Offered → Rejected/Withdrawn)
- **Interview tracking** — log interviews per application with type (Screening, Technical, Onsite, Other), optional round number, date, optional outcome (Pending / Passed / Failed), and notes; accessible from the applications table and the detail dialog
- **Server-side pagination, sorting, and filtering** — search by keyword, filter by status chips or date range, multi-column compound sort with status priority
- **Excel import and export** — upload `.xlsx` files with per-row validation feedback; export includes description and interview summary columns; downloadable import template with column guide included
- **Full authentication flow** — registration with email confirmation, JWT access tokens (15 min) + refresh tokens (7 days) with rotation, forgot/reset password, per-user data isolation
- **Security hardening** — email enumeration prevention (consistent 200 responses for all registration cases), IP-based rate limiting (10 req / 15 min), per-email send cap (3 emails / hour), refresh token revocation on password reset
- **Light/dark theme toggle**
- **Responsive layout** — collapsible sidebar navigation; responsive table with adaptive column visibility across breakpoints (desktop, tablet, mobile); horizontal scroll on narrow desktop windows; collapsible filter bar with active filter count badge; search always visible in the filter toggle row

## Technologies

### Frameworks & Languages
- [.NET 10](https://dotnet.microsoft.com/download/dotnet/10.0) / **C# 13**
- [ASP.NET Core Web API](https://learn.microsoft.com/aspnet/core/web-api/) - Backend REST API
- [Angular 21](https://angular.dev/) - Web frontend SPA (active)
- [React 19](https://react.dev/) - Web frontend SPA (alternate)
- [Vite](https://vite.dev/) - Frontend build tool and dev server (React)
- [.NET MAUI](https://learn.microsoft.com/dotnet/maui/) - Cross-platform native UI (To Be Updated)
- [Blazor Hybrid](https://learn.microsoft.com/aspnet/core/blazor/hybrid/) - Web UI components within MAUI (To Be Updated)

### Component Libraries
- Angular
  - [Angular Material](https://material.angular.io/) - Material Design component library (Angular)
- React
  - [shadcn/ui](https://ui.shadcn.com/) - Accessible UI components built on Radix UI
  - [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
  - [Lucide React](https://lucide.dev/) - Icon library (used by shadcn/ui)
  - [Sonner](https://sonner.emilkowal.dev/) - Toast notifications
  - [TanStack Table](https://tanstack.com/table/latest) - Headless table library
- Cross-platform
  - [MudBlazor](https://mudblazor.com/) - Material Design component library (MAUI)

### Frontend Tooling
- [Prettier](https://prettier.io/) - Code formatting
- [ESLint](https://eslint.org/) - Linting for TypeScript/React
- [openapi-typescript](https://openapi-ts.dev/) - TypeScript type generation from OpenAPI spec

### Authentication & Security
- [ASP.NET Core Identity](https://learn.microsoft.com/aspnet/core/security/authentication/identity) - User management (registration, password hashing, email confirmation)
- [JWT Bearer Authentication](https://learn.microsoft.com/aspnet/core/security/authentication/jwt-authn) - Access tokens + opaque refresh tokens with rotation
- [ASP.NET Core Rate Limiting](https://learn.microsoft.com/aspnet/core/performance/rate-limit) - IP-based fixed-window rate limiting on auth endpoints

### Email
- [Resend](https://resend.com/) - Transactional email (confirmation, password reset, security notices) — console logging in development

### Data & Infrastructure
- [Entity Framework Core](https://learn.microsoft.com/ef/core/) - ORM for backend data access
- [SQL Server 2022](https://learn.microsoft.com/sql/sql-server/) - Backend database (Docker)
- [SQLite](https://www.sqlite.org/) - Local MAUI app storage
- [ClosedXML](https://github.com/ClosedXML/ClosedXML) - Excel file parsing and export

### API Documentation
- [Scalar](https://github.com/scalar/scalar) - Interactive API reference UI

### Testing
- [xUnit](https://xunit.net/) - Unit testing framework (.NET)
- [Moq](https://github.com/devlooped/moq) - Mocking library (.NET)
- [Vitest](https://vitest.dev/) - Frontend test runner (Angular + React)
- [Angular Testing Library](https://testing-library.com/docs/angular-testing-library/intro/) - Component testing (Angular)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) - Component testing (React)

## Platforms
- Web
- Mobile/Desktop
  - Windows
  - macOS (Catalyst)
  - iOS
  - Android

## Prerequisites

### Windows
- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- [Node.js 22+](https://nodejs.org/)
- [Visual Studio 2022 (17.12+)](https://visualstudio.microsoft.com/) or [JetBrains Rider](https://www.jetbrains.com/rider/) with:
  - .NET MAUI workload
  - Android SDK
  - Windows SDK

### macOS
- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- [Node.js 22+](https://nodejs.org/)
- [JetBrains Rider](https://www.jetbrains.com/rider/)
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

### 4. Install Client Dependencies
```bash
# Angular client
cd src/clients/ApplicationTracker.Angular
npm install

# React client
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
# Run the API
dotnet run --project src/backend/ApplicationTracker.Api

# Run the Angular client (http://localhost:4200, proxies API to :5021)
cd src/clients/ApplicationTracker.Angular && npm start

# Run the React client
cd src/clients/ApplicationTracker.React && npm run dev

# Build MAUI app for specific platform
dotnet build src/clients/ApplicationTracker.Maui -f net10.0-android
dotnet build src/clients/ApplicationTracker.Maui -f net10.0-ios
dotnet build src/clients/ApplicationTracker.Maui -f net10.0-maccatalyst
dotnet build src/clients/ApplicationTracker.Maui -f net10.0-windows10.0.19041.0
```

## Project Structure

```
ApplicationTracker/
├── src/
│   ├── backend/                                  # Backend services
│   │   ├── ApplicationTracker.Api/               # ASP.NET Core Web API
│   │   ├── ApplicationTracker.Core/              # Domain entities, interfaces
│   │   └── ApplicationTracker.Infrastructure/    # Data access, external services
│   ├── clients/
│   │   ├── ApplicationTracker.Angular/           # Angular 21 SPA
│   │   │   └── src/app/
│   │   │       ├── core/                         # Singleton services, interceptors, guards, API types
│   │   │       ├── features/                     # Lazy-loaded feature areas (auth, applications, shell)
│   │   │       └── shared/                       # Shared components (confirm-dialog, not-found)
│   │   ├── ApplicationTracker.React/             # React 19 SPA (Vite + TypeScript)
│   │   │   └── src/
│   │   │       ├── api/                          # API client (fetch functions, demo store)
│   │   │       ├── components/                   # App components + shadcn/ui
│   │   │       ├── hooks/                        # Custom React hooks
│   │   │       ├── lib/                          # Utilities and constants
│   │   │       ├── pages/                        # Route page components
│   │   │       ├── test/                         # Test setup
│   │   │       └── types/                        # Generated API types
│   │   └── ApplicationTracker.Maui/              # .NET MAUI Blazor app
│   │       ├── Components/                       # Blazor components (Pages, Layout, Dialogs, DataGrids)
│   │       ├── Models/                           # Data models
│   │       ├── Services/                         # App services
│   │       ├── Platforms/                        # Platform-specific code
│   │       └── wwwroot/                          # Static web assets
│   └── shared/
│       └── ApplicationTracker.Shared/            # Shared DTOs and models
├── tests/
│   └── ApplicationTracker.Api.Tests/             # Unit tests (xUnit + Moq)
│       ├── Controllers/                          # Controller tests
│       └── Services/                             # Service tests
├── docs/
│   └── sample_applications.xlsx                  # Sample data for import testing
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
| **API** | `ApplicationTracker.Api` | REST endpoints, services, Excel import/export |
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

### Angular

Tests are colocated with source files using [Vitest](https://vitest.dev/) and [Angular Testing Library](https://testing-library.com/docs/angular-testing-library/intro/).

```bash
# From src/clients/ApplicationTracker.Angular/
npm test           # Run once
npm run test:watch # Watch mode
```

### React

Tests are colocated with source files using [Vitest](https://vitest.dev/) and [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/).

```bash
# From src/clients/ApplicationTracker.React/
npm test           # Run once
npm run test:watch # Watch mode
```

## Deployment

The project deploys to Azure via GitHub Actions on every push to `main`.

| Component | Service | Tier |
|---|---|---|
| Angular SPA | Azure Static Web Apps | Free |
| ASP.NET Core API | Azure App Service | B1 Basic |
| Database | Azure SQL Database | Basic DTU |

The Angular and React clients share the same Azure Static Web Apps resource. The active client is whichever was deployed last. Use `workflow_dispatch` on either workflow to switch.

### CI/CD Workflows

| Workflow | Triggers | What it does |
|---|---|---|
| `deploy-api.yml` | Push to `main` (backend paths) | Runs .NET tests → migrates DB → publishes → deploys to App Service |
| `deploy-angular.yml` | Push to `main` (Angular paths) | Runs Angular tests → injects API URL → builds → deploys to Static Web Apps |
| `azure-static-web-apps-*.yml` | Push to `main` (React paths) | Runs React tests → builds with API URL → deploys to Static Web Apps |
| `migrate-database.yml` | Manual (`workflow_dispatch`) | Runs EF Core migrations against Azure SQL (safety checklist required) |

## API Documentation

When running in Development, the interactive Scalar API reference is available at `/scalar/v1`.

```bash
dotnet run --project src/backend/ApplicationTracker.Api
# Then open https://localhost:{port}/scalar/v1
```

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
- [Angular](https://angular.dev/overview)
- [Angular Material](https://material.angular.io/components/categories)
- [React](https://react.dev/learn)
- [Vite](https://vite.dev/guide/)
- [Vitest](https://vitest.dev/guide/)
- [Angular Testing Library](https://testing-library.com/docs/angular-testing-library/intro/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [shadcn/ui](https://ui.shadcn.com/docs)
- [TanStack Table](https://tanstack.com/table/latest/docs/introduction)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev/icons/)
- [Sonner](https://sonner.emilkowal.dev/)
- [openapi-typescript](https://openapi-ts.dev/)
- [Prettier](https://prettier.io/docs/)
- [Resend](https://resend.com/docs)
