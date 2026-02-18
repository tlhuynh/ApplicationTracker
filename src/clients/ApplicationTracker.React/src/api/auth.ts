import type { components } from '@/types/api';
import { ApiError, authFetch, handleResponse } from '@/api/client';

// Alias for easier access to generated types
type AuthResponse = components['schemas']['AuthResponse'];
type LoginRequest = components['schemas']['LoginRequest'];
type RegisterRequest = components['schemas']['RegisterRequest'];
type ConfirmEmailRequest = components['schemas']['ConfirmEmailRequest'];
type ResendConfirmationRequest = components['schemas']['ResendConfirmationRequest'];
type ForgotPasswordRequest = components['schemas']['ForgotPasswordRequest'];
type ResetPasswordRequest = components['schemas']['ResetPasswordRequest'];

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

/** Confirms a user's email address using the token from the confirmation link. */
export async function confirmEmail(request: ConfirmEmailRequest): Promise<string> {
  const response = await fetch(`${BASE_URL}/confirm-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    const message = await response.text();
    throw new ApiError(response.status, message);
  }
  return response.text();
}

/** Requests a new confirmation email. Always resolves — does not reveal if email exists. */
export async function resendConfirmation(request: ResendConfirmationRequest): Promise<string> {
  const response = await fetch(`${BASE_URL}/resend-confirmation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    const message = await response.text();
    throw new ApiError(response.status, message);
  }
  return response.text();
}

/** Requests a password reset email. Always resolves — does not reveal if email exists. */
export async function forgotPassword(request: ForgotPasswordRequest): Promise<string> {
  const response = await fetch(`${BASE_URL}/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    const message = await response.text();
    throw new ApiError(response.status, message);
  }
  return response.text();
}

/** Resets a user's password using the token from the reset email. */
export async function resetPassword(request: ResetPasswordRequest): Promise<string> {
  const response = await fetch(`${BASE_URL}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    const message = await response.text();
    throw new ApiError(response.status, message);
  }
  return response.text();
}

export type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  ConfirmEmailRequest,
  ResendConfirmationRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
};
