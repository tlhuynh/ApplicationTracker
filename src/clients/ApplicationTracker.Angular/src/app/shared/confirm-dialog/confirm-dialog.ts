import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

/** Data shape passed when opening ConfirmDialog. */
export interface ConfirmDialogData {
  title: string;
  message: string;
  /** Label for the confirm button. Defaults to "Confirm". */
  confirmLabel?: string;
  /** Color of the confirm button. Defaults to "warn". */
  confirmColor?: 'primary' | 'accent' | 'warn';
}

/**
 * Reusable confirmation dialog component.
 *
 * Opens with a title, message, and Confirm / Cancel buttons.
 * Returns `true` via `afterClosed()` when the user confirms,
 * or `undefined` when the user cancels.
 *
 * Usage:
 *   const ref = this._dialog.open(ConfirmDialog, { data: { title: '...', message: '...' } });
 *   ref.afterClosed().subscribe((confirmed) => { if (confirmed) { ... } });
 */
@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule],
})
export class ConfirmDialog {
  protected readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
  private readonly _dialogRef = inject(MatDialogRef<ConfirmDialog>);

  protected readonly confirmLabel = this.data.confirmLabel ?? 'Confirm';
  protected readonly confirmColor = this.data.confirmColor ?? 'warn';

  /** Closes the dialog and emits true to indicate the user confirmed. */
  public confirm(): void {
    this._dialogRef.close(true);
  }

  /** Closes the dialog without emitting a result (user cancelled). */
  public cancel(): void {
    this._dialogRef.close();
  }
}
