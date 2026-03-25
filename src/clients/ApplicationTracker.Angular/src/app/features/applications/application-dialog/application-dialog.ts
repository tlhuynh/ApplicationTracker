import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ApplicationRecordDto,
  CreateApplicationRecordRequest,
} from '../../../core/api/api.types';
import { ApplicationsService } from '../../../core/services/applications.service';

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
    MatProgressSpinnerModule,
  ],
})
export class ApplicationDialog implements OnInit {
  protected readonly data = inject<ApplicationDialogData>(MAT_DIALOG_DATA);
  private readonly _dialogRef = inject(MatDialogRef<ApplicationDialog>);
  private readonly _applicationsService = inject(ApplicationsService);
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
    /** Stored as 'YYYY-MM-DD' string matching the HTML date input value format. */
    appliedDate: new FormControl<string>('', { nonNullable: true }),
    postingUrl: new FormControl<string>('', { nonNullable: true }),
    notes: new FormControl<string>('', { nonNullable: true }),
  });

  // ── Signals ───────────────────────────────────────────────────────────────

  /** True while the save request is in flight — disables the form and shows a spinner. */
  protected readonly isSubmitting = signal(false);

  /** Server-side error message displayed inside the dialog, or null when no error. */
  protected readonly serverError = signal<string | null>(null);

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  /**
   * Pre-populates the form when editing an existing record.
   * The appliedDate is trimmed to 'YYYY-MM-DD' format since the HTML date
   * input only accepts that format, not the full ISO-8601 datetime string.
   */
  public ngOnInit(): void {
    const record = this.data.record;
    if (!record) return;

    this.form.patchValue({
      companyName: record.companyName ?? '',
      status: record.status ?? 0,
      appliedDate: record.appliedDate ? record.appliedDate.substring(0, 10) : '',
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

  // ── Actions ───────────────────────────────────────────────────────────────

  /** Submits the form — calls create or update based on whether we are editing. */
  protected onSave(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.serverError.set(null);
    this.isSubmitting.set(true);
    /** Prevent the dialog from being closed while the request is in flight. */
    this._dialogRef.disableClose = true;

    const { companyName, status, appliedDate, postingUrl, notes } = this.form.getRawValue();

    /**
     * The HTML date input returns 'YYYY-MM-DD'. Appending 'T00:00:00.000Z' ensures
     * the Date constructor treats it as UTC midnight, matching the backend expectation.
     * An empty string means the field was left blank — send null (the field is optional).
     */
    const request: CreateApplicationRecordRequest = {
      companyName,
      status,
      appliedDate: appliedDate ? new Date(`${appliedDate}T00:00:00.000Z`).toISOString() : null,
      postingUrl: postingUrl || null,
      notes: notes || null,
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
        /** Close and pass the saved entity back so the parent can update its list. */
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
      this.serverError.set(err.error || 'Save failed. Please try again.');
    } else {
      this.serverError.set('Unable to reach the server. Please check your connection.');
    }
  }
}
