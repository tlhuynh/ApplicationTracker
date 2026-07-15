import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { provideNativeDateAdapter } from '@angular/material/core';
import { HttpErrorResponse } from '@angular/common/http';
import { InterviewService } from '../../../core/services/interview.service';
import { InterviewDto } from '../../../core/api/api.types';

export interface InterviewFormDialogData {
  applicationRecordId: number;
  companyName: string;
  interview?: InterviewDto;
}

interface InterviewForm {
  type: FormControl<number>;
  roundNumber: FormControl<number | null>;
  date: FormControl<Date | null>;
  outcome: FormControl<number | null>;
  notes: FormControl<string>;
}

export const INTERVIEW_TYPE_OPTIONS = [
  { value: 0, label: 'Screening' },
  { value: 1, label: 'Technical' },
  { value: 2, label: 'Onsite' },
  { value: 3, label: 'Other' },
];

export const INTERVIEW_OUTCOME_OPTIONS = [
  { value: 0, label: 'Pending' },
  { value: 1, label: 'Passed' },
  { value: 2, label: 'Failed' },
];

@Component({
  selector: 'app-interview-form-dialog',
  templateUrl: './interview-form-dialog.html',
  styleUrl: './interview-form-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideNativeDateAdapter()],
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
export class InterviewFormDialog implements OnInit {
  protected readonly data = inject<InterviewFormDialogData>(MAT_DIALOG_DATA);
  private readonly _dialogRef = inject(MatDialogRef<InterviewFormDialog, InterviewDto>);
  private readonly _interviewService = inject(InterviewService);

  protected readonly isEditMode = !!this.data.interview;
  protected readonly isSaving = signal(false);
  protected readonly serverError = signal<string | null>(null);

  protected readonly typeOptions = INTERVIEW_TYPE_OPTIONS;
  protected readonly outcomeOptions = INTERVIEW_OUTCOME_OPTIONS;
  protected readonly notesMaxLength = 5000;
  protected get notesLength(): number { return this.form.controls.notes.value.length; }

  protected readonly form = new FormGroup<InterviewForm>({
    type: new FormControl<number>(0, { nonNullable: true, validators: [Validators.required] }),
    roundNumber: new FormControl<number | null>(null, { validators: [Validators.min(1)] }),
    date: new FormControl<Date | null>(null, { validators: [Validators.required] }),
    outcome: new FormControl<number | null>(null),
    notes: new FormControl<string>('', { nonNullable: true, validators: [Validators.maxLength(5000)] }),
  });

  public ngOnInit(): void {
    if (this.data.interview) {
      const i = this.data.interview;
      this.form.setValue({
        type: (i.type as number) ?? 0,
        roundNumber: (i.roundNumber as number | null) ?? null,
        date: i.date ? new Date(i.date) : null,
        outcome: i.outcome != null ? (i.outcome as number) : null,
        notes: i.notes ?? '',
      });
    }
  }

  protected onSubmit(): void {
    if (this.form.invalid) return;

    this.isSaving.set(true);
    this.serverError.set(null);

    const value = this.form.getRawValue();
    const d = value.date!;
    const request = {
      type: value.type,
      roundNumber: value.roundNumber ?? undefined,
      date: new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString(),
      outcome: value.outcome ?? undefined,
      notes: value.notes || undefined,
    };

    const op$ = this.isEditMode
      ? this._interviewService.update(this.data.applicationRecordId, this.data.interview!.id as number, request)
      : this._interviewService.create(this.data.applicationRecordId, request);

    op$.subscribe({
      next: (saved) => {
        this.isSaving.set(false);
        this._dialogRef.close(saved);
      },
      error: (err: HttpErrorResponse) => {
        this.isSaving.set(false);
        this.serverError.set(
          err.status === 0
            ? 'Unable to reach the server. Please check your connection.'
            : err.status >= 500
              ? 'Something went wrong on our end. Please try again later.'
              : (err.error as string) ?? 'An error occurred.',
        );
      },
    });
  }
}