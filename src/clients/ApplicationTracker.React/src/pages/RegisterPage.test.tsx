import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthContext, type AuthContextState } from '@/hooks/use-auth';
import { RegisterPage } from './RegisterPage';

/** Creates a router with RegisterPage at /register and a dummy login route at /login */
function renderRegisterPage(authOverrides: Partial<AuthContextState> = {}) {
  const authValue: AuthContextState = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    ...authOverrides,
  };

  const router = createMemoryRouter(
    [
      { path: '/register', element: <RegisterPage /> },
      { path: '/login', element: <p>Login Page</p> },
    ],
    { initialEntries: ['/register'] },
  );

  render(
    <AuthContext.Provider value={authValue}>
      <RouterProvider router={router} />
    </AuthContext.Provider>,
  );

  return { authValue, router };
}

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders the registration form', () => {
    renderRegisterPage();

    expect(screen.getByText('Register', { selector: '[data-slot="card-title"]' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Register' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Login' })).toHaveAttribute('href', '/login');
  });

  it('shows validation errors when submitting empty form', async () => {
    const user = userEvent.setup();
    renderRegisterPage();

    await user.click(screen.getByRole('button', { name: 'Register' }));

    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(screen.getByText('Please confirm your password')).toBeInTheDocument();
  });

  it('shows error when password is too short', async () => {
    const user = userEvent.setup();
    renderRegisterPage();

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), '12345');
    await user.type(screen.getByLabelText('Confirm Password'), '12345');
    await user.click(screen.getByRole('button', { name: 'Register' }));

    expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
  });

  it('shows error when passwords do not match', async () => {
    const user = userEvent.setup();
    renderRegisterPage();

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm Password'), 'different');
    await user.click(screen.getByRole('button', { name: 'Register' }));

    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
  });

  it('calls register and shows confirmation message on success', async () => {
    const user = userEvent.setup();
    const mockRegister = vi.fn().mockResolvedValue(undefined);
    renderRegisterPage({ register: mockRegister });

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Register' }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    expect(screen.getByText('Check your email')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to Login' })).toHaveAttribute('href', '/login');
  });

  it('displays server error when registration fails', async () => {
    const user = userEvent.setup();
    const mockRegister = vi.fn().mockRejectedValue(new Error('Email already taken'));
    renderRegisterPage({ register: mockRegister });

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Register' }));

    await waitFor(() => {
      expect(screen.getByText('Email already taken')).toBeInTheDocument();
    });
  });
});
