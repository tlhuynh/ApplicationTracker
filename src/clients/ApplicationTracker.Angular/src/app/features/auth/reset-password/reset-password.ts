import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ErrorStateMatcher } from '@angular/material/core';
import { FormGroupDirective, NgForm } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

class PasswordFieldErrorStateMatcher implements ErrorStateMatcher {
  public isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    return !!(control?.touched && (control.invalid || form?.hasError('passwordMismatch')));
  }
}

function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('newPassword')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return password && confirm && password !== confirm ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss',
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
export class ResetPassword {
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);

  private readonly email = this.route.snapshot.queryParamMap.get('email') ?? '';
  private readonly token = this.route.snapshot.queryParamMap.get('token') ?? '';

  /** True when required URL params are missing — renders an error state instead of the form. */
  protected readonly isMissingParams = !this.email || !this.token;

  protected readonly form = new FormGroup(
    {
      newPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(6)],
      }),
      confirmPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    { validators: passwordMatchValidator },
  );

  protected readonly isSubmitting = signal(false);
  protected readonly isSuccess = signal(false);
  protected readonly serverError = signal<string | null>(null);
  protected readonly passwordMismatchMatcher = new PasswordFieldErrorStateMatcher();

  protected getFieldError(field: 'newPassword' | 'confirmPassword'): string | null {
    const control = this.form.get(field);
    if (!control?.touched) return null;

    if (field === 'confirmPassword' && control.touched && this.form.hasError('passwordMismatch')) {
      return 'Passwords do not match';
    }

    if (!control.invalid) return null;
    if (control.hasError('required')) return 'This field is required';
    if (field === 'newPassword' && control.hasError('minlength')) {
      return 'Password must be at least 6 characters';
    }
    return null;
  }

  protected onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.serverError.set(null);
    this.isSubmitting.set(true);

    const { newPassword } = this.form.getRawValue();

    this.authService
      .resetPassword({ email: this.email, token: this.token, newPassword })
      .pipe(
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.isSuccess.set(true),
        error: (err: HttpErrorResponse) => {
          if (err.status === 400) {
            this.serverError.set('This reset link is invalid or has expired. Please request a new one.');
          } else if (err.status >= 500 || err.status === 405) {
            this.serverError.set('Something went wrong on our end. Please try again later.');
          } else {
            this.serverError.set('Unable to reach the server. Please check your connection.');
          }
        },
      });
  }
}