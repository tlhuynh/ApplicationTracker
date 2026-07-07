import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule, MatChipListboxChange } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ApplicationService } from '../../../core/services/application.service';
import {
  ApplicationDialog,
  ApplicationDialogData,
} from '../application-dialog/application-dialog';
import { ConfirmDialog, ConfirmDialogData } from '../../../shared/confirm-dialog/confirm-dialog';
import { NoteDialog, NoteDialogData } from '../note-dialog/note-dialog';
import { DetailDialog, DetailDialogData } from '../detail-dialog/detail-dialog';
import { DescriptionDialog, DescriptionDialogData } from '../description-dialog/description-dialog';
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

/** Status options shown as filter chips. */
const STATUS_OPTIONS = [
  { value: 0, label: 'Applied' },
  { value: 1, label: 'Interviewing' },
  { value: 2, label: 'Offered' },
  { value: 3, label: 'Rejected' },
  { value: 4, label: 'Withdrawn' },
];

/**
 * Home page — displays the authenticated user's application records in a table.
 *
 * Features:
 * - Load all records on init
 * - Filter by company name (debounced text search), status chips, and applied date range
 * - Add / Edit via ApplicationDialog (create + edit modes)
 * - Advance status (Applied → Interviewing → Offered) and Reject inline
 * - Delete with ConfirmDialog
 */
@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideNativeDateAdapter()],
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatChipsModule,
    MatDatepickerModule,
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
  protected readonly _sortBy = signal('status');
  protected readonly _sortDir = signal<'asc' | 'desc'>('asc');

  /** Filter state — driven by FormControls below; signals keep OnPush in sync. */
  protected readonly _search = signal('');
  protected readonly _activeStatuses = signal<number[]>([]);
  protected readonly _dateFrom = signal<Date | null>(null);
  protected readonly _dateTo = signal<Date | null>(null);

  /** True when any filter is active — controls the Clear button and empty-state message. */
  protected readonly hasActiveFilters = computed(
    () =>
      this._search().length > 0 ||
      this._activeStatuses().length > 0 ||
      this._dateFrom() !== null ||
      this._dateTo() !== null,
  );

  /** FormControls bound to the filter inputs. */
  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly dateFromControl = new FormControl<Date | null>(null);
  protected readonly dateToControl = new FormControl<Date | null>(null);

  /** True while an export request is in flight — disables the export button. */
  protected readonly isExporting = signal(false);

  /** ID of the record whose status is currently being patched — disables that row's status buttons. */
  protected readonly pendingStatusId = signal<number | null>(null);

  /** ID of the record currently being deleted — disables that row's delete button. */
  protected readonly isDeletingId = signal<number | null>(null);

  protected readonly pageSizeOptions = [5, 10, 25];
  protected readonly statusOptions = STATUS_OPTIONS;

  protected readonly displayedColumns = [
    'companyName',
    'status',
    'statusActions',
    'appliedDate',
    'postingUrl',
    'notes',
    'description',
    'actions',
  ];

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  public ngOnInit(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this._destroyRef))
      .subscribe((value) => {
        this._search.set(value);
        this._resetPageAndLoad();
      });

    this.dateFromControl.valueChanges
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((value) => {
        this._dateFrom.set(value);
        this._resetPageAndLoad();
      });

    this.dateToControl.valueChanges
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((value) => {
        this._dateTo.set(value);
        this._resetPageAndLoad();
      });

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
        search: this._search() || undefined,
        statuses: this._activeStatuses().length > 0 ? this._activeStatuses() : undefined,
        dateFrom: this._dateFrom() ?? undefined,
        dateTo: this._dateTo() ?? undefined,
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

  /** Resets to page 1 and reloads. Called whenever a filter changes. */
  private _resetPageAndLoad(): void {
    this._pageIndex.set(0);
    this._paginator()?.firstPage();
    this.loadRecords();
  }

  protected onSortChange(sort: Sort): void {
    this._sortBy.set(sort.active);
    this._sortDir.set(sort.direction as 'asc' | 'desc');
    this._resetPageAndLoad();
  }

  protected onPageChange(event: PageEvent): void {
    this._pageIndex.set(event.pageIndex);
    this._pageSize.set(event.pageSize);
    this.loadRecords();
  }

  // ── Filter actions ────────────────────────────────────────────────────────

  protected onStatusChipChange(event: MatChipListboxChange): void {
    this._activeStatuses.set((event.value as number[]) ?? []);
    this._resetPageAndLoad();
  }

  /** Clears only the search field and reloads immediately (no debounce). */
  protected clearSearch(): void {
    this.searchControl.reset('', { emitEvent: false });
    this._search.set('');
    this._resetPageAndLoad();
  }

  /** Resets all filters and reloads. */
  protected clearFilters(): void {
    this.searchControl.reset('', { emitEvent: false });
    this.dateFromControl.reset(null, { emitEvent: false });
    this.dateToControl.reset(null, { emitEvent: false });
    this._search.set('');
    this._dateFrom.set(null);
    this._dateTo.set(null);
    this._activeStatuses.set([]);
    this._resetPageAndLoad();
  }

  // ── Export ────────────────────────────────────────────────────────────────

  /** Downloads all records as an Excel file. */
  protected exportRecords(): void {
    this.isExporting.set(true);
    this._applicationService
      .exportRecords()
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `applications_${new Date().toISOString().slice(0, 10)}.xlsx`;
          a.click();
          URL.revokeObjectURL(url);
          this.isExporting.set(false);
        },
        error: () => this.isExporting.set(false),
      });
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

  /** Opens the description dialog for a record. Fetches description on open; updates hasDescription on save. */
  protected openDescriptionDialog(record: ApplicationRecordDto): void {
    const id = this.getRecordId(record);
    const ref = this._dialog.open<DescriptionDialog, DescriptionDialogData, boolean>(
      DescriptionDialog,
      {
        data: { recordId: id, companyName: record.companyName ?? '' },
        width: '640px',
        maxWidth: '95vw',
        disableClose: true,
      },
    );

    ref
      .afterClosed()
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((hasDescription) => {
        if (typeof hasDescription === 'boolean') {
          this.records.update((current) =>
            current.map((r) => (r.id === record.id ? { ...r, hasDescription } : r)),
          );
        }
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
