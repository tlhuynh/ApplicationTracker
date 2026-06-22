import { render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfirmEmailPage } from './ConfirmEmailPage';

vi.mock('@/api/auth', () => ({
  confirmEmail: vi.fn(),
}));

import { confirmEmail } from '@/api/auth';

const mockConfirmEmail = vi.mocked(confirmEmail);

function renderConfirmEmailPage(search: string = '') {
  const router = createMemoryRouter(
    [
      { path: '/confirm-email', element: <ConfirmEmailPage /> },
      { path: '/login', element: <p>Login</p> },
    ],
    { initialEntries: [`/confirm-email${search}`] },
  );

  render(<RouterProvider router={router} />);

  return { router };
}

describe('ConfirmEmailPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('shows an error immediately when userId is missing', () => {
    renderConfirmEmailPage('?token=sometoken');

    expect(screen.getByText('Confirmation failed')).toBeInTheDocument();
    expect(screen.getByText(/invalid or incomplete/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to Login' })).toBeInTheDocument();
    expect(mockConfirmEmail).not.toHaveBeenCalled();
  });

  it('shows an error immediately when token is missing', () => {
    renderConfirmEmailPage('?userId=some-user-id');

    expect(screen.getByText('Confirmation failed')).toBeInTheDocument();
    expect(screen.getByText(/invalid or incomplete/i)).toBeInTheDocument();
    expect(mockConfirmEmail).not.toHaveBeenCalled();
  });

  it('shows an error immediately when both params are missing', () => {
    renderConfirmEmailPage();

    expect(screen.getByText('Confirmation failed')).toBeInTheDocument();
    expect(mockConfirmEmail).not.toHaveBeenCalled();
  });

  it('shows success when confirmation succeeds', async () => {
    mockConfirmEmail.mockResolvedValue('Email confirmed successfully. You can now log in.');
    renderConfirmEmailPage('?userId=some-user-id&token=some-token');

    await waitFor(() => {
      expect(screen.getByText('Email confirmed')).toBeInTheDocument();
    });

    expect(screen.getByText('Email confirmed successfully. You can now log in.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to Login' })).toBeInTheDocument();
  });

  it('shows an error when confirmation fails', async () => {
    mockConfirmEmail.mockRejectedValue(new Error('Invalid or expired confirmation token.'));
    renderConfirmEmailPage('?userId=some-user-id&token=bad-token');

    await waitFor(() => {
      expect(screen.getByText('Confirmation failed')).toBeInTheDocument();
    });

    expect(screen.getByText('Invalid or expired confirmation token.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to Login' })).toBeInTheDocument();
  });
});