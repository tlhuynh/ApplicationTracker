import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-confirm-email',
  templateUrl: './confirm-email.html',
  styleUrl: './confirm-email.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatCardModule, MatButtonModule, MatProgressSpinnerModule],
})
export class ConfirmEmail {
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  private readonly userId = this.route.snapshot.queryParamMap.get('userId') ?? '';
  private readonly token = this.route.snapshot.queryParamMap.get('token') ?? '';

  protected readonly isMissingParams = !this.userId || !this.token;
  protected readonly status = signal<'loading' | 'success' | 'error'>(
    this.isMissingParams ? 'error' : 'loading',
  );
  protected readonly message = signal<string | null>(null);

  public constructor() {
    if (this.isMissingParams) return;

    this.authService
      .confirmEmail({ userId: this.userId, token: this.token })
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: () => this.status.set('success'),
        error: (err: HttpErrorResponse) => {
          if (err.status === 400) {
            this.message.set('This confirmation link is invalid or has already been used.');
          } else if (err.status >= 500 || err.status === 405) {
            this.message.set('Something went wrong on our end. Please try again later.');
          } else {
            this.message.set('Unable to reach the server. Please check your connection.');
          }
          this.status.set('error');
        },
      });
  }
}