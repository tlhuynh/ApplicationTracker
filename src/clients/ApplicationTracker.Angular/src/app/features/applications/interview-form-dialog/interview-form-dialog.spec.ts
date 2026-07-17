import { of, throwError } from 'rxjs';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { HttpErrorResponse } from '@angular/common/http';
import { InterviewService } from '../../../core/services/interview.service';
import { InterviewFormDialog } from './interview-form-dialog';
import type { InterviewDto } from '../../../core/api/api.types';

// ── Mock factories ────────────────────────────────────────────────────────────

function createServiceMock() {
  return {
    create: vi.fn().mockReturnValue(of({ id: 1, applicationRecordId: 1, type: 0, date: '2025-03-15T00:00:00Z' })),
    update: vi.fn().mockReturnValue(of({ id: 3, applicationRecordId: 1, type: 1, date: '2025-04-01T00:00:00Z', roundNumber: 2, outcome: 1 })),
  };
}

function createDialogRefMock() {
  return { close: vi.fn(), disableClose: false };
}

const existingInterview: InterviewDto = {
  id: 3,
  applicationRecordId: 1,
  type: 1,       // Technical
  roundNumber: 2,
  date: '2025-04-01T00:00:00Z',
  outcome: 1,    // Passed
  notes: 'Went well',
};

// ── Setup helper ──────────────────────────────────────────────────────────────

interface SetupOptions {
  interview?: InterviewDto;
  serviceMock?: ReturnType<typeof createServiceMock>;
}

async function setup({ interview, serviceMock = createServiceMock() }: SetupOptions = {}) {
  const dialogRefMock = createDialogRefMock();
  const dialogData = { applicationRecordId: 1, companyName: 'Acme', interview };

  const { fixture } = await render(InterviewFormDialog, {
    providers: [
      provideNoopAnimations(),
      provideNativeDateAdapter(),
      { provide: MAT_DIALOG_DATA, useValue: dialogData },
      { provide: MatDialogRef, useValue: dialogRefMock },
      { provide: InterviewService, useValue: serviceMock },
    ],
  });

  return { serviceMock, dialogRefMock, fixture, user: userEvent.setup() };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('InterviewFormDialog — add mode', () => {

  // ── Title ──────────────────────────────────────────────────────────────────

  it('shows "Add Interview" title when no interview data is provided', async () => {
    await setup();
    expect(screen.getByText('Add Interview')).toBeInTheDocument();
  });

  // ── Notes field ────────────────────────────────────────────────────────────

  it('shows a 0 / 5000 character counter on initial render', async () => {
    await setup();
    expect(screen.getByText('0 / 5000')).toBeInTheDocument();
  });

  it('updates the character counter as the user types', async () => {
    const { user } = await setup();
    const textarea = screen.getByRole('textbox', { name: /notes/i });

    await user.type(textarea, 'Hello');

    expect(screen.getByText('5 / 5000')).toBeInTheDocument();
  });

  it('shows an inline error when notes exceed 5000 characters', async () => {
    // Set the form control value directly — the [maxlength] HTML attribute prevents pasting
    // > 5000 chars via user interaction, so we bypass the element to test the validator itself.
    const { fixture } = await setup();
    const comp = fixture.componentInstance as never as {
      form: { controls: { notes: { setValue(v: string): void; markAsTouched(): void } } };
    };
    comp.form.controls.notes.setValue('a'.repeat(5001));
    comp.form.controls.notes.markAsTouched();
    fixture.detectChanges();

    expect(await screen.findByText('Notes cannot exceed 5000 characters.')).toBeInTheDocument();
  });

  // ── Required validation ────────────────────────────────────────────────────

  it('disables the save button when date is not set', async () => {
    await setup();
    expect(screen.getByRole('button', { name: /save interview/i })).toBeDisabled();
  });

  // ── Service call ───────────────────────────────────────────────────────────

  it('calls create with form data when submitted in add mode', async () => {
    const serviceMock = createServiceMock();
    const { fixture, user } = await setup({ serviceMock });

    // Set required date field via the form control — datepicker is not reliably testable in JSDOM
    (fixture.componentInstance as never as { form: { controls: { date: { setValue(v: Date): void } } } })
      .form.controls.date.setValue(new Date('2025-03-15T00:00:00Z'));
    fixture.detectChanges();

    await user.click(screen.getByRole('button', { name: /save interview/i }));

    expect(serviceMock.create).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ type: 0, date: expect.any(String) }),
    );
    expect(serviceMock.update).not.toHaveBeenCalled();
  });

  it('closes the dialog with the saved interview on success', async () => {
    const { fixture, dialogRefMock, user } = await setup();

    (fixture.componentInstance as never as { form: { controls: { date: { setValue(v: Date): void } } } })
      .form.controls.date.setValue(new Date('2025-03-15T00:00:00Z'));
    fixture.detectChanges();

    await user.click(screen.getByRole('button', { name: /save interview/i }));

    expect(dialogRefMock.close).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
  });

  // ── Server error handling ──────────────────────────────────────────────────

  it('shows a server error message when the API returns a 400', async () => {
    const serviceMock = createServiceMock();
    serviceMock.create.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 400, error: 'Invalid type value.' })),
    );
    const { fixture, user } = await setup({ serviceMock });

    (fixture.componentInstance as never as { form: { controls: { date: { setValue(v: Date): void } } } })
      .form.controls.date.setValue(new Date('2025-03-15T00:00:00Z'));
    fixture.detectChanges();

    await user.click(screen.getByRole('button', { name: /save interview/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid type value.');
  });

  it('shows a connection error message when the server is unreachable', async () => {
    const serviceMock = createServiceMock();
    serviceMock.create.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 0, error: null })),
    );
    const { fixture, user } = await setup({ serviceMock });

    (fixture.componentInstance as never as { form: { controls: { date: { setValue(v: Date): void } } } })
      .form.controls.date.setValue(new Date('2025-03-15T00:00:00Z'));
    fixture.detectChanges();

    await user.click(screen.getByRole('button', { name: /save interview/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to reach the server');
  });

  it('shows a generic error message on a 500 response', async () => {
    const serviceMock = createServiceMock();
    serviceMock.create.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500, error: null })),
    );
    const { fixture, user } = await setup({ serviceMock });

    (fixture.componentInstance as never as { form: { controls: { date: { setValue(v: Date): void } } } })
      .form.controls.date.setValue(new Date('2025-03-15T00:00:00Z'));
    fixture.detectChanges();

    await user.click(screen.getByRole('button', { name: /save interview/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong on our end');
  });
});

describe('InterviewFormDialog — edit mode', () => {

  // ── Title ──────────────────────────────────────────────────────────────────

  it('shows "Edit Interview" title when interview data is provided', async () => {
    await setup({ interview: existingInterview });
    expect(screen.getByText('Edit Interview')).toBeInTheDocument();
  });

  // ── Pre-fill ───────────────────────────────────────────────────────────────

  it('shows the notes from the existing interview in the textarea', async () => {
    await setup({ interview: existingInterview });
    const textarea = screen.getByRole('textbox', { name: /notes/i }) as HTMLTextAreaElement;
    expect(textarea.value).toBe('Went well');
  });

  it('shows the character count for pre-filled notes', async () => {
    await setup({ interview: existingInterview });
    // "Went well" is 9 characters
    expect(screen.getByText('9 / 5000')).toBeInTheDocument();
  });

  it('enables the save button when the existing interview has a valid date', async () => {
    await setup({ interview: existingInterview });
    expect(screen.getByRole('button', { name: /save interview/i })).not.toBeDisabled();
  });

  // ── Service call ───────────────────────────────────────────────────────────

  it('calls update instead of create when submitting in edit mode', async () => {
    const serviceMock = createServiceMock();
    const { user } = await setup({ serviceMock, interview: existingInterview });

    await user.click(screen.getByRole('button', { name: /save interview/i }));

    expect(serviceMock.update).toHaveBeenCalledWith(
      1,
      3,
      expect.objectContaining({ type: 1 }),
    );
    expect(serviceMock.create).not.toHaveBeenCalled();
  });

  it('disables the save button when notes exceed 5000 characters', async () => {
    const serviceMock = createServiceMock();
    const { fixture } = await setup({ serviceMock, interview: existingInterview });
    const comp = fixture.componentInstance as never as {
      form: { controls: { notes: { setValue(v: string): void } } };
    };
    comp.form.controls.notes.setValue('a'.repeat(5001));
    fixture.detectChanges();

    expect(screen.getByRole('button', { name: /save interview/i })).toBeDisabled();
    expect(serviceMock.update).not.toHaveBeenCalled();
  });
});