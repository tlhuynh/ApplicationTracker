import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { InterviewService } from '../../../core/services/interview.service';
import { InterviewDto } from '../../../core/api/api.types';
import {
  InterviewFormDialog,
  InterviewFormDialogData,
  INTERVIEW_TYPE_OPTIONS,
  INTERVIEW_OUTCOME_OPTIONS,
} from '../interview-form-dialog/interview-form-dialog';
import { ConfirmDialog, ConfirmDialogData } from '../../../shared/confirm-dialog/confirm-dialog';

export interface InterviewDialogData {
  applicationRecordId: number;
  companyName: string;
}

@Component({
  selector: 'app-interview-dialog',
  templateUrl: './interview-dialog.html',
  styleUrl: './interview-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
})
export class InterviewDialog implements OnInit {
  protected readonly data = inject<InterviewDialogData>(MAT_DIALOG_DATA);
  private readonly _interviewService = inject(InterviewService);
  private readonly _dialog = inject(MatDialog);
  private readonly _destroyRef = inject(DestroyRef);

  protected readonly interviews = signal<InterviewDto[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly deletingId = signal<number | null>(null);

  private readonly _typeLabels: Record<number, string> = Object.fromEntries(
    INTERVIEW_TYPE_OPTIONS.map((o) => [o.value, o.label]),
  );
  private readonly _outcomeLabels: Record<number, string> = Object.fromEntries(
    INTERVIEW_OUTCOME_OPTIONS.map((o) => [o.value, o.label]),
  );

  public ngOnInit(): void {
    this._loadInterviews();
  }

  private _loadInterviews(): void {
    this.isLoading.set(true);
    this.loadError.set(null);

    this._interviewService
      .getAll(this.data.applicationRecordId)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (items) => {
          this.interviews.set(items);
          this.isLoading.set(false);
        },
        error: () => {
          this.loadError.set('Failed to load interviews. Please try again.');
          this.isLoading.set(false);
        },
      });
  }

  protected openAddDialog(): void {
    const ref = this._dialog.open<InterviewFormDialog, InterviewFormDialogData, InterviewDto>(
      InterviewFormDialog,
      {
        data: { applicationRecordId: this.data.applicationRecordId, companyName: this.data.companyName },
        width: '440px',
        maxWidth: '95vw',
        disableClose: true,
      },
    );

    ref
      .afterClosed()
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((saved) => {
        if (saved) this._loadInterviews();
      });
  }

  protected openEditDialog(interview: InterviewDto): void {
    const ref = this._dialog.open<InterviewFormDialog, InterviewFormDialogData, InterviewDto>(
      InterviewFormDialog,
      {
        data: {
          applicationRecordId: this.data.applicationRecordId,
          companyName: this.data.companyName,
          interview,
        },
        width: '440px',
        maxWidth: '95vw',
        disableClose: true,
      },
    );

    ref
      .afterClosed()
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((saved) => {
        if (saved) {
          this.interviews.update((current) =>
            current.map((i) => (i.id === saved.id ? saved : i)),
          );
        }
      });
  }

  protected openDeleteDialog(interview: InterviewDto): void {
    const id = interview.id as number;
    const typeLabel = this._typeLabels[(interview.type as number) ?? 0] ?? 'Interview';

    const ref = this._dialog.open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, {
      data: {
        title: 'Delete Interview',
        message: `Delete the ${typeLabel} interview${interview.roundNumber ? ' (Round ' + interview.roundNumber + ')' : ''}? This cannot be undone.`,
        confirmLabel: 'Delete',
        confirmColor: 'warn',
      },
    });

    ref
      .afterClosed()
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((confirmed) => {
        if (!confirmed) return;

        this.deletingId.set(id);
        this._interviewService
          .delete(this.data.applicationRecordId, id)
          .pipe(takeUntilDestroyed(this._destroyRef))
          .subscribe({
            next: () => {
              this.deletingId.set(null);
              this.interviews.update((current) => current.filter((i) => i.id !== interview.id));
            },
            error: () => this.deletingId.set(null),
          });
      });
  }

  protected getTypeLabel(type: number | undefined): string {
    return this._typeLabels[type ?? 0] ?? 'Unknown';
  }

  protected getOutcomeLabel(outcome: number | null | undefined): string {
    if (outcome == null) return '—';
    return this._outcomeLabels[outcome] ?? '—';
  }

  protected getOutcomeClass(outcome: number | null | undefined): string {
    if (outcome == null) return '';
    const classes: Record<number, string> = { 0: 'outcome-pending', 1: 'outcome-passed', 2: 'outcome-failed' };
    return classes[outcome] ?? '';
  }

  protected getInterviewId(interview: InterviewDto): number {
    return interview.id as number;
  }
}