import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { Register } from './register';

/** Creates a minimal AuthService mock with register returning success by default. */
function createAuthServiceMock() {
  return {
    register: vi.fn().mockReturnValue(of('Registration successful')),
  };
}

describe('Register', () => {
  async function setup(authMock = createAuthServiceMock()) {
    await render(Register, {
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

  it('should render the registration form', async () => {
    await setup();
    expect(screen.getByRole('heading', { name: /register/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create account' })).toBeInTheDocument();
  });

  it('should show validation errors when submitting empty form', async () => {
    const { user } = await setup();

    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(screen.getByText('Please enter an email')).toBeInTheDocument();
    expect(screen.getByText('Please enter a password')).toBeInTheDocument();
    expect(screen.getByText('Please confirm your password')).toBeInTheDocument();
  });

  it('should show error when passwords do not match', async () => {
    const { user } = await setup();

    await user.type(screen.getByLabelText('Email address'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm password'), 'different123');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
  });

  it('should show password length error for short passwords', async () => {
    const { user } = await setup();

    await user.type(screen.getByLabelText('Password'), 'abc');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
  });

  it('should call authService.register with email and password on valid submission', async () => {
    const { authMock, user } = await setup();

    await user.type(screen.getByLabelText('Email address'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(authMock.register).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('should show success card after registration', async () => {
    const { user } = await setup();

    await user.type(screen.getByLabelText('Email address'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(screen.getByRole('heading', { name: /check your email/i })).toBeInTheDocument();
    expect(screen.getByText(/test@example.com/)).toBeInTheDocument();
  });

  it('should show generic error for 5xx responses', async () => {
    const authMock = createAuthServiceMock();
    authMock.register.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500 }))
    );
    const { user } = await setup(authMock);

    await user.type(screen.getByLabelText('Email address'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Something went wrong on our end. Please try again later.'
    );
  });

  it('should render a link to the login page', async () => {
    await setup();
    expect(screen.getByRole('link', { name: 'Login' })).toBeInTheDocument();
  });
});
