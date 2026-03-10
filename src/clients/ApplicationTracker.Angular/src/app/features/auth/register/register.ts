import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  FormGroupDirective,
  NgForm,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { ErrorStateMatcher } from '@angular/material/core';

/**
 * Custom ErrorStateMatcher for the confirmPassword field.
 * Angular Material only shows mat-error when the control itself is invalid.
 * This matcher additionally triggers the error state when the parent form group
 * has a passwordMismatch error, so the error renders even though confirmPassword's
 * own required validator passes.
 */
class PasswordFieldErrorStateMatcher implements ErrorStateMatcher {
  public isErrorState(
    control: FormControl | null,
    form: FormGroupDirective | NgForm | null
  ): boolean {
    return !!(control?.touched && (control.invalid || form?.hasError('passwordMismatch')));
  }
}

/**
 * Cross-field validator applied at the form group level.
 * Checks that the password and confirmPassword fields have the same value.
 * Returns a { passwordMismatch: true } error on the group when they differ.
 */
function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;

  // Only validate when both fields have values — avoids premature errors
  return password && confirmPassword && password !== confirmPassword
    ? { passwordMismatch: true }
    : null;
}

/**
 * Registration page component.
 *
 * On successful registration the backend sends a confirmation email —
 * the component switches to a "Check your email" success card.
 * The guestGuard in app.routes.ts redirects authenticated users away from this page.
 */
@Component({
  selector: 'app-register',
  templateUrl: './register.html',
  styleUrl: './register.scss',
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
export class Register {
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  // ── Form ──────────────────────────────────────────────────────────────────

  /**
   * Registration form with three fields.
   * passwordMatchValidator is applied at the group level to compare
   * password and confirmPassword across fields.
   */
  protected readonly registerForm = new FormGroup(
    {
      email: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.email],
      }),
      password: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(6)],
      }),
      confirmPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    { validators: passwordMatchValidator }
  );

  // ── Signals ───────────────────────────────────────────────────────────────

  /** True while the registration request is in flight. */
  protected readonly isSubmitting = signal(false);

  /** Server-side error message, or null when no error. */
  protected readonly serverError = signal<string | null>(null);

  /**
   * Switches the view to the success card after registration completes.
   * Stores the submitted email to display in the success message.
   */
  protected readonly isRegistered = signal(false);
  protected readonly registeredEmail = signal('');

  // ── Additional Form Validator ───────────────────────────────────────────────────────────────

  /**
   * Passed to the confirmPassword mat-form-field via [errorStateMatcher].
   * Triggers the error display when the group has a passwordMismatch error.
   */
  protected readonly passwordMismatchMatcher = new PasswordFieldErrorStateMatcher();

  // ── Helpers ───────────────────────────────────────────────────────────────

  /**
   * Returns the validation error message for a given field, or null if valid/untouched.
   * For confirmPassword, also checks the group-level passwordMismatch error.
   */
  protected getFieldError(field: 'email' | 'password' | 'confirmPassword'): string | null {
    const control = this.registerForm.get(field);

    if (!control?.touched || !control.invalid) {
      // Special case: confirmPassword needs to check the group-level error too
      if (field === 'confirmPassword' && control?.touched && this.registerForm.hasError('passwordMismatch')) {
        return 'Passwords do not match';
      }
      return null;
    }

    if (control.hasError('required')) {
      const labels: Record<string, string> = {
        email: 'Please enter an email',
        password: 'Please enter a password',
        confirmPassword: 'Please confirm your password',
      };
      return labels[field];
    }

    if (field === 'email' && control.hasError('email')) {
      return 'Enter a valid email address';
    }

    if (field === 'password' && control.hasError('minlength')) {
      return 'Password must be at least 6 characters';
    }

    if (field === 'confirmPassword' && this.registerForm.hasError('passwordMismatch')) {
      return 'Passwords do not match';
    }

    return null;
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  /** Handles form submission — registers the user and switches to success state on completion. */
  protected onSubmit(): void {
    this.registerForm.markAllAsTouched();

    if (this.registerForm.invalid) {
      return;
    }

    this.serverError.set(null);
    this.isSubmitting.set(true);

    const { email, password } = this.registerForm.getRawValue();

    this.authService
      .register({ email, password })
      .pipe(
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          // Store email before resetting form so success message can reference it
          this.registeredEmail.set(email);
          this.isRegistered.set(true);
        },
        error: (err: HttpErrorResponse) => this.handleError(err),
      });
  }

  /** Maps HTTP errors to user-facing messages. */
  private handleError(err: HttpErrorResponse): void {
    if (err.status >= 500 || err.status === 405) {
      this.serverError.set('Something went wrong on our end. Please try again later.');
    } else if (err.status > 0) {
      this.serverError.set(err.error || 'Registration failed. Please try again.');
    } else {
      this.serverError.set('Unable to reach the server. Please check your connection.');
    }
  }
}
