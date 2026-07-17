import { of, throwError } from 'rxjs';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { render, screen } from '@testing-library/angular';
import { InterviewService } from '../../../core/services/interview.service';
import { InterviewDialog } from './interview-dialog';
import type { InterviewDto } from '../../../core/api/api.types';

// ── Mock factories ────────────────────────────────────────────────────────────

const mockInterview: InterviewDto = {
  id: 1,
  applicationRecordId: 5,
  type: 0,       // Screening
  roundNumber: null,
  date: '2025-03-15T00:00:00Z',
  outcome: null,
  notes: null,
};

function createServiceMock(interviews: InterviewDto[] = [mockInterview]) {
  return {
    getAll: vi.fn().mockReturnValue(of(interviews)),
    delete: vi.fn().mockReturnValue(of(undefined)),
  };
}

function createMatDialogMock() {
  return {
    open: vi.fn().mockReturnValue({ afterClosed: () => of(null) }),
  };
}

// ── Setup helper ──────────────────────────────────────────────────────────────

async function setup(serviceMock = createServiceMock()) {
  const dialogData = { applicationRecordId: 5, companyName: 'Acme' };

  await render(InterviewDialog, {
    providers: [
      provideNoopAnimations(),
      { provide: MAT_DIALOG_DATA, useValue: dialogData },
      { provide: MatDialogRef, useValue: { close: vi.fn() } },
      { provide: InterviewService, useValue: serviceMock },
      { provide: MatDialog, useValue: createMatDialogMock() },
    ],
  });

  return { serviceMock };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('InterviewDialog', () => {

  // ── Title ──────────────────────────────────────────────────────────────────

  it('renders the company name in the dialog title', async () => {
    await setup();
    expect(screen.getByText(/Interview History — Acme/i)).toBeInTheDocument();
  });

  // ── Loaded states ──────────────────────────────────────────────────────────

  it('shows the interview list when interviews are returned', async () => {
    await setup();
    expect(await screen.findByRole('list', { name: /interview history/i })).toBeInTheDocument();
  });

  it('shows the type label for each interview', async () => {
    await setup();
    expect(await screen.findByText('Screening')).toBeInTheDocument();
  });

  it('shows the round badge when a round number is set', async () => {
    const service = createServiceMock([{ ...mockInterview, roundNumber: 2 }]);
    await setup(service);
    expect(await screen.findByText('R2')).toBeInTheDocument();
  });

  it('does not show a round badge when round number is null', async () => {
    await setup(createServiceMock([{ ...mockInterview, roundNumber: null }]));
    expect(await screen.findByText('Screening')).toBeInTheDocument();
    expect(screen.queryByText(/^R\d/)).not.toBeInTheDocument();
  });

  it('shows the notes when the interview has notes', async () => {
    const service = createServiceMock([{ ...mockInterview, notes: 'Great chat' }]);
    await setup(service);
    expect(await screen.findByText('Great chat')).toBeInTheDocument();
  });

  // ── Empty state ────────────────────────────────────────────────────────────

  it('shows the empty state message when no interviews are returned', async () => {
    await setup(createServiceMock([]));
    expect(await screen.findByText('No interviews logged yet.')).toBeInTheDocument();
  });

  // ── Error state ────────────────────────────────────────────────────────────

  it('shows a load error message when the API call fails', async () => {
    const serviceMock = {
      getAll: vi.fn().mockReturnValue(throwError(() => new Error('Network error'))),
      delete: vi.fn(),
    };
    await setup(serviceMock);
    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to load interviews');
  });
});