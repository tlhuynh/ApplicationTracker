import { Subject, of, throwError } from 'rxjs';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { ApplicationService } from '../../../core/services/application.service';
import { ApplicationRecordDto } from '../../../core/api/api.types';
import { Home } from './home';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const APPLIED: ApplicationRecordDto = {
  id: 1,
  companyName: 'Acme Corp',
  status: 0,
  appliedDate: '2024-01-15T00:00:00.000Z',
  postingUrl: 'https://example.com',
  notes: null,
};

const INTERVIEWING: ApplicationRecordDto = { id: 2, companyName: 'Beta Inc', status: 1, appliedDate: null, postingUrl: null, notes: null };
const OFFERED: ApplicationRecordDto     = { id: 3, companyName: 'Gamma LLC', status: 2, appliedDate: null, postingUrl: null, notes: null };
const REJECTED: ApplicationRecordDto   = { id: 4, companyName: 'Delta Co', status: 3, appliedDate: null, postingUrl: null, notes: null };
const WITHDRAWN: ApplicationRecordDto  = { id: 5, companyName: 'Echo Ltd', status: 4, appliedDate: null, postingUrl: null, notes: null };

// ── Mock factories ────────────────────────────────────────────────────────────

function makePagedResult(records: ApplicationRecordDto[]) {
  return { items: records, totalCount: records.length, page: 1, pageSize: 5, totalPages: records.length > 0 ? 1 : 0 };
}

function createServiceMock(records: ApplicationRecordDto[] = []) {
  return {
    // First call: initial load; subsequent calls (after mutations): empty list.
    getAll: vi.fn()
      .mockReturnValueOnce(of(makePagedResult(records)))
      .mockReturnValue(of(makePagedResult([]))),
    patchStatus: vi.fn().mockReturnValue(of({ ...APPLIED, status: 1 })),
    delete: vi.fn().mockReturnValue(of(undefined)),
  };
}

/** Creates a MatDialog mock whose open() immediately closes with `result`. */
function createDialogMock(result: unknown = undefined) {
  return {
    open: vi.fn().mockReturnValue({
      afterClosed: vi.fn().mockReturnValue(of(result)),
    }),
  };
}

// ── Setup helper ──────────────────────────────────────────────────────────────

interface SetupOptions {
  records?: ApplicationRecordDto[];
  dialogResult?: unknown;
  serviceOverrides?: Partial<ReturnType<typeof createServiceMock>>;
  dialogMock?: ReturnType<typeof createDialogMock>;
}

