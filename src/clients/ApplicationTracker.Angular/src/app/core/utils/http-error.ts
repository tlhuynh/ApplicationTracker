import { HttpErrorResponse } from '@angular/common/http';

/** Shape of ASP.NET Core's ValidationProblemDetails (returned by [ApiController] on model validation failure). */
interface ValidationProblemDetails {
  title: string;
  errors: Record<string, string[]>;
}

function isValidationProblemDetails(value: unknown): value is ValidationProblemDetails {
  return (
    typeof value === 'object' &&
    value !== null &&
    'errors' in value &&
    typeof (value as ValidationProblemDetails).errors === 'object'
  );
}

/**
 * Extracts a user-facing string from an HttpErrorResponse body.
 *
 * Handles three shapes that the API can return for 4xx errors:
 * - Plain string — returned directly.
 * - ValidationProblemDetails — field errors are flattened into one string.
 * - Anything else — falls back to the provided fallback message.
 */
export function extractErrorMessage(err: HttpErrorResponse, fallback: string): string {
  const body: unknown = err.error;

  if (typeof body === 'string' && body.length > 0) {
    return body;
  }

  if (isValidationProblemDetails(body)) {
    const messages = Object.values(body.errors).flat();
    return messages.length > 0 ? messages.join(' ') : fallback;
  }

  return fallback;
}