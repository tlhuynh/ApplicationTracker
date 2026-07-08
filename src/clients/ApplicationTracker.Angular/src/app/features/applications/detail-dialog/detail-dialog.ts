import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ApplicationRecordDto } from '../../../core/api/api.types';
import { DescriptionDialog, DescriptionDialogData } from '../description-dialog/description-dialog';
import { InterviewDialog, InterviewDialogData } from '../interview-dialog/interview-dialog';

export interface DetailDialogData {
  record: ApplicationRecordDto;
}

@Component({
  selector: 'app-detail-dialog',
  templateUrl: './detail-dialog.html',
  styleUrl: './detail-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, MatDialogModule, MatButtonModule, MatIconModule],
})
export class DetailDialog {
  protected readonly data = inject<DetailDialogData>(MAT_DIALOG_DATA);
  private readonly _dialog = inject(MatDialog);

  private readonly _statusLabels: Record<number, string> = {
    0: 'Applied',
    1: 'Interviewing',
    2: 'Offered',
    3: 'Rejected',
    4: 'Withdrawn',
  };

  private readonly _statusClasses: Record<number, string> = {
    0: 'status-applied',
    1: 'status-interviewing',
    2: 'status-offered',
    3: 'status-rejected',
    4: 'status-withdrawn',
  };

  protected openInterviewDialog(): void {
    this._dialog.open<InterviewDialog, InterviewDialogData>(InterviewDialog, {
      data: {
        applicationRecordId: this.data.record.id as number,
        companyName: this.data.record.companyName!,
      },
      width: '520px',
      maxWidth: '95vw',
      disableClose: true,
    });
  }

  protected openDescriptionDialog(): void {
    this._dialog.open(DescriptionDialog, {
      data: {
        recordId: this.data.record.id as number,
        companyName: this.data.record.companyName!,
        readOnly: true,
      } satisfies DescriptionDialogData,
      width: '600px',
      maxWidth: '95vw',
      disableClose: true,
    });
  }

  protected getStatusLabel(status: number | undefined): string {
    return this._statusLabels[status ?? 0] ?? 'Unknown';
  }

  protected getStatusClass(status: number | undefined): string {
    return this._statusClasses[status ?? 0] ?? '';
  }
}
