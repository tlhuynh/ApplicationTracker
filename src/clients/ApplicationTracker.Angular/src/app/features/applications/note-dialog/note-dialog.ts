import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface NoteDialogData {
  companyName: string;
  notes: string;
}

/**
 * Readonly dialog for viewing a record's notes.
 * `mat-dialog-content` handles scrolling automatically when the text
 * exceeds the dialog's max-height, so no explicit overflow CSS is needed.
 */
@Component({
  selector: 'app-note-dialog',
  templateUrl: './note-dialog.html',
  styleUrl: './note-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule],
})
export class NoteDialog {
  protected readonly data = inject<NoteDialogData>(MAT_DIALOG_DATA);
}
