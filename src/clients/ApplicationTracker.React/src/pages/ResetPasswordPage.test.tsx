import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {createMemoryRouter, RouterProvider} from 'react-router';
import {describe, it, expect, vi, beforeEach} from 'vitest';
import {ResetPasswordPage} from './ResetPasswordPage';

vi.mock('@/api/auth', () => ({
  resetPassword: vi.fn(),
}));

import {resetPassword} from '@/api/auth';

const mockResetPassword = vi.mocked(resetPassword);

function renderResetPasswordPage(search: string = '') {
  const router = createMemoryRouter(
    [
      {path: '/reset-password', element: <ResetPasswordPage />},
      {path: '/login', element: <p>Login</p>},
      {path: '/forgot-password', element: <p>Forgot Password</p>},
    ],
    {initialEntries: [`/reset-password${search}`]},
  );

  render(<RouterProvider router={router} />);
}

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('shows an invalid link card when email is missing', () => {
    renderResetPasswordPage('?token=some-token');

    expect(screen.getByText('Invalid reset link')).toBeInTheDocument();
    expect(screen.getByRole('link', {name: /request new link/i})).toBeInTheDocument();
    expect(mockResetPassword).not.toHaveBeenCalled();
  });

  it('shows an invalid link card when token is missing', () => {
    renderResetPasswordPage('?email=user@example.com');

    expect(screen.getByText('Invalid reset link')).toBeInTheDocument();
    expect(mockResetPassword).not.toHaveBeenCalled();
  });

  it('shows an invalid link card when both params are missing', () => {
    renderResetPasswordPage();

    expect(screen.getByText('Invalid reset link')).toBeInTheDocument();
    expect(mockResetPassword).not.toHaveBeenCalled();
  });

  it('renders the reset form when both params are present', () => {
    renderResetPasswordPage('?email=user@example.com&token=some-token');

    expect(screen.getByText('Reset your password')).toBeInTheDocument();
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /reset password/i})).toBeInTheDocument();
  });

  it('shows validation errors when both fields are empty', async () => {
    const user = userEvent.setup();
    renderResetPasswordPage('?email=user@example.com&token=some-token');

    await user.click(screen.getByRole('button', {name: /reset password/i}));

    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(screen.getByText('Please confirm your password')).toBeInTheDocument();
    expect(mockResetPassword).not.toHaveBeenCalled();
  });

  it('shows a validation error when password is too short', async () => {
    const user = userEvent.setup();
    renderResetPasswordPage('?email=user@example.com&token=some-token');

    await user.type(screen.getByLabelText(/new password/i), 'abc');
    await user.type(screen.getByLabelText(/confirm password/i), 'abc');
    await user.click(screen.getByRole('button', {name: /reset password/i}));

    expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
    expect(mockResetPassword).not.toHaveBeenCalled();
  });

  it('shows a validation error when passwords do not match', async () => {
    const user = userEvent.setup();
    renderResetPasswordPage('?email=user@example.com&token=some-token');

    await user.type(screen.getByLabelText(/new password/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'different123');
    await user.click(screen.getByRole('button', {name: /reset password/i}));

    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    expect(mockResetPassword).not.toHaveBeenCalled();
  });

  it('shows success card after a successful reset', async () => {
    const user = userEvent.setup();
    mockResetPassword.mockResolvedValue('Your password has been reset. You can now log in.');
    renderResetPasswordPage('?email=user@example.com&token=some-token');

    await user.type(screen.getByLabelText(/new password/i), 'newpassword');
    await user.type(screen.getByLabelText(/confirm password/i), 'newpassword');
    await user.click(screen.getByRole('button', {name: /reset password/i}));

    await waitFor(() => {
      expect(screen.getByText('Password reset')).toBeInTheDocument();
    });
    expect(screen.getByText('Your password has been reset. You can now log in.')).toBeInTheDocument();
    expect(screen.getByRole('link', {name: /go to login/i})).toBeInTheDocument();
    expect(mockResetPassword).toHaveBeenCalledWith({
      email: 'user@example.com',
      token: 'some-token',
      newPassword: 'newpassword',
    });
  });

  it('shows a server error when the reset fails', async () => {
    const user = userEvent.setup();
    mockResetPassword.mockRejectedValue(new Error('Invalid or expired reset token.'));
    renderResetPasswordPage('?email=user@example.com&token=some-token');

    await user.type(screen.getByLabelText(/new password/i), 'newpassword');
    await user.type(screen.getByLabelText(/confirm password/i), 'newpassword');
    await user.click(screen.getByRole('button', {name: /reset password/i}));

    await waitFor(() => {
      expect(screen.getByText('Invalid or expired reset token.')).toBeInTheDocument();
    });
    expect(screen.queryByText('Password reset')).not.toBeInTheDocument();
  });
});
