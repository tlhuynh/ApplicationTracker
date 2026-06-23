import { provideRouter, ActivatedRoute } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { render, screen } from '@testing-library/angular';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmEmail } from './confirm-email';

function createAuthServiceMock() {
  return {
    confirmEmail: vi.fn().mockReturnValue(of('')),
  };
}

function createRouteMock(params: Record<string, string> = {}) {
  return {
    snapshot: {
      queryParamMap: {
        get: (key: string) => params[key] ?? null,
      },
    },
  };
}

const VALID_PARAMS = { userId: 'user-123', token: 'valid-token' };

describe('ConfirmEmail', () => {
  async function setup(
    params: Record<string, string> = VALID_PARAMS,
    authMock = createAuthServiceMock(),
  ) {
    await render(ConfirmEmail, {
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authMock },
        { provide: ActivatedRoute, useValue: createRouteMock(params) },
      ],
    });
    return { authMock };
  }

  describe('when query params are missing', () => {
    it('should show the confirmation failed heading', async () => {
      await setup({});
      expect(screen.getByRole('heading', { name: /confirmation failed/i })).toBeInTheDocument();
    });

    it('should show a message about the invalid link', async () => {
      await setup({});
      expect(screen.getByText(/invalid or incomplete/i)).toBeInTheDocument();
    });

    it('should show a link to go to login', async () => {
      await setup({});
      expect(screen.getByRole('link', { name: /go to login/i })).toBeInTheDocument();
    });

    it('should not call confirmEmail', async () => {
      const authMock = createAuthServiceMock();
      await setup({}, authMock);
      expect(authMock.confirmEmail).not.toHaveBeenCalled();
    });
  });

  describe('when query params are present', () => {
    it('should call confirmEmail with userId and token', async () => {
      const authMock = createAuthServiceMock();
      await setup(VALID_PARAMS, authMock);
      expect(authMock.confirmEmail).toHaveBeenCalledWith({
        userId: 'user-123',
        token: 'valid-token',
      });
    });

    it('should show the success card after confirmation', async () => {
      await setup();
      expect(screen.getByRole('heading', { name: /email confirmed/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /go to login/i })).toBeInTheDocument();
    });

    it('should show error message on 400 response', async () => {
      const authMock = createAuthServiceMock();
      authMock.confirmEmail.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 400 })),
      );
      await setup(VALID_PARAMS, authMock);
      expect(screen.getByRole('heading', { name: /confirmation failed/i })).toBeInTheDocument();
      expect(screen.getByText(/invalid or has already been used/i)).toBeInTheDocument();
    });

    it('should show server error message on 5xx response', async () => {
      const authMock = createAuthServiceMock();
      authMock.confirmEmail.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 500 })),
      );
      await setup(VALID_PARAMS, authMock);
      expect(screen.getByRole('heading', { name: /confirmation failed/i })).toBeInTheDocument();
      expect(screen.getByText(/something went wrong on our end/i)).toBeInTheDocument();
    });

    it('should show connection error message on network failure', async () => {
      const authMock = createAuthServiceMock();
      authMock.confirmEmail.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 0 })),
      );
      await setup(VALID_PARAMS, authMock);
      expect(screen.getByRole('heading', { name: /confirmation failed/i })).toBeInTheDocument();
      expect(screen.getByText(/unable to reach the server/i)).toBeInTheDocument();
    });
  });
});