import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ApplicationRecordDto,
  CreateApplicationRecordRequest,
} from '../../../core/api/api.types';
import { ApplicationService } from '../../../core/services/application.service';
import { extractErrorMessage } from '../../../core/utils/http-error';

/** Rejects non-empty values that are not valid http/https URLs. */
function urlValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value as string;
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return { invalidUrl: true };
    if (!url.hostname.includes('.')) return { invalidUrl: true };
    return null;
  } catch {
    return { invalidUrl: true };
  }
}

/**
 * Parses an ISO date string into a local-timezone Date for the datepicker.
 * Using `new Date(isoString)` directly would interpret UTC midnight as the
 * previous day in negative-offset timezones — extracting the YYYY-MM-DD parts
 * and constructing a local Date avoids that off-by-one issue.
 */
function parseLocalDate(isoString: string): Date {
  const [year, month, day] = isoString.substring(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** Status option used to populate the status dropdown. */
interface StatusOption {
  value: number;
  label: string;
}

/** Data passed when opening the dialog. Omit `record` to open in create mode. */
export interface ApplicationDialogData {
  record?: ApplicationRecordDto;
}

/**
 * Dialog component for creating and editing application records.
 *
 * Opens in create mode when no `record` is passed, and in edit mode when one is provided.
 * On a successful save the dialog closes and passes the saved entity back to the caller.
 * The parent component (Home) handles updating the local list from the returned value.
 */
@Component({
  selector: 'app-application-dialog',
  templateUrl: './application-dialog.html',
  styleUrl: './application-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
  ],
})
export class ApplicationDialog implements OnInit {
  protected readonly data = inject<ApplicationDialogData>(MAT_DIALOG_DATA);
  private readonly _dialogRef = inject(MatDialogRef<ApplicationDialog>);
  private readonly _applicationsService = inject(ApplicationService);
  private readonly _destroyRef = inject(DestroyRef);

  /** True when an existing record was passed — switches the dialog to edit mode. */
  protected readonly isEditing = !!this.data.record;

  /** Status options for the dropdown — mirrors the backend ApplicationStatus enum. */
  protected readonly statusOptions: StatusOption[] = [
    { value: 0, label: 'Applied' },
    { value: 1, label: 'Interviewing' },
    { value: 2, label: 'Offered' },
    { value: 3, label: 'Rejected' },
    { value: 4, label: 'Withdrawn' },
  ];

  // ── Form ──────────────────────────────────────────────────────────────────

  protected readonly form = new FormGroup({
    companyName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    status: new FormControl<number>(0, { nonNullable: true }),
    /** Datepicker uses a Date object; defaults to today for new records. */
    appliedDate: new FormControl<Date | null>(new Date()),
    postingUrl: new FormControl<string>('', { nonNullable: true, validators: [urlValidator] }),
    notes: new FormControl<string>('', { nonNullable: true, validators: [Validators.maxLength(5000)] }),
    description: new FormControl<string>('', { nonNullable: true, validators: [Validators.maxLength(20000)] }),
  });

  // ── Signals ───────────────────────────────────────────────────────────────

  /** Upper bound for the datepicker — prevents selecting future dates. */
  protected readonly today = new Date();

  /** True while the save request is in flight — disables the form and shows a spinner. */
  protected readonly isSubmitting = signal(false);

  /** Server-side error message displayed inside the dialog, or null when no error. */
  protected readonly serverError = signal<string | null>(null);

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  /** Pre-populates the form when editing an existing record. */
  public ngOnInit(): void {
    const record = this.data.record;
    if (!record) return;

    this.form.patchValue({
      companyName: record.companyName ?? '',
      status: record.status ?? 0,
      appliedDate: record.appliedDate ? parseLocalDate(record.appliedDate) : null,
      postingUrl: record.postingUrl ?? '',
      notes: record.notes ?? '',
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  /** Returns the validation error for companyName, or null if valid or untouched. */
  protected getCompanyNameError(): string | null {
    const control = this.form.get('companyName');
    if (!control?.touched || !control.invalid) return null;
    if (control.hasError('required')) return 'Company name is required';
    return null;
  }

  /** Returns the validation error for postingUrl, or null if valid or untouched. */
  protected getPostingUrlError(): string | null {
    const control = this.form.get('postingUrl');
    if (!control?.touched || !control.invalid) return null;
    if (control.hasError('invalidUrl')) return 'Enter a valid URL (e.g. https://example.com/job)';
    return null;
  }

  /** Returns the validation error for notes, or null if valid or untouched. */
  protected getNotesError(): string | null {
    const control = this.form.get('notes');
    if (!control?.touched || !control.invalid) return null;
    if (control.hasError('maxlength')) return 'Notes cannot exceed 5000 characters';
    return null;
  }

  /** Current character count for the notes field. */
  protected get notesLength(): number {
    return this.form.get('notes')?.value.length ?? 0;
  }

  /** Returns the validation error for description, or null if valid or untouched. */
  protected getDescriptionError(): string | null {
    const control = this.form.get('description');
    if (!control?.touched || !control.invalid) return null;
    if (control.hasError('maxlength')) return 'Description cannot exceed 20000 characters';
    return null;
  }

  /** Current character count for the description field. */
  protected get descriptionLength(): number {
    return this.form.get('description')?.value.length ?? 0;
  }

  // ── Posting URL focus helpers ──────────────────────────────────────────────

  /** Pre-fills 'https://' when the field is focused and empty. */
  protected onPostingUrlFocus(): void {
    const control = this.form.get('postingUrl');
    if (!control?.value) {
      control?.setValue('https://');
    }
  }

  /** Clears the field on blur if the user left it as just 'https://'. */
  protected onPostingUrlBlur(): void {
    const control = this.form.get('postingUrl');
    if (control?.value === 'https://') {
      control.setValue('');
    }
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  /** Submits the form — calls create or update based on whether we are editing. */
  protected onSave(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.serverError.set(null);
    this.isSubmitting.set(true);
    this._dialogRef.disableClose = true;

    const { companyName, status, appliedDate, postingUrl, notes, description } = this.form.getRawValue();

    /**
     * Convert the local Date to UTC midnight so the backend receives a consistent
     * ISO string regardless of the user's timezone. Date.UTC extracts the local
     * year/month/day and builds a UTC midnight timestamp from them.
     */
    const request: CreateApplicationRecordRequest = {
      companyName,
      status,
      appliedDate: appliedDate
        ? new Date(
            Date.UTC(appliedDate.getFullYear(), appliedDate.getMonth(), appliedDate.getDate()),
          ).toISOString()
        : null,
      postingUrl: postingUrl || null,
      notes: notes || null,
      description: description || null,
    };

    const record = this.data.record;
    const id =
      record?.id != null
        ? typeof record.id === 'string'
          ? parseInt(record.id, 10)
          : record.id
        : null;

    const operation =
      this.isEditing && id != null
        ? this._applicationsService.update(id, request)
        : this._applicationsService.create(request);

    operation.pipe(takeUntilDestroyed(this._destroyRef)).subscribe({
      next: (saved) => {
        this.isSubmitting.set(false);
        this._dialogRef.disableClose = false;
        this._dialogRef.close(saved);
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        this._dialogRef.disableClose = false;
        this.handleError(err);
      },
    });
  }

  /** Maps HTTP error responses to user-facing messages shown inside the dialog. */
  private handleError(err: HttpErrorResponse): void {
    if (err.status >= 500 || err.status === 405) {
      this.serverError.set('Something went wrong on our end. Please try again later.');
    } else if (err.status > 0) {
      this.serverError.set(extractErrorMessage(err, 'Save failed. Please try again.'));
    } else {
      this.serverError.set('Unable to reach the server. Please check your connection.');
    }
  }
}
