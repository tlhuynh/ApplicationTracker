import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
})
export class ForgotPassword {
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
  });

  protected readonly isSubmitting = signal(false);
  protected readonly isSubmitted = signal(false);
  protected readonly serverError = signal<string | null>(null);

  protected getEmailError(): string | null {
    const control = this.form.get('email');
    if (!control?.touched || !control.invalid) return null;
    if (control.hasError('required')) return 'Email is required';
    if (control.hasError('email')) return 'Enter a valid email address';
    return null;
  }

  protected onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.serverError.set(null);
    this.isSubmitting.set(true);

    this.authService
      .forgotPassword({ email: this.form.getRawValue().email })
      .pipe(
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.isSubmitted.set(true),
        error: (err: HttpErrorResponse) => {
          if (err.status >= 500 || err.status === 405) {
            this.serverError.set('Something went wrong on our end. Please try again later.');
          } else {
            this.serverError.set('Unable to reach the server. Please check your connection.');
          }
        },
      });
  }
}