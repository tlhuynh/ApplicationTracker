import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { of } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ShellComponent } from './shell';
import { AuthService } from '../../core/services/auth.service';
import { signal } from '@angular/core';

function createAuthServiceMock() {
  return {
    currentUser: signal<string | null>('test@example.com'),
    isAuthenticated: signal(true),
    logout: vi.fn(),
  };
}

function createDialogMock(confirmed: boolean) {
  return {
    open: vi.fn().mockReturnValue({
      afterClosed: vi.fn().mockReturnValue(of(confirmed)),
    }),
  };
}

describe('ShellComponent', () => {
  async function setup(authMock = createAuthServiceMock(), dialogMock = createDialogMock(true)) {
    await render(ShellComponent, {
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: AuthService, useValue: authMock },
        { provide: MatDialog, useValue: dialogMock },
      ],
    });
    return { authMock, dialogMock };
  }

  it('should render the app title in the sidebar', async () => {
    await setup();
    expect(screen.getByText('Job Apps Tracker')).toBeInTheDocument();
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

  it('should call logout when the logout button is clicked and confirmed', async () => {
    const { authMock } = await setup();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Log out' }));

    expect(authMock.logout).toHaveBeenCalledOnce();
  });

  it('should not call logout when the confirm dialog is dismissed', async () => {
    const { authMock } = await setup(createAuthServiceMock(), createDialogMock(false));
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Log out' }));

    expect(authMock.logout).not.toHaveBeenCalled();
  });

  it('should render the router outlet for child routes', async () => {
    await setup();
    expect(document.querySelector('router-outlet')).toBeInTheDocument();
  });
});
