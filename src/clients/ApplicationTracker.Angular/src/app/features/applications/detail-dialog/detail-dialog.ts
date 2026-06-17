import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ApplicationRecordDto } from '../../../core/api/api.types';

export interface DetailDialogData {
  record: ApplicationRecordDto;
}

@Component({
  selector: 'app-detail-dialog',
  templateUrl: './detail-dialog.html',
  styleUrl: './detail-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, MatDialogModule, MatButtonModule],
})
export class DetailDialog {
  protected readonly data = inject<DetailDialogData>(MAT_DIALOG_DATA);

  protected readonly statusLabels: Record<number, string> = {
    0: 'Applied',
    1: 'Interviewing',
    2: 'Offered',
    3: 'Rejected',
    4: 'Withdrawn',
  };

  protected readonly statusClasses: Record<number, string> = {
    0: 'status-applied',
    1: 'status-interviewing',
    2: 'status-offered',
    3: 'status-rejected',
    4: 'status-withdrawn',
  };
}
