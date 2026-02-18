# Authentication Flow — Implementation Guide

A high-level guide for implementing JWT-based authentication in a .NET + React SPA, based on the patterns used in this project.

## Part 1: Backend (ASP.NET Core Identity + JWT)

### 1. Set up ASP.NET Core Identity

- Add Identity NuGet packages
- Change `DbContext` to extend `IdentityDbContext<IdentityUser>`
- Register Identity services in `Program.cs`
- Run EF Core migration to create Identity tables (AspNetUsers, AspNetRoles, etc.)

### 2. Create the token service

- Generate JWT access tokens (short-lived, e.g. 15 min) with user claims (sub, email)
- Generate cryptographic refresh tokens (long-lived, e.g. 7 days) — random strings, not JWTs
- Store refresh tokens in a dedicated database table (token value, user ID, expiration, revoked flag)
- Implement **token rotation** — each refresh invalidates the old token and issues a new one

### 3. Create the auth controller

- `POST /register` — create user via Identity's `UserManager`, return success/error
- `POST /login` — validate credentials via `SignInManager`, return access token + refresh token + expiry. Support `RememberMe` flag — if false, skip generating/storing a refresh token (session-only)
- `POST /refresh` — validate refresh token from DB, rotate it, return new token pair
- `POST /logout` — accept refresh token, revoke it in the database (`[Authorize]` required). Return 204 regardless of whether token was found (don't leak existence)

### 4. Configure JWT Bearer authentication

- Register JWT Bearer scheme in `Program.cs` with validation parameters (issuer, audience, signing key)
- Store the signing key in user-secrets (not appsettings)

### 5. Secure API endpoints

- Add `[Authorize]` to controllers that require authentication
- Keep auth endpoints public (no `[Authorize]`) except logout (requires auth to know which user is revoking)
- Extract user ID from JWT claims in controllers to scope data per user

### 6. Per-user data isolation

- Stamp every record with the authenticated user's ID on create/import
- Filter all queries by user ID in the repository layer
- Return 404 (not 403) when accessing another user's record — don't leak existence

## Part 2: Frontend (React SPA)

### 7. Create the API layer

- Auth API functions (`login`, `register`) — plain `fetch()` calls, no auth header needed
- `logout` function — uses `authFetch` (endpoint requires `[Authorize]`)
- `refreshToken` function — plain `fetch()`, co-located with the fetch wrapper to avoid circular imports

### 8. Build the token management layer (`client.ts`)

- Module-level variable for access token (in-memory, not localStorage — XSS-safe)
- `setAccessToken()` / `getAccessToken()` functions for the auth provider to use
- `authFetch()` wrapper — drop-in `fetch()` replacement that attaches `Authorization: Bearer` header
- **401 retry logic** — on 401 response, attempt one token refresh, update stored tokens, retry the original request. Use an `isRefreshing` flag to prevent infinite loops. If refresh fails, clear auth state

### 9. Build the AuthProvider (React context)

- Wrap the entire app (above the router) so all routes can access auth state
- Manage state: `user` (email from JWT), `isAuthenticated`, `isLoading`
- **Login handler** — call API, store access token in memory, extract user from JWT claims. If a refresh token was returned (RememberMe was true), store it in localStorage and schedule auto-refresh. Otherwise session is in-memory only
- **Register handler** — call API, don't auto-login (let user log in explicitly)
- **Logout handler** — read refresh token from localStorage before clearing it, send it to the backend logout endpoint (fire-and-forget — `.catch(() => {})`), then clear access token, localStorage, and cancel refresh timer. User is logged out locally regardless of whether the backend call succeeds
- **Silent session restore** (on mount) — check localStorage for refresh token, exchange it for a new access token. If it fails, stay logged out silently
- **Auto-refresh timer** — `setTimeout` at ~80% of token TTL. On success, schedule the next refresh (self-resetting). Use `useRef` to hold the function to avoid React Compiler issues with recursive references

### 10. Build the auth UI

- `LoginPage` — email + password form, "Remember me" checkbox, client-side validation, server error display, redirect to `/` on success
- `RegisterPage` — email + password + confirm password form, same patterns
- Both pages: redirect already-authenticated users to `/` via `<Navigate>` (placed after all hooks to satisfy Rules of Hooks)

### 11. Protect routes

- `ProtectedRoute` — layout route that checks `isAuthenticated`. Shows loading spinner during session restore (`isLoading`), redirects to `/login` if unauthenticated, renders `<Outlet />` if authenticated
- Nest all protected pages under `ProtectedRoute` in the router config

## Key Design Decisions

| Decision | Trade-off |
|---|---|
| **Access token storage** | In-memory (XSS-safe, lost on refresh) vs localStorage (persists, XSS-vulnerable) vs httpOnly cookie (most secure, needs backend support) |
| **Refresh token storage** | localStorage (simple, XSS risk) vs httpOnly cookie (secure, CSRF concerns) |
| **Token refresh strategy** | Proactive timer (smoother UX) vs 401 retry only (simpler) vs both (belt and suspenders) |
| **Auto-login after register** | Convenience vs forcing user to confirm credentials |
| **Error granularity** | "Invalid credentials" (secure) vs "Email not found" / "Wrong password" (user-friendly, leaks info) |
| **Refresh token rotation** | Rotate on each use (detects theft) vs static (simpler) |
| **Remember me** | No refresh token (session ends on browser close) vs refresh token in localStorage (persistent) |
| **Server-side logout** | Revoke token in DB (secure, extra API call) vs frontend-only cleanup (simpler, token still valid until expiry) |

## Order of Implementation

The parts build on each other roughly in this order:

1. Identity + DB migration
2. Token service + refresh token table
3. Auth controller (register, login, refresh, logout)
4. JWT Bearer config + `[Authorize]`
5. Frontend API layer + `authFetch` wrapper
6. AuthProvider (login/logout/state)
7. Login + Register pages
8. ProtectedRoute + route config
9. Silent session restore + auto-refresh timer
10. Per-user data isolation
11. Polish: 401 retry, auth page redirects, remember me, server-side logout
12. Email service abstraction + console logger
13. Email confirmation (register, confirm, resend)
14. Password reset (forgot, reset)
15. Frontend pages for confirmation + reset flows

## Part 3: Email Confirmation & Password Reset

### 12. Email service abstraction

- Create `IEmailService` interface in Core (`SendAsync(to, subject, body)`)
- Create `ConsoleEmailService` in Api — logs email content via `ILogger` for development
- Register in DI: `builder.Services.AddScoped<IEmailService, ConsoleEmailService>()`
- Add `App:FrontendBaseUrl` to `appsettings.json` for building confirmation/reset links

### 13. Email confirmation

- **Register endpoint** — after creating user, generate confirmation token via `UserManager.GenerateEmailConfirmationTokenAsync`, URL-encode with `Uri.EscapeDataString()` (Identity tokens contain `+`, `/`, `=`), build link to frontend `/confirm-email?userId=...&token=...`, send via email service
- **Login endpoint** — after password check, add `IsEmailConfirmedAsync` gate. Return 403 (not 401) if unconfirmed — lets frontend distinguish "wrong credentials" from "unconfirmed"
- **Confirm email endpoint** (`POST /api/auth/confirm-email`) — accepts `ConfirmEmailRequest` (userId + token), calls `UserManager.ConfirmEmailAsync`
- **Resend confirmation endpoint** (`POST /api/auth/resend-confirmation`) — accepts email, always returns same message regardless of whether user exists (prevents email enumeration)

### 14. Password reset

- **Forgot password endpoint** (`POST /api/auth/forgot-password`) — accepts email, generates reset token if user exists and email confirmed, sends link to `/reset-password?email=...&token=...`. Same response regardless of user existence
- **Reset password endpoint** (`POST /api/auth/reset-password`) — accepts `ResetPasswordRequest` (email + token + newPassword), calls `UserManager.ResetPasswordAsync`. Returns generic error on failure

### 15. Frontend pages

- **RegisterPage** — after success, show "Check your email" card with confirmation message instead of navigating to login
- **LoginPage** — handle 403 with "Resend confirmation email" button. Add "Forgot password?" link
- **ConfirmEmailPage** — reads `userId` + `token` from URL query params (`useSearchParams`). Calls API on mount with `useRef` guard (prevents StrictMode double-execution). Shows loading → success → error states
- **ForgotPasswordPage** — email form → calls forgot-password API → shows "Check your email" success card
- **ResetPasswordPage** — reads `email` + `token` from URL params. If missing, shows error. Otherwise shows new password + confirm form → calls reset API → shows success card
- All 3 new pages are public routes (outside `ProtectedRoute` in router config)

### Key considerations

| Topic | Details |
|---|---|
| **Token encoding** | Identity tokens contain `+`, `/`, `=`. Backend must `Uri.EscapeDataString()` when building links. `useSearchParams().get()` auto-decodes on the frontend |
| **Existing users** | Users created before email confirmation was added have `EmailConfirmed = false`. Run `UPDATE AspNetUsers SET EmailConfirmed = 1` as a one-time fix |
| **No migration needed** | `EmailConfirmed` already exists on `AspNetUsers` (part of `IdentityUser`). Password reset tokens are generated by Identity's token providers — no custom table |
| **StrictMode** | `useEffect` runs twice in dev. For one-time token consumption (confirm email), use `useRef` as a guard to prevent the second call |
| **Email enumeration** | Resend confirmation, forgot password, and reset password all return the same response regardless of whether the email exists |
