import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { AuthService } from '../../../core/services/auth.service';
import { Login } from './login';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

/**
 * Creates a minimal AuthService mock.
 * login() returns an Observable by default — overridden per test as needed.
 */
function createAuthServiceMock() {
  return {
    login: vi.fn().mockReturnValue(of({})),
    isAuthenticated: vi.fn().mockReturnValue(false),
  };
}

describe('Login', () => {
  /** Renders the Login component with all required providers. */
  async function setup(authMock = createAuthServiceMock()) {
    await render(Login, {
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        /**
         * provideHttpClient + provideHttpClientTesting are required because
         * AuthService injects HttpClient, even though we mock AuthService here.
         * Angular's DI still resolves HttpClient for the service factory.
         */
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authMock },
      ],
    });
    return { authMock, user: userEvent.setup() };
  }

  it('should render the login form', async () => {
    await setup();
    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument();
  });

  it('should show validation errors when submitting empty form', async () => {
    const { user } = await setup();

    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
  });

  it('should show email format error for invalid email', async () => {
    const { user } = await setup();

    await user.type(screen.getByLabelText('Email address'), 'notanemail');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(screen.getByText('Enter a valid email address')).toBeInTheDocument();
  });

  it('should call authService.login with form values on valid submission', async () => {
    const { authMock, user } = await setup();

    await user.type(screen.getByLabelText('Email address'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(authMock.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
      rememberMe: false,
    });
  });

  it('should display server error message on failed login', async () => {
    const authMock = createAuthServiceMock();
    authMock.login.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            error: 'Invalid email or password.',
          })
      )
    );
    const { user } = await setup(authMock);

    await user.type(screen.getByLabelText('Email address'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Invalid email or password.');
  });

  it('should show generic error for 5xx responses', async () => {
    const authMock = createAuthServiceMock();
    authMock.login.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500 }))
    );
    const { user } = await setup(authMock);

    await user.type(screen.getByLabelText('Email address'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Something went wrong on our end. Please try again later.'
    );
  });

  it('should render a link to the register page', async () => {
    await setup();
    expect(screen.getByRole('link', { name: 'Register' })).toBeInTheDocument();
  });
});
