import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { HttpErrorResponse } from '@angular/common/http';
import { ApplicationService } from '../../../core/services/application.service';
import { extractErrorMessage } from '../../../core/utils/http-error';

export interface DescriptionDialogData {
  recordId: number;
  companyName: string;
}

/**
 * Dialog for viewing and editing the long-form description of a job posting.
 *
 * Opens in read-only mode. An Edit button switches to edit mode where the user
 * can modify and save the description. Cancel reverts without a refetch.
 * Closes with `true` if description was saved with content, `false` if cleared, `undefined` if dismissed.
 */
@Component({
  selector: 'app-description-dialog',
  templateUrl: './description-dialog.html',
  styleUrl: './description-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
})
export class DescriptionDialog implements OnInit {
  protected readonly data = inject<DescriptionDialogData>(MAT_DIALOG_DATA);
  private readonly _dialogRef = inject(MatDialogRef<DescriptionDialog, boolean>);
  private readonly _applicationService = inject(ApplicationService);
  private readonly _destroyRef = inject(DestroyRef);

  protected readonly isLoading = signal(true);
  protected readonly isEditing = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly loadError = signal<string | null>(null);
  protected readonly serverError = signal<string | null>(null);

  /** Original fetched value — restored on Cancel. */
  private _originalDescription: string | null = null;

  protected readonly descriptionControl = new FormControl<string>('', {
    nonNullable: true,
    validators: [Validators.maxLength(20000)],
  });

  protected get descriptionLength(): number {
    return this.descriptionControl.value.length;
  }

  public ngOnInit(): void {
    this._applicationService
      .getDescription(this.data.recordId)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (result) => {
          this._originalDescription = result.description;
          this.descriptionControl.setValue(result.description ?? '');
          this.isLoading.set(false);
        },
        error: () => {
          this.loadError.set('Failed to load description. Please try again.');
          this.isLoading.set(false);
        },
      });
  }

  protected enterEditMode(): void {
    this.isEditing.set(true);
    this.serverError.set(null);
  }

  protected cancelEdit(): void {
    this.descriptionControl.setValue(this._originalDescription ?? '');
    this.descriptionControl.markAsUntouched();
    this.isEditing.set(false);
    this.serverError.set(null);
  }

  protected onSave(): void {
    this.descriptionControl.markAsTouched();
    if (this.descriptionControl.invalid) return;

    this.serverError.set(null);
    this.isSaving.set(true);
    this._dialogRef.disableClose = true;

    const value = this.descriptionControl.value || null;

    this._applicationService
      .patchDescription(this.data.recordId, { description: value })
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: () => {
          this.isSaving.set(false);
          this._dialogRef.disableClose = false;
          this._dialogRef.close(value !== null);
        },
        error: (err: HttpErrorResponse) => {
          this.isSaving.set(false);
          this._dialogRef.disableClose = false;
          this.serverError.set(extractErrorMessage(err, 'Save failed. Please try again.'));
        },
      });
  }
}