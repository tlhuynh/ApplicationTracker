import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Login page component.
 *
 * Uses Angular Reactive Forms for validation and Angular Material for UI.
 * On successful login, AuthService stores the tokens and navigates to home.
 * The guestGuard in app.routes.ts redirects authenticated users away from this page.
 */
@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
  ],
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  /**
   * DestroyRef is used with takeUntilDestroyed to automatically cancel
   * the login subscription if the component is destroyed mid-request.
   */
  private readonly destroyRef = inject(DestroyRef);

  // ── Form ──────────────────────────────────────────────────────────────────

  /**
   * Reactive form with built-in Angular validators.
   * Validators.required and Validators.email run on every value change —
   * no manual validate() function needed unlike the React implementation.
   */
  protected readonly loginForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    rememberMe: new FormControl(false, { nonNullable: true }),
  });

  // ── Signals ───────────────────────────────────────────────────────────────

  /** True while the login request is in flight — disables the form and shows a spinner. */
  protected readonly isSubmitting = signal(false);

  /** Server-side error message to display above the form, or null when no error. */
  protected readonly serverError = signal<string | null>(null);

  // ── Helpers ───────────────────────────────────────────────────────────────

  /**
   * Returns the error message for a given form field, or null if the field is
   * valid or has not been touched yet. Only shows errors after the user has
   * interacted with the field (touched) to avoid premature validation messages.
   */
  protected getFieldError(field: 'email' | 'password'): string | null {
    const control = this.loginForm.get(field);

    if (!control?.touched || !control.invalid) {
      return null;
    }

    if (control.hasError('required')) {
      return `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
    }

    if (field === 'email' && control.hasError('email')) {
      return 'Enter a valid email address';
    }

    return null;
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  /**
   * Handles form submission.
   *
   * Marks all fields as touched first to trigger validation display,
   * then calls AuthService.login() if the form is valid.
   * finalize() ensures isSubmitting is reset whether the request succeeds or fails.
   * takeUntilDestroyed() cancels the subscription if the component is destroyed.
   */
  protected onSubmit(): void {
    // Trigger validation messages on all fields before checking validity
    this.loginForm.markAllAsTouched();

    if (this.loginForm.invalid) {
      return;
    }

    this.serverError.set(null);
    this.isSubmitting.set(true);

    const { email, password, rememberMe } = this.loginForm.getRawValue();

    this.authService
      .login({ email, password, rememberMe })
      .pipe(
        /** Always reset the loading state, regardless of success or failure. */
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => this.router.navigate(['/']),
        error: (err: HttpErrorResponse) => this.handleError(err),
      });
  }

  /**
   * Maps HTTP error responses to user-facing messages.
   *
   * 403 — email not confirmed
   * 5xx / 405 — generic server error (avoid leaking internal details)
   * 4xx — pass through the API's message directly
   * No status (network error) — connection error message
   */
  private handleError(err: HttpErrorResponse): void {
    if (err.status === 403) {
      this.serverError.set('Your email address has not been confirmed. Please check your inbox.');
    } else if (err.status >= 500 || err.status === 405) {
      this.serverError.set('Something went wrong on our end. Please try again later.');
    } else if (err.status > 0) {
      // err.error contains the plain-text response body from our API
      this.serverError.set(err.error || 'Login failed. Please try again.');
    } else {
      this.serverError.set('Unable to reach the server. Please check your connection.');
    }
  }
}
