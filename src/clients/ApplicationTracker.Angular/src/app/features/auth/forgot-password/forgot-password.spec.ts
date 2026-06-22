import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { ForgotPassword } from './forgot-password';

function createAuthServiceMock() {
  return {
    forgotPassword: vi.fn().mockReturnValue(of('')),
  };
}

describe('ForgotPassword', () => {
  async function setup(authMock = createAuthServiceMock()) {
    await render(ForgotPassword, {
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authMock },
      ],
    });
    return { authMock, user: userEvent.setup() };
  }

  it('should render the forgot password form', async () => {
    await setup();
    expect(screen.getByRole('heading', { name: /forgot password/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
  });

  it('should show validation error for empty email', async () => {
    const { user } = await setup();
    await user.click(screen.getByRole('button', { name: /send reset link/i }));
    expect(screen.getByText('Email is required')).toBeInTheDocument();
  });

  it('should show validation error for invalid email format', async () => {
    const { user } = await setup();
    await user.type(screen.getByLabelText('Email address'), 'notanemail');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));
    expect(screen.getByText('Enter a valid email address')).toBeInTheDocument();
  });

  it('should call authService.forgotPassword with the email on valid submission', async () => {
    const { authMock, user } = await setup();
    await user.type(screen.getByLabelText('Email address'), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));
    expect(authMock.forgotPassword).toHaveBeenCalledWith({ email: 'test@example.com' });
  });

  it('should show success card after successful submission', async () => {
    const { user } = await setup();
    await user.type(screen.getByLabelText('Email address'), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));
    expect(screen.getByRole('heading', { name: /check your email/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to login/i })).toBeInTheDocument();
  });

  it('should show server error on 5xx response', async () => {
    const authMock = createAuthServiceMock();
    authMock.forgotPassword.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500 })),
    );
    const { user } = await setup(authMock);
    await user.type(screen.getByLabelText('Email address'), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Something went wrong on our end. Please try again later.',
    );
  });

  it('should show generic error on network failure', async () => {
    const authMock = createAuthServiceMock();
    authMock.forgotPassword.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 0 })),
    );
    const { user } = await setup(authMock);
    await user.type(screen.getByLabelText('Email address'), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Unable to reach the server. Please check your connection.',
    );
  });

  it('should render a link back to the login page', async () => {
    await setup();
    expect(screen.getByRole('link', { name: /back to login/i })).toBeInTheDocument();
  });
});