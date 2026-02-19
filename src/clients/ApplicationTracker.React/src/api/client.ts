// Set up to switch between env
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';

/** Shared API client — centralizes auth headers and error handling. */
import type { components } from '@/types/api';

type AuthResponse = components['schemas']['AuthResponse'];

/** Represents an error response from the API with an HTTP status code. */
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** Checks the response status and parses the JSON body. Throws {@link ApiError} on non-OK responses. */
export async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text();
    throw new ApiError(response.status, message);
  }
  return response.json();
}

/**
 * Notes about his accessToken variable, this is the approach to save access token in memory instead of localStorage,
 * which can be exploited thru XSS
 * */
/**
 * Module-level token holder.
 *
 * This is NOT React state — it's a plain variable that lives for the lifetime of the JS module.
 * The AuthProvider sets this after login/refresh, and authFetch reads it on every request.
 * Keeping it outside React avoids prop-drilling or context lookups in the API layer.
 */
let accessToken: string | null = null;

const REFRESH_TOKEN_KEY = 'refresh_token';

/** Called by AuthProvider to update the in-memory token. */
export function setAccessToken(token: string | null) {
  accessToken = token;
}

/** Returns the current in-memory access token. */
export function getAccessToken(): string | null {
  return accessToken;
}

/** Exchanges a refresh token for a new access + refresh token pair. */
export async function refreshToken(token: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(token),
  });
  return handleResponse<AuthResponse>(response);
}

/** Tracks whether a 401 retry is already in progress to prevent infinite loops. */
let isRefreshing = false;

/**
 * Fetch wrapper that attaches the Authorization header when a token is available.
 *
 * If the server responds with 401 (token expired), attempts a single token refresh
 * and retries the original request. If the refresh also fails, clears auth state
 * so the user is redirected to login.
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${url}`, { ...options, headers });

  // Retry logic to try refreshing the token, log out user if this retry failed.
  if (response.status === 401 && !isRefreshing) {
    const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (storedRefreshToken) {
      isRefreshing = true;
      try {
        const result = await refreshToken(storedRefreshToken);
        const newAccessToken = result.accessToken ?? '';
        const newRefreshToken = result.refreshToken ?? '';

        setAccessToken(newAccessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);

        // Retry the original request with the new token
        const retryHeaders = new Headers(options.headers);
        retryHeaders.set('Authorization', `Bearer ${newAccessToken}`);
        return fetch(`${API_BASE_URL}${url}`, { ...options, headers: retryHeaders });
      } catch {
        // Refresh failed — clear auth state so ProtectedRoute redirects to login
        setAccessToken(null);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
      } finally {
        isRefreshing = false;
      }
    }
  }

  return response;
}