async function setup(options: SetupOptions = {}) {
  const serviceMock = { ...createServiceMock(options.records ?? []), ...options.serviceOverrides };
  const dialogMock  = options.dialogMock ?? createDialogMock(options.dialogResult);

  await render(Home, {
    providers: [
      provideNoopAnimations(),
      { provide: ApplicationService, useValue: serviceMock },
      { provide: MatDialog, useValue: dialogMock },
    ],
  });

  return { serviceMock, dialogMock, user: userEvent.setup() };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Home', () => {

  // ── Loading / error / empty ────────────────────────────────────────────────

  it('should show loading spinner while data loads', async () => {
    const pending$ = new Subject<ApplicationRecordDto[]>();
    await setup({ serviceOverrides: { getAll: vi.fn().mockReturnValue(pending$) } });

    // progressbar is the ARIA role rendered by mat-spinner
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    // Table content is hidden while loading
    expect(screen.queryByText(/no applications yet/i)).not.toBeInTheDocument();
  });

  it('should show error banner when load fails', async () => {
    await setup({
      serviceOverrides: {
        getAll: vi.fn().mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 }))),
      },
    });

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Failed to load applications. Please refresh the page.'
    );
  });

  it('should show empty state when there are no records', async () => {
    await setup({ records: [] });

    expect(screen.getByText(/no applications yet/i)).toBeInTheDocument();
  });

  // ── Table rendering ────────────────────────────────────────────────────────

  it('should render company name and status badge for each record', async () => {
    await setup({ records: [APPLIED] });

    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    // Status badge text — "Applied Date" is the column header so there is no collision
    expect(screen.getByText('Applied')).toBeInTheDocument();
  });

  it('should display the correct status label for all statuses', async () => {
    await setup({ records: [APPLIED, INTERVIEWING, OFFERED, REJECTED, WITHDRAWN] });

    for (const label of ['Applied', 'Interviewing', 'Offered', 'Rejected', 'Withdrawn']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('should render a link for records that have a posting URL', async () => {
    await setup({ records: [APPLIED] }); // APPLIED has postingUrl

    expect(screen.getByRole('link', { name: /open job posting for acme corp/i })).toBeInTheDocument();
  });

  // ── Add dialog ─────────────────────────────────────────────────────────────

  it('should reload and show the new record when the add dialog closes with a saved record', async () => {
    const newRecord: ApplicationRecordDto = { id: 99, companyName: 'New Corp', status: 0, appliedDate: null, postingUrl: null, notes: null };
    const { user } = await setup({
      dialogResult: newRecord,
      serviceOverrides: {
        getAll: vi.fn()
          .mockReturnValueOnce(of(makePagedResult([])))
          .mockReturnValue(of(makePagedResult([newRecord]))),
      },
    });

    await user.click(screen.getByRole('button', { name: /add application/i }));

    expect(screen.getByText('New Corp')).toBeInTheDocument();
  });

  it('should not update the list when the add dialog is dismissed', async () => {
    const { user } = await setup({ dialogResult: undefined });

    await user.click(screen.getByRole('button', { name: /add application/i }));

    expect(screen.getByText(/no applications yet/i)).toBeInTheDocument();
  });

  // ── Edit dialog ────────────────────────────────────────────────────────────

  it('should replace the record in the list when the edit dialog saves', async () => {
    const updated: ApplicationRecordDto = { ...APPLIED, companyName: 'Acme Corp Renamed' };
    const { user } = await setup({ records: [APPLIED], dialogResult: updated });

    await user.click(screen.getByRole('button', { name: /edit acme corp/i }));

    expect(screen.getByText('Acme Corp Renamed')).toBeInTheDocument();
    expect(screen.queryByText('Acme Corp')).not.toBeInTheDocument();
  });

  // ── Delete ─────────────────────────────────────────────────────────────────

  it('should remove the record after deletion is confirmed', async () => {
    const dialogMock = createDialogMock(true); // ConfirmDialog returns true
    const { serviceMock, user } = await setup({ records: [APPLIED], dialogMock });

    await user.click(screen.getByRole('button', { name: /delete acme corp/i }));

    expect(serviceMock.delete).toHaveBeenCalledWith(1);
    expect(screen.getByText(/no applications yet/i)).toBeInTheDocument();
  });

  it('should not delete when the confirm dialog is dismissed', async () => {
    const dialogMock = createDialogMock(false); // user cancelled
    const { serviceMock, user } = await setup({ records: [APPLIED], dialogMock });

    await user.click(screen.getByRole('button', { name: /delete acme corp/i }));

    expect(serviceMock.delete).not.toHaveBeenCalled();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
  });

  // ── Inline status actions ──────────────────────────────────────────────────

  it('should call patchStatus with the next status when advance is clicked', async () => {
    const { serviceMock, user } = await setup({ records: [APPLIED] }); // status 0

    await user.click(screen.getByRole('button', { name: /advance status for acme corp/i }));

    expect(serviceMock.patchStatus).toHaveBeenCalledWith(1, { status: 1 });
  });

  it('should call patchStatus with status 3 when reject is clicked', async () => {
    const { serviceMock, user } = await setup({ records: [APPLIED] });

    await user.click(screen.getByRole('button', { name: /reject acme corp/i }));

    expect(serviceMock.patchStatus).toHaveBeenCalledWith(1, { status: 3 });
  });

  it('should call patchStatus with status 4 when withdraw is clicked on an Offered record', async () => {
    const { serviceMock, user } = await setup({ records: [OFFERED] });

    await user.click(screen.getByRole('button', { name: /withdraw application for gamma llc/i }));

    expect(serviceMock.patchStatus).toHaveBeenCalledWith(3, { status: 4 });
  });

  // ── Button visibility ──────────────────────────────────────────────────────

  it('should hide advance button for Offered, Rejected, and Withdrawn records', async () => {
    await setup({ records: [OFFERED, REJECTED, WITHDRAWN] });

    expect(screen.queryByRole('button', { name: /advance status for gamma llc/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /advance status for delta co/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /advance status for echo ltd/i })).not.toBeInTheDocument();
  });

  it('should hide reject button for Rejected and Withdrawn records', async () => {
    await setup({ records: [REJECTED, WITHDRAWN] });

    expect(screen.queryByRole('button', { name: /reject delta co/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /reject echo ltd/i })).not.toBeInTheDocument();
  });

  it('should show both advance and reject buttons for Applied and Interviewing records', async () => {
    await setup({ records: [APPLIED, INTERVIEWING] });

    expect(screen.getByRole('button', { name: /advance status for acme corp/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reject acme corp/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /advance status for beta inc/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reject beta inc/i })).toBeInTheDocument();
  });

  it('should show both reject and withdraw buttons for an Offered record', async () => {
    await setup({ records: [OFFERED] });

    expect(screen.getByRole('button', { name: /reject gamma llc/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /withdraw application for gamma llc/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /advance status for gamma llc/i })).not.toBeInTheDocument();
  });

  it('should hide withdraw button for non-Offered records', async () => {
    await setup({ records: [APPLIED, INTERVIEWING, REJECTED, WITHDRAWN] });

    expect(screen.queryByRole('button', { name: /withdraw application for acme corp/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /withdraw application for beta inc/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /withdraw application for delta co/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /withdraw application for echo ltd/i })).not.toBeInTheDocument();
  });
});
