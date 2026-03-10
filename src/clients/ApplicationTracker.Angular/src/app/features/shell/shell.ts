import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/services/auth.service';

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
  ],
})
export class ShellComponent {
  /** Provides currentUser signal and logout action. */
  protected readonly authService = inject(AuthService);

  /** Navigation items rendered in the sidebar. */
  protected readonly navItems = [
    { label: 'Dashboard', icon: 'dashboard', route: '/' },
    { label: 'Import', icon: 'upload_file', route: '/import' },
  ];
}
