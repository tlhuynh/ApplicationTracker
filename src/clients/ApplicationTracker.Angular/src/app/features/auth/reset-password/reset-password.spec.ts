import { provideRouter, ActivatedRoute } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { ResetPassword } from './reset-password';

function createAuthServiceMock() {
  return {
    resetPassword: vi.fn().mockReturnValue(of('')),
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

const VALID_PARAMS = { email: 'test@example.com', token: 'valid-token' };

describe('ResetPassword', () => {
  async function setup(
    params: Record<string, string> = VALID_PARAMS,
    authMock = createAuthServiceMock(),
  ) {
    await render(ResetPassword, {
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authMock },
        { provide: ActivatedRoute, useValue: createRouteMock(params) },
      ],
    });
    return { authMock, user: userEvent.setup() };
  }

  describe('when query params are missing', () => {
    it('should show the invalid reset link card', async () => {
      await setup({});
      expect(screen.getByRole('heading', { name: /invalid reset link/i })).toBeInTheDocument();
    });

    it('should show a link to request a new reset link', async () => {
      await setup({});
      expect(screen.getByRole('link', { name: /request new reset link/i })).toBeInTheDocument();
    });
  });

  describe('when query params are present', () => {
    it('should render the reset password form', async () => {
      await setup();
      expect(screen.getByRole('heading', { name: /^reset password$/i })).toBeInTheDocument();
      expect(screen.getByLabelText('New password')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirm new password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
    });

    it('should show required errors when submitting empty form', async () => {
      const { user } = await setup();
      await user.click(screen.getByRole('button', { name: /reset password/i }));
      expect(screen.getAllByText('This field is required').length).toBeGreaterThanOrEqual(1);
    });

    it('should show error when new password is too short', async () => {
      const { user } = await setup();
      await user.type(screen.getByLabelText('New password'), 'abc');
      await user.click(screen.getByRole('button', { name: /reset password/i }));
      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
    });

    it('should call authService.resetPassword with email, token, and new password', async () => {
      const { authMock, user } = await setup();
      await user.type(screen.getByLabelText('New password'), 'newpass123');
      await user.type(screen.getByLabelText('Confirm new password'), 'newpass123');
      await user.click(screen.getByRole('button', { name: /reset password/i }));
      expect(authMock.resetPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        token: 'valid-token',
        newPassword: 'newpass123',
      });
    });

    it('should show success card after password is reset', async () => {
      const { user } = await setup();
      await user.type(screen.getByLabelText('New password'), 'newpass123');
      await user.type(screen.getByLabelText('Confirm new password'), 'newpass123');
      await user.click(screen.getByRole('button', { name: /reset password/i }));
      expect(screen.getByRole('heading', { name: /^password reset$/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /go to login/i })).toBeInTheDocument();
    });

    it('should show "invalid or expired" message and a new-link CTA on 400 response', async () => {
      const authMock = createAuthServiceMock();
      authMock.resetPassword.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 400 })),
      );
      const { user } = await setup(VALID_PARAMS, authMock);
      await user.type(screen.getByLabelText('New password'), 'newpass123');
      await user.type(screen.getByLabelText('Confirm new password'), 'newpass123');
      await user.click(screen.getByRole('button', { name: /reset password/i }));
      expect(screen.getByRole('alert')).toHaveTextContent('invalid or has expired');
      expect(screen.getByRole('link', { name: /request a new link/i })).toBeInTheDocument();
    });

    it('should show server error message and a new-link CTA on 5xx response', async () => {
      const authMock = createAuthServiceMock();
      authMock.resetPassword.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 500 })),
      );
      const { user } = await setup(VALID_PARAMS, authMock);
      await user.type(screen.getByLabelText('New password'), 'newpass123');
      await user.type(screen.getByLabelText('Confirm new password'), 'newpass123');
      await user.click(screen.getByRole('button', { name: /reset password/i }));
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Something went wrong on our end. Please try again later.',
      );
      expect(screen.getByRole('link', { name: /request a new link/i })).toBeInTheDocument();
    });

    it('should render a back to login link', async () => {
      await setup();
      expect(screen.getByRole('link', { name: /back to login/i })).toBeInTheDocument();
    });
  });
});