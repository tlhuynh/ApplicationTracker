# ApplicationTracker — Angular Client

Angular 21 SPA for the ApplicationTracker project. See the [root README](../../README.md) for full project context.

## Stack

- [Angular 21](https://angular.dev/) — standalone components, signals, OnPush change detection
- [Angular Material](https://material.angular.io/) — UI components (Azure/Blue theme)
- [Vitest](https://vitest.dev/) + [Angular Testing Library](https://testing-library.com/docs/angular-testing-library/intro/) — unit tests

## Getting Started

```bash
npm install
npm start        # Dev server at http://localhost:4200 (proxies API calls to :5021)
npm run build    # Production build
npm test         # Run tests once
npm run test:watch
```

The backend API must be running locally for the dev server to function. See the [root README](../../README.md) for API setup.

## Structure

```
src/app/
├── core/
│   ├── api/            # Generated OpenAPI types (api.d.ts) and mapped TS types (api.types.ts)
│   ├── guards/         # auth.guard, guest.guard
│   ├── interceptors/   # auth.interceptor (attaches Bearer token, handles 401 refresh + retry)
│   └── services/       # auth.service, application.service, theme.service
├── features/
│   ├── auth/           # login, register, forgot-password, reset-password
│   ├── shell/          # Authenticated layout (sidebar, nav, router outlet)
│   └── applications/
│       ├── home/               # Applications table (pagination, sort, filter, export)
│       ├── import/             # Excel import (.xlsx upload + per-row validation)
│       ├── application-dialog/ # Add / edit record dialog
│       ├── detail-dialog/      # Read-only record detail
│       └── note-dialog/        # Read-only notes viewer
└── shared/
    ├── confirm-dialog/  # Generic confirmation dialog
    └── not-found/       # 404 page
```

## Environment

| File | Used when |
|---|---|
| `src/environments/environment.ts` | Development (`npm start`) — empty `apiUrl`, relative paths handled by proxy |
| `src/environments/environment.prod.ts` | Production build — `apiUrl` placeholder replaced by CI before build |

The dev proxy config is in `proxy.conf.json` — forwards `/api/*` to `http://localhost:5021`.
