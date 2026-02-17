import type { components } from '@/types/api';
import { ApiError, authFetch, handleResponse } from '@/api/client';

type AuthResponse = components['schemas']['AuthResponse'];
type LoginRequest = components['schemas']['LoginRequest'];
type RegisterRequest = components['schemas']['RegisterRequest'];

const BASE_URL = '/api/auth';

/** Registers a new user account. */
export async function register(request: RegisterRequest): Promise<string> {
  const response = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    const message = await response.text();
    throw new ApiError(response.status, message);
  }

  // Return response.text() here since register endpoint return a string rather than a json
  return response.text();
}

/** Authenticates a user and returns access + refresh tokens. */
export async function login(request: LoginRequest): Promise<AuthResponse> {
  const response = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return handleResponse<AuthResponse>(response);
}

/** Revokes the refresh token on the server. */
export async function logout(token: string): Promise<void> {
  await authFetch(`${BASE_URL}/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(token),
  });
}

export type { AuthResponse, LoginRequest, RegisterRequest };
