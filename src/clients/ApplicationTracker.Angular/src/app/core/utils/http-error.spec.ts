import { HttpErrorResponse } from '@angular/common/http';
import { extractErrorMessage } from './http-error';

const FALLBACK = 'Something went wrong.';

function makeError(status: number, error: unknown): HttpErrorResponse {
  return new HttpErrorResponse({ status, error });
}

describe('extractErrorMessage', () => {

  // ── Plain string body ──────────────────────────────────────────────────────

  it('returns the string body directly when err.error is a non-empty string', () => {
    const err = makeError(400, 'Company name is required.');
    expect(extractErrorMessage(err, FALLBACK)).toBe('Company name is required.');
  });

  it('falls back when err.error is an empty string', () => {
    const err = makeError(400, '');
    expect(extractErrorMessage(err, FALLBACK)).toBe(FALLBACK);
  });

  // ── ValidationProblemDetails body ─────────────────────────────────────────

  it('returns the single field error from a ValidationProblemDetails body', () => {
    const err = makeError(400, {
      title: 'One or more validation errors occurred.',
      errors: { Notes: ['Notes cannot exceed 5000 characters.'] },
    });
    expect(extractErrorMessage(err, FALLBACK)).toBe('Notes cannot exceed 5000 characters.');
  });

  it('flattens multiple field errors from a ValidationProblemDetails body', () => {
    const err = makeError(400, {
      title: 'One or more validation errors occurred.',
      errors: {
        CompanyName: ['Company name is required.'],
        Notes: ['Notes cannot exceed 5000 characters.'],
      },
    });
    const result = extractErrorMessage(err, FALLBACK);
    expect(result).toContain('Company name is required.');
    expect(result).toContain('Notes cannot exceed 5000 characters.');
  });

  it('falls back when ValidationProblemDetails has an empty errors object', () => {
    const err = makeError(400, {
      title: 'One or more validation errors occurred.',
      errors: {},
    });
    expect(extractErrorMessage(err, FALLBACK)).toBe(FALLBACK);
  });

  // ── Unknown object body ────────────────────────────────────────────────────

  it('falls back when err.error is an object without an errors key', () => {
    const err = makeError(400, { detail: 'unknown shape' });
    expect(extractErrorMessage(err, FALLBACK)).toBe(FALLBACK);
  });

  it('falls back when err.error is null', () => {
    const err = makeError(400, null);
    expect(extractErrorMessage(err, FALLBACK)).toBe(FALLBACK);
  });
});
