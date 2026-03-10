import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { ShellComponent } from './shell';
import { AuthService } from '../../core/services/auth.service';
import { signal } from '@angular/core';

/**
 * Creates a minimal AuthService mock with controllable signals.
 * Avoids spinning up the real service and its HttpClient dependency.
 */
function createAuthServiceMock() {
  return {
    currentUser: signal<string | null>('test@example.com'),
    isAuthenticated: signal(true),
    logout: vi.fn(),
  };
}

describe('ShellComponent', () => {
  /**
   * Helper that renders ShellComponent with required providers.
   * provideRouter([]) is needed because RouterLink and RouterLinkActive
   * require a router context to function.
   */
  async function setup(authMock = createAuthServiceMock()) {
    await render(ShellComponent, {
      providers: [
        provideRouter([]),
        /**
         * Angular Material components require animations to be configured.
         * provideNoopAnimations() disables animations in tests so Material
         * components render their content immediately without animation delays.
         */
        provideNoopAnimations(),
        { provide: AuthService, useValue: authMock },
      ],
    });
    return { authMock };
  }

  it('should render the app title in the sidebar', async () => {
    await setup();
    expect(screen.getByText('Job Application Tracker')).toBeInTheDocument();
  });

  it('should render all navigation items', async () => {
    await setup();
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Import' })).toBeInTheDocument();
  });

  it('should display the current user email in the toolbar', async () => {
    await setup();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('should call logout when the logout button is clicked', async () => {
    const { authMock } = await setup();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Log out' }));

    expect(authMock.logout).toHaveBeenCalledOnce();
  });

  it('should render the router outlet for child routes', async () => {
    await setup();
    expect(document.querySelector('router-outlet')).toBeInTheDocument();
  });
});
