import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, it, expect, vi } from 'vitest';
import { AuthContext, type AuthContextState } from '@/hooks/use-auth';
import { ProtectedRoute } from './ProtectedRoute';

/** Creates a router with ProtectedRoute guarding a child route, and a /login route for redirects */
function renderProtectedRoute(authOverrides: Partial<AuthContextState> = {}) {
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
      {
        element: <ProtectedRoute />,
        children: [{ path: '/', element: <p>Protected Content</p> }],
      },
      { path: '/login', element: <p>Login Page</p> },
    ],
    { initialEntries: ['/'] },
  );

  render(
    <AuthContext.Provider value={authValue}>
      <RouterProvider router={router} />
    </AuthContext.Provider>,
  );

  return { router };
}

describe('ProtectedRoute', () => {
  it('shows loading state while session is being restored', () => {
    renderProtectedRoute({ isLoading: true });

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });

  it('redirects to /login when not authenticated', () => {
    const { router } = renderProtectedRoute({ isAuthenticated: false, isLoading: false });

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
  });

  it('renders child content when authenticated', () => {
    renderProtectedRoute({ isAuthenticated: true, isLoading: false, user: 'test@example.com' });

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
