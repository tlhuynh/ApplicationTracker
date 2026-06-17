import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSortModule, MatSort, Sort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { ApplicationService } from '../../../core/services/application.service';
import {
  ApplicationDialog,
  ApplicationDialogData,
} from '../application-dialog/application-dialog';
import { ConfirmDialog, ConfirmDialogData } from '../../../shared/confirm-dialog/confirm-dialog';
import { NoteDialog, NoteDialogData } from '../note-dialog/note-dialog';
import { DetailDialog, DetailDialogData } from '../detail-dialog/detail-dialog';
import { ApplicationRecordDto } from '../../../core/api/api.types';

/** Human-readable label for each ApplicationStatus numeric value. */
const STATUS_LABELS: Record<number, string> = {
  0: 'Applied',
  1: 'Interviewing',
  2: 'Offered',
  3: 'Rejected',
  4: 'Withdrawn',
};

/** CSS class applied to the status badge for each ApplicationStatus value. */
const STATUS_CLASSES: Record<number, string> = {
  0: 'status-applied',
  1: 'status-interviewing',
  2: 'status-offered',
  3: 'status-rejected',
  4: 'status-withdrawn',
};

/**
 * Home page — displays the authenticated user's application records in a table.
 *
 * Features:
 * - Load all records on init
 * - Add / Edit via ApplicationDialog (create + edit modes)
 * - Advance status (Applied → Interviewing → Offered) and Reject inline
 * - Delete with ConfirmDialog
 *
 * All mutations update the local records signal directly from the API response
 * instead of re-fetching the full list.
 */
@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSortModule,
    MatPaginatorModule,
  ],
})
export class Home implements OnInit {
  private readonly _applicationService = inject(ApplicationService);
  private readonly _dialog = inject(MatDialog);
  private readonly _destroyRef = inject(DestroyRef);

  private readonly _paginator = viewChild<MatPaginator>(MatPaginator);

  // ── State ─────────────────────────────────────────────────────────────────

