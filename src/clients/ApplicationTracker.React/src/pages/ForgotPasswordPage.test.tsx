import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {createMemoryRouter, RouterProvider} from 'react-router';
import {describe, it, expect, vi, beforeEach} from 'vitest';
import {ForgotPasswordPage} from './ForgotPasswordPage';

vi.mock('@/api/auth', () => ({
  forgotPassword: vi.fn(),
}));

import {forgotPassword} from '@/api/auth';

const mockForgotPassword = vi.mocked(forgotPassword);

function renderForgotPasswordPage() {
  const router = createMemoryRouter(
    [
      {path: '/forgot-password', element: <ForgotPasswordPage />},
      {path: '/login', element: <p>Login</p>},
    ],
    {initialEntries: ['/forgot-password']},
  );

  render(<RouterProvider router={router} />);
}

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders the email form', () => {
    renderForgotPasswordPage();

    expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /send reset link/i})).toBeInTheDocument();
  });

  it('shows a validation error when submitting with an empty email', async () => {
    const user = userEvent.setup();
    renderForgotPasswordPage();

    await user.click(screen.getByRole('button', {name: /send reset link/i}));

    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(mockForgotPassword).not.toHaveBeenCalled();
  });

  it('shows success card after a successful submission', async () => {
    const user = userEvent.setup();
    mockForgotPassword.mockResolvedValue(
      'If this email is registered, you will receive a reset link shortly.',
    );
    renderForgotPasswordPage();

    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.click(screen.getByRole('button', {name: /send reset link/i}));

    await waitFor(() => {
      expect(screen.getByText('Check your email')).toBeInTheDocument();
    });
    expect(
      screen.getByText('If this email is registered, you will receive a reset link shortly.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', {name: /back to login/i})).toBeInTheDocument();
    expect(mockForgotPassword).toHaveBeenCalledWith({email: 'user@example.com'});
  });

  it('shows a server error when the request fails', async () => {
    const user = userEvent.setup();
    mockForgotPassword.mockRejectedValue(new Error('Too many requests. Please try again later.'));
    renderForgotPasswordPage();

    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.click(screen.getByRole('button', {name: /send reset link/i}));

    await waitFor(() => {
      expect(
        screen.getByText('Too many requests. Please try again later.'),
      ).toBeInTheDocument();
    });
    expect(screen.queryByText('Check your email')).not.toBeInTheDocument();
  });
});
