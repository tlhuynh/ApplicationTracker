# Application Tracker

A full-stack .NET project for tracking job applications, built as a learning playground to explore modern technologies.

**Live Demo**:

React: [jobapptracker.tlhuynh.dev](https://jobapptracker.tlhuynh.dev)

Angular: WIP

## Technologies

### Frameworks & Language
- [.NET 10](https://dotnet.microsoft.com/download/dotnet/10.0) / **C# 13**
- [ASP.NET Core Web API](https://learn.microsoft.com/aspnet/core/web-api/) - Backend REST API
- [React 19](https://react.dev/) - Web frontend SPA
- [Angular 21](https://angular.dev/) - Web frontend SPA (WIP)
- [Vite](https://vite.dev/) - Frontend build tool and dev server
- [.NET MAUI](https://learn.microsoft.com/dotnet/maui/) - Cross-platform native UI
- [Blazor Hybrid](https://learn.microsoft.com/aspnet/core/blazor/hybrid/) - Web UI components within MAUI

### Component Libraries
- React
  - [shadcn/ui](https://ui.shadcn.com/) - Accessible UI components built on Radix UI (React)
  - [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework (React)
  - [Lucide React](https://lucide.dev/) - Icon library (used by shadcn/ui)
  - [Sonner](https://sonner.emilkowal.dev/) - Toast notifications (React)
  - [TanStack Table](https://tanstack.com/table/latest) - Headless table library for React
- Cross-platform
  - [MudBlazor](https://mudblazor.com/) - Material Design component library (MAUI)
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

### Prerequisites
- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- [Node.js 22+](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- EF Core tools: `dotnet tool install --global dotnet-ef`

> **Apple Silicon (M1/M2/M3/M4):** Enable **Rosetta emulation** in Docker Desktop → Settings → General before starting the SQL Server container.

### 1. Clone the Repository
```bash
git clone https://github.com/tlhuynh/ApplicationTracker.git
cd ApplicationTracker
```

### 2. Configure the Local Database

Copy the environment template and set your SQL Server SA password:
```bash
cp .env.example .env
```
Open `.env` and replace the placeholder with a strong password (8+ chars, uppercase, lowercase, digit, symbol).

Start the SQL Server container:
```bash
docker compose up -d
```

### 3. Configure User Secrets

The API reads sensitive config from [user-secrets](https://learn.microsoft.com/aspnet/core/security/app-secrets) — never from committed files.

```bash
# Connection string — use the same password as SA_PASSWORD in .env
dotnet user-secrets set "ConnectionStrings:DefaultConnection" \
  "Server=localhost,1433;Database=ApplicationTracker;User Id=sa;Password=<SA_PASSWORD>;TrustServerCertificate=true;" \
  --project src/backend/ApplicationTracker.Api

# JWT signing key — any random string, 32+ characters
dotnet user-secrets set "Jwt:Key" "your-random-32-char-minimum-secret" \
  --project src/backend/ApplicationTracker.Api
```

### 4. Apply Database Migrations

```bash
dotnet ef database update \
  --project src/backend/ApplicationTracker.Infrastructure \
  --startup-project src/backend/ApplicationTracker.Api
```

### 5. Run the API

```bash
dotnet run --project src/backend/ApplicationTracker.Api
```

Interactive API docs available at `http://localhost:5021/scalar/v1`.

### 6. Run a Web Client

**React:**
```bash
cd src/clients/ApplicationTracker.React
npm install
npm run dev
# → http://localhost:5173
```

**Angular (WIP):**
```bash
cd src/clients/ApplicationTracker.Angular
npm install
npm start
# → http://localhost:4200
```

---

### MAUI (Mobile / Desktop)

Additional prerequisites:
- [Visual Studio 2022 (17.12+)](https://visualstudio.microsoft.com/) or [JetBrains Rider](https://www.jetbrains.com/rider/)
- Xcode 15+ (iOS/macOS)
- Android SDK

```bash
dotnet workload restore

# Build for a specific platform
dotnet build src/clients/ApplicationTracker.Maui -f net10.0-android
dotnet build src/clients/ApplicationTracker.Maui -f net10.0-ios
dotnet build src/clients/ApplicationTracker.Maui -f net10.0-maccatalyst
dotnet build src/clients/ApplicationTracker.Maui -f net10.0-windows10.0.19041.0
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
│   │   │       ├── hooks/                   # Custom React hooks (use-auth, use-theme, use-mobile)
│   │   │       ├── lib/                     # Utilities and constants
│   │   │       ├── pages/                   # Route page components (Home, Import, Login, Register, ConfirmEmail, ForgotPassword, ResetPassword, NotFound)
│   │   │       ├── test/                    # Test setup
│   │   │       └── types/                   # Generated API types
│   │   ├── ApplicationTracker.Angular/      # Angular 21 SPA (WIP)
│   │   │   └── src/app/
│   │   │       ├── core/                    # Guards, interceptors, services, generated API types
│   │   │       ├── features/                # Lazy-loaded feature areas (auth, shell, applications)
│   │   │       └── shared/                  # Shared components (confirm-dialog, not-found)
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

Tests are colocated with source files (`*.test.tsx` alongside each page/component). The stack is [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) + [`@testing-library/user-event`](https://testing-library.com/docs/user-event/intro/) for realistic event simulation.

Covered: `App`, `ProtectedRoute`, `ApplicationTable`, `HomePage`, `LoginPage`, `RegisterPage`, `ConfirmEmailPage`, `ForgotPasswordPage`, `ResetPasswordPage`, `ImportPage`, `NotFoundPage`

```bash
# Run React tests (from src/clients/ApplicationTracker.React/)
npm test

# Watch mode
npm run test:watch
```

## Deployment

The project is deployed to Azure via GitHub Actions on every push to `main`.

| Component | Service | Tier | URL |
|---|---|---|---|
| React SPA | Azure Static Web Apps | Free | `https://jobapptracker.tlhuynh.dev` |
| ASP.NET Core API | Azure App Service | B1 Basic | `https://applicationtracker-api-g5f4efdwenfpf5a0.centralus-01.azurewebsites.net` |
| Database | Azure SQL Database | Basic DTU | `ApplicationTrackerDB` (Central US) |

### CI/CD Workflows

- `.github/workflows/deploy-api.yml` — runs .NET tests, publishes, and deploys to App Service
- `.github/workflows/azure-static-web-apps-mango-rock-06c415c0f.yml` — runs React tests, builds with production API URL, and deploys to Static Web Apps

## API Documentation

When running in Development, the interactive Scalar API reference is available at `http://localhost:5021/scalar/v1`. The URL is logged to the console on startup.

```bash
dotnet run --project src/backend/ApplicationTracker.Api
# → info: Scalar API reference: http://localhost:5021/scalar/v1
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
