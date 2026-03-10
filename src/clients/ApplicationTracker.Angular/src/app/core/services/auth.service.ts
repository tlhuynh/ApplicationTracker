import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of, tap, catchError, throwError } from 'rxjs';
import type { LoginRequest, RegisterRequest, AuthResponse } from '../api/api.types';

/** localStorage key for persisting the refresh token across page refreshes. */
const REFRESH_TOKEN_KEY = 'refresh_token';

/**
 * Singleton service responsible for all authentication state and operations.
 *
 * Token strategy:
 * - Access token: held in a private in-memory field — never written to localStorage to prevent XSS
 * - Refresh token: stored in localStorage — survives page refresh, cleared on logout
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  /** In-memory access token — never persisted to storage. */
  private accessToken: string | null = null;

  // ── Signals ───────────────────────────────────────────────────────────────

  private readonly _isAuthenticated = signal(false);
  private readonly _currentUser = signal<string | null>(null);

  /** Read-only signal — true when the user has a valid in-memory access token. */
  readonly isAuthenticated = this._isAuthenticated.asReadonly();

  /** Read-only signal — the authenticated user's email, or null when logged out. */
  readonly currentUser = this._currentUser.asReadonly();

  // ── Token helpers ─────────────────────────────────────────────────────────

  /**
   * Returns the current in-memory access token.
   * Called by AuthInterceptor to attach the Bearer header to outgoing requests.
   */
  public getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Stores tokens after a successful login or refresh and updates auth signals.
   * Access token stays in memory; refresh token is written to localStorage only when present.
   */
  private setTokens(response: AuthResponse): void {
    // Generated types mark all fields optional — use ?? to handle missing values safely
    this.accessToken = response.accessToken ?? null;

    // refreshToken is absent when rememberMe was false — don't write null to storage
    if (response.refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
    }

    this._isAuthenticated.set(true);
    this._currentUser.set(this.extractEmailFromToken(this.accessToken ?? ''));
  }

  /** Wipes all auth state — called on logout or when a token refresh fails unrecoverably. */
  private clearAuth(): void {
    this.accessToken = null;
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    this._isAuthenticated.set(false);
    this._currentUser.set(null);
  }

  /**
   * Decodes the JWT payload segment to extract the user's email claim.
   *
   * A JWT consists of three base64url segments separated by dots.
   * The middle segment (index 1) is the payload containing claims.
   * ASP.NET Core Identity writes the user's email into the 'email' claim.
   */
  private extractEmailFromToken(token: string): string | null {
    try {
      const payloadBase64 = token.split('.')[1];
      const decoded = JSON.parse(atob(payloadBase64));
      return decoded['email'] ?? null;
    } catch {
      // Malformed or empty token — fail silently and treat user as unauthenticated
      return null;
    }
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Registers a new user account.
   * Returns the plain-text confirmation message (not JSON) from the server.
   */
  public register(request: RegisterRequest): Observable<string> {
    return this.http.post('/api/Auth/register', request, { responseType: 'text' });
  }

  /**
   * Authenticates the user and stores the returned tokens.
   * Updates isAuthenticated and currentUser signals on success.
   */
  public login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/Auth/login', request).pipe(
      tap((response) => this.setTokens(response))
    );
  }

  /**
   * Exchanges the stored refresh token for a new access + refresh token pair.
   *
   * The backend expects a bare JSON string as the request body (not an object),
   * so we manually serialize the token and override Content-Type.
   */
  public refresh(): Observable<AuthResponse> {
    const storedToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    if (!storedToken) {
      return throwError(() => new Error('No refresh token in storage'));
    }

    return this.http
      .post<AuthResponse>('/api/Auth/refresh', JSON.stringify(storedToken), {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      })
      .pipe(tap((response) => this.setTokens(response)));
  }

  /**
   * Attempts to silently restore the session on app startup.
   * Reads the stored refresh token and exchanges it for a new token pair.
   * Always completes — errors are swallowed so the app does not hang during initialization.
   * Called via APP_INITIALIZER in app.config.ts before the first route renders.
   */
  public tryRestoreSession(): Observable<void> {
    const storedToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    if (!storedToken) {
      // No stored token — user was not previously authenticated, resolve immediately
      return of(void 0);
    }

    return this.refresh().pipe(
      catchError(() => {
        // Token expired or revoked — clear stale storage and continue as unauthenticated
        this.clearAuth();
        return of(void 0);
      })
    ) as Observable<void>;
  }

  /**
   * Logs the user out locally and revokes the refresh token server-side.
   *
   * Fire-and-forget pattern: local state is cleared and the user is redirected
   * to login immediately. The server revocation call runs in the background
   * and its result is intentionally ignored.
   */
  public logout(): void {
    const storedToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    // Clear local state first — user is logged out regardless of server response
    this.clearAuth();
    this.router.navigate(['/login']);

    // Revoke server-side to invalidate the token in the database
    if (storedToken) {
      this.http
        .post('/api/Auth/logout', JSON.stringify(storedToken), {
          headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
        })
        .subscribe({ error: () => {} }); // Ignore errors — local logout already complete
    }
  }
}
