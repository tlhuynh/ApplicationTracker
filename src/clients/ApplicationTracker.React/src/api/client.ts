/** Shared API client — centralizes auth headers and error handling. */

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

/** Called by AuthProvider to update the in-memory token. */
export function setAccessToken(token: string | null) {
  accessToken = token;
}

/** Returns the current in-memory access token. */
export function getAccessToken(): string | null {
  return accessToken;
}

/**
 * Fetch wrapper that attaches the Authorization header when a token is available.
 *
 * Usage is identical to the native fetch() — pass a URL and optional RequestInit.
 * The wrapper merges the Bearer token into the headers automatically.
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  return fetch(url, { ...options, headers });
}
