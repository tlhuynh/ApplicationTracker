import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { ConfirmDialog, ConfirmDialogData } from '../../shared/confirm-dialog/confirm-dialog';

/**
 * Shell component — the persistent app layout for authenticated users.
 *
 * Provides the sidebar navigation, top toolbar, and a router-outlet
 * where child routes (home, import) render. Only mounted when the user
 * is authenticated (enforced by authGuard in app.routes.ts).
 */
@Component({
  selector: 'app-shell',
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
})
export class ShellComponent implements OnInit {
  protected readonly authService = inject(AuthService);
  protected readonly themeService = inject(ThemeService);
  private readonly _breakpointObserver = inject(BreakpointObserver);
  private readonly _dialog = inject(MatDialog);

  protected readonly sidenav = viewChild.required<MatSidenav>('sidenav');

  /** True when the viewport is narrower than the Handset breakpoint (~960px). */
  protected readonly isMobile = signal(false);

  protected readonly navItems = [
    { label: 'Dashboard', icon: 'dashboard', route: '/' },
    { label: 'Import', icon: 'upload_file', route: '/import' },
  ];

  public ngOnInit(): void {
    this._breakpointObserver
      .observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
      .subscribe((result) => {
        this.isMobile.set(result.matches);
        // Start open on desktop, closed on mobile
        if (result.matches) {
          this.sidenav().close();
        } else {
          this.sidenav().open();
        }
      });
  }

  protected toggleSidenav(): void {
    this.sidenav().toggle();
  }

  protected confirmLogout(): void {
    const ref = this._dialog.open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, {
      data: {
        title: 'Log Out',
        message: 'Are you sure you want to log out?',
        confirmLabel: 'Log Out',
      },
    });

    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) this.authService.logout();
    });
  }
}