  protected readonly records = signal<ApplicationRecordDto[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly totalCount = signal(0);

  /** Pagination state (0-based page index to match MatPaginator). */
  protected readonly _pageIndex = signal(0);
  protected readonly _pageSize = signal(10);

  /** Sort state. */
  private readonly _sortBy = signal('companyName');
  private readonly _sortDir = signal<'asc' | 'desc'>('asc');

  /** ID of the record whose status is currently being patched — disables that row's status buttons. */
  protected readonly pendingStatusId = signal<number | null>(null);

  /** ID of the record currently being deleted — disables that row's delete button. */
  protected readonly isDeletingId = signal<number | null>(null);

  protected readonly pageSizeOptions = [5, 10, 25];

  protected readonly displayedColumns = [
    'companyName',
    'status',
    'statusActions',
    'appliedDate',
    'postingUrl',
    'notes',
    'actions',
  ];

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  public ngOnInit(): void {
    this.loadRecords();
  }

  // ── Data loading ──────────────────────────────────────────────────────────

  private loadRecords(): void {
    this.isLoading.set(true);
    this.loadError.set(null);

    this._applicationService
      .getAll({
        page: this._pageIndex() + 1,
        pageSize: this._pageSize(),
        sortBy: this._sortBy(),
        sortDir: this._sortDir(),
      })
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (result) => {
          this.records.set(result.items ?? []);
          this.totalCount.set(result.totalCount ?? 0);
          this.isLoading.set(false);
        },
        error: () => {
          this.loadError.set('Failed to load applications. Please refresh the page.');
          this.isLoading.set(false);
        },
      });
  }

  protected onSortChange(sort: Sort): void {
    this._sortBy.set(sort.active || 'companyName');
    this._sortDir.set((sort.direction || 'asc') as 'asc' | 'desc');
    this._pageIndex.set(0);
    this._paginator()?.firstPage();
    this.loadRecords();
  }

  protected onPageChange(event: PageEvent): void {
    this._pageIndex.set(event.pageIndex);
    this._pageSize.set(event.pageSize);
    this.loadRecords();
  }

  // ── Dialog actions ────────────────────────────────────────────────────────

  /** Opens the dialog in create mode and prepends the returned record to the list. */
  protected openAddDialog(): void {
    const ref = this._dialog.open<ApplicationDialog, ApplicationDialogData, ApplicationRecordDto>(
      ApplicationDialog,
      { data: {}, width: '520px', maxWidth: '95vw', disableClose: true },
    );

    ref
      .afterClosed()
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((saved) => {
        if (saved) {
          this._pageIndex.set(0);
          this._paginator()?.firstPage();
          this.loadRecords();
        }
      });
  }

  /** Opens the dialog in edit mode and replaces the updated record in the list. */
  protected openEditDialog(record: ApplicationRecordDto): void {
    const ref = this._dialog.open<ApplicationDialog, ApplicationDialogData, ApplicationRecordDto>(
      ApplicationDialog,
      { data: { record }, width: '520px', maxWidth: '95vw', disableClose: true },
    );

    ref
      .afterClosed()
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((saved) => {
        if (saved) {
          this.records.update((current) => current.map((r) => (r.id === saved.id ? saved : r)));
        }
      });
  }

  /** Opens a confirmation dialog and deletes the record on confirm. */
  protected openDeleteDialog(record: ApplicationRecordDto): void {
    const id = this.getRecordId(record);

    const ref = this._dialog.open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, {
      data: {
        title: 'Delete Application',
        message: `Delete the application for "${record.companyName}"? This cannot be undone.`,
        confirmLabel: 'Delete',
        confirmColor: 'warn',
      },
    });

    ref
      .afterClosed()
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((confirmed) => {
        if (!confirmed) return;

        this.isDeletingId.set(id);
        this._applicationService
          .delete(id)
          .pipe(takeUntilDestroyed(this._destroyRef))
          .subscribe({
            next: () => {
              this.isDeletingId.set(null);
              this.loadRecords();
            },
            error: () => this.isDeletingId.set(null),
          });
      });
  }

  /** Opens the readonly details dialog for a record. */
  protected openDetailDialog(record: ApplicationRecordDto): void {
    this._dialog.open<DetailDialog, DetailDialogData>(DetailDialog, {
      data: { record },
      width: '480px',
      maxWidth: '95vw',
      disableClose: true,
    });
  }

  /** Opens the readonly notes dialog for a record that has notes. */
  protected openNotesDialog(record: ApplicationRecordDto): void {
    this._dialog.open<NoteDialog, NoteDialogData>(NoteDialog, {
      data: {
        companyName: record.companyName ?? '',
        notes: record.notes ?? '',
      },
      width: '480px',
    });
  }

  // ── Inline status actions ─────────────────────────────────────────────────

  /** Advances the record to the next status (Applied → Interviewing → Offered). */
  protected advanceStatus(record: ApplicationRecordDto): void {
    const id = this.getRecordId(record);
    const nextStatus = (record.status ?? 0) + 1;

    this.pendingStatusId.set(id);
    this._applicationService
      .patchStatus(id, { status: nextStatus })
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (updated) => {
          this.records.update((current) => current.map((r) => (r.id === updated.id ? updated : r)));
          this.pendingStatusId.set(null);
        },
        error: () => this.pendingStatusId.set(null),
      });
  }

  /** Sets the record's status to Withdrawn (4). */
  protected withdrawRecord(record: ApplicationRecordDto): void {
    const id = this.getRecordId(record);

    this.pendingStatusId.set(id);
    this._applicationService
      .patchStatus(id, { status: 4 })
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (updated) => {
          this.records.update((current) => current.map((r) => (r.id === updated.id ? updated : r)));
          this.pendingStatusId.set(null);
        },
        error: () => this.pendingStatusId.set(null),
      });
  }

  /** Sets the record's status to Rejected (3). */
  protected rejectRecord(record: ApplicationRecordDto): void {
    const id = this.getRecordId(record);

    this.pendingStatusId.set(id);
    this._applicationService
      .patchStatus(id, { status: 3 })
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (updated) => {
          this.records.update((current) => current.map((r) => (r.id === updated.id ? updated : r)));
          this.pendingStatusId.set(null);
        },
        error: () => this.pendingStatusId.set(null),
      });
  }

  // ── Template helpers ──────────────────────────────────────────────────────

  /** True when the record can be advanced (Applied or Interviewing only). */
  protected canAdvance(record: ApplicationRecordDto): boolean {
    return (record.status ?? 0) < 2;
  }

  /** True when the record can be rejected (not already Rejected or Withdrawn). */
  protected canReject(record: ApplicationRecordDto): boolean {
    const status = record.status ?? 0;
    return status !== 3 && status !== 4;
  }

  /** True only when the record is Offered — the user can choose to withdraw. */
  protected canWithdraw(record: ApplicationRecordDto): boolean {
    return (record.status ?? 0) === 2;
  }

  protected getStatusLabel(status: number | undefined): string {
    return STATUS_LABELS[status ?? 0] ?? 'Unknown';
  }

  protected getStatusClass(status: number | undefined): string {
    return STATUS_CLASSES[status ?? 0] ?? '';
  }

  /**
   * Normalises the record ID to a number.
   * The generated API type declares id as `number | string | undefined` because
   * openapi-typescript is conservative with int32 — at runtime it is always a number.
   */
  protected getRecordId(record: ApplicationRecordDto): number {
    const id = record.id;
    return typeof id === 'string' ? parseInt(id, 10) : (id ?? 0);
  }
}
