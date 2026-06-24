---
paths:
  - "src/clients/ApplicationTracker.React/**"
---

## Key Patterns

- **Auth**: `AuthProvider` manages in-memory access token + localStorage refresh token. `useAuth()` hook provides `login`, `register`, `logout`, `user`, `isAuthenticated`, `isLoading`, `isDemoMode`, `enterDemoMode`, `exitDemoMode`. `ProtectedRoute` layout route redirects unauthenticated users to `/login`. Silent session restore on page refresh via stored refresh token. Auto-refresh at 80% of token TTL. `authFetch()` wrapper in `client.ts` attaches Bearer header and retries once on 401 (refreshes token transparently). Login/Register pages redirect authenticated users to `/` via `<Navigate>`. "Remember me" checkbox on login — unchecked = session-only (no refresh token), checked = persistent session. Logout calls backend to revoke refresh token (fire-and-forget). Registration shows "check your email" success card. Login handles 403 (unconfirmed email) with resend button. Forgot password and reset password flows via dedicated pages
- **URL Param Validation**: When a page requires URL query params (e.g. `ConfirmEmailPage`, `ResetPasswordPage`), validate them before any `useState` calls and use lazy initializers to set the correct initial state — never call `setStatus`/`setMessage` inside `useEffect` for a condition that's already known on mount. This prevents a flash of "loading" state and avoids the `react-hooks/set-state-in-effect` lint rule. Pattern: read params → derive `isMissingParams` → pass to `useState(() => isMissingParams ? 'error' : 'loading')`. The `useEffect` then guards with `if (isMissingParams) return;` before making any API call.
- **Error Handling**: Auth form errors use shadcn `Alert` (destructive variant). Status-code-based messages: 5xx/405 → `"Something went wrong on our end. Please try again later."`, 4xx → API message passthrough, network error → `"Unable to reach the server. Please check your connection."`. Toast errors use `getToastErrorMessage(err, fallback)` in `src/lib/utils.ts`. Toast duration 6000ms via `toastOptions` on `<Toaster />`
- **Loading States**: Auth pages show a semi-transparent `Loader2` overlay (`absolute inset-0`, Card needs `relative`) while `isSubmitting` is true — blocks all card interaction. `ApplicationFormDialog` shows a `Loader2` spinner on Save and prevents close (X, Escape) via `handleOpenChange`. `HomePage` tracks `isDeletingPending` (blocks AlertDialog, uses `isDeletingRef` during delete) and `pendingStatusId` (disables advance/reject on the row being updated). File input on `ImportPage` is `disabled` during upload.
- **Demo Mode**: "Try Demo" button on `LoginPage` — no account required. `enterDemoMode()` seeds 6 sample records into `sessionStorage` and sets `isAuthenticated = true`/`user = 'Demo'` so `ProtectedRoute` passes through unchanged. `demoStore.ts` manages sessionStorage keys. `demoApplicationRecords.ts` mirrors `applicationRecords.ts` signatures but operates on the demo store. `useApplicationRecordsApi()` returns real or demo API functions based on `isDemoMode`. Excel import in demo mode calls the public `/parse` endpoint (no DB save). Amber banner in `App.tsx` with "Sign In" CTA. Data survives page refresh but clears on browser close.
- **Production API URL**: `API_BASE_URL` from `client.ts` reads `import.meta.env.VITE_API_URL ?? ''`. Empty in development (Vite proxy handles routing), full URL in production

## App Structure

Located in `src/clients/ApplicationTracker.React/`:

- `src/api/` - API client functions (`applicationRecords.ts` + `parseExcel()` public endpoint, `auth.ts`, `client.ts`, `demoStore.ts` sessionStorage helpers, `demoApplicationRecords.ts` mock API for demo mode)
- `src/components/` - App components (`AppSidebar.tsx`, `AuthProvider.tsx`, `ProtectedRoute.tsx`, `ThemeProvider.tsx`, `ThemeToggle.tsx`)
- `src/components/applications/` - Application feature components (`ApplicationTable`, `ApplicationFormDialog`, `applicationColumns`, `NotesCell`)
- `src/components/ui/` - shadcn/ui generated components (ESLint-ignored)
- `src/hooks/` - Custom hooks (`use-auth.ts`, `use-application-records-api.ts` API switcher, `use-mobile.ts`, `use-theme.ts`)
- `src/lib/` - Utilities (`utils.ts` with `cn()` helper) and constants (`constants.ts`)
- `src/pages/` - Route page components (`HomePage`, `ImportPage`, `LoginPage`, `RegisterPage`, `ConfirmEmailPage`, `ForgotPasswordPage`, `ResetPasswordPage`, `NotFoundPage`)
- `src/types/` - Generated TypeScript types from OpenAPI spec (`api.d.ts`)
- `src/test/` - Test setup (`setup.ts` with JSDOM mocks)
- `vite.config.ts` - Vite + Vitest + API proxy configuration

## Code Style

- **Functional components only** — no class components
- **Function declarations** for components, **arrow functions** for handlers and helpers
- **Tailwind CSS** for styling, **shadcn/ui** for pre-built components

## Testing

- **Component Testing**: React Testing Library — render, click, assert on DOM from the user's perspective
- **API Mocking**: `vi.mock('@/api/moduleName', () => ({ fn: vi.fn() }))` at module level — use `vi.mocked()` to control return values per test; reset with `vi.resetAllMocks()` in `beforeEach`
- **Error path pattern**: `mockRejectedValue(new ApiError(status, 'message'))` to simulate API failures; assert on the rendered error message or toast
- **Components**: renders with given props, conditional rendering (loading/error/empty states), user interactions
- **Hooks**: custom hooks with `renderHook` from React Testing Library
- **Forms**: validation, submission, error display
- **Duplicate labels**: when the same text appears in both a filter area and a data display area, `screen.getByText()` throws "Found multiple elements" — scope with `within()`: `const table = screen.getByRole('table'); within(table).getByText('Applied')`