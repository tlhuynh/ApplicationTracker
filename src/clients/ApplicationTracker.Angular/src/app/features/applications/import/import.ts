import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { HttpErrorResponse } from '@angular/common/http';
import { ApplicationService } from '../../../core/services/application.service';
import { ExcelImportResultDto } from '../../../core/api/api.types';

@Component({
  selector: 'app-import',
  templateUrl: './import.html',
  styleUrl: './import.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
  ],
})
export class Import {
  private readonly _fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');
  private readonly _applicationService = inject(ApplicationService);
  private readonly _destroyRef = inject(DestroyRef);

  protected readonly selectedFile = signal<File | null>(null);
  protected readonly isUploading = signal(false);
  protected readonly importResult = signal<ExcelImportResultDto | null>(null);
  protected readonly serverError = signal<string | null>(null);

  /** Columns shown in the import-errors table. */
  protected readonly errorColumns = ['rowNumber', 'companyName', 'errorMessage'];

  protected onFileChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.selectedFile.set(file);
    this.importResult.set(null);
    this.serverError.set(null);
  }

  protected triggerFileInput(): void {
    this._fileInput().nativeElement.click();
  }

  protected onUpload(): void {
    const file = this.selectedFile();
    if (!file) return;

    this.isUploading.set(true);
    this.serverError.set(null);
    this.importResult.set(null);

    this._applicationService
      .importRecords(file)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (result) => {
          this.isUploading.set(false);
          this.importResult.set(result);
          this.selectedFile.set(null);
          this._fileInput().nativeElement.value = '';
        },
        error: (err: HttpErrorResponse) => {
          this.isUploading.set(false);
          this.handleError(err);
        },
      });
  }

  private handleError(err: HttpErrorResponse): void {
    if (err.status >= 500 || err.status === 405) {
      this.serverError.set('Something went wrong on our end. Please try again later.');
    } else if (err.status > 0) {
      this.serverError.set(err.error || 'Upload failed. Please try again.');
    } else {
      this.serverError.set('Unable to reach the server. Please check your connection.');
    }
  }
}
