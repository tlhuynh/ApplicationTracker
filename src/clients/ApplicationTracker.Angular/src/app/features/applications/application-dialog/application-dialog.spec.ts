import { of, throwError } from 'rxjs';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { HttpErrorResponse } from '@angular/common/http';
import { ApplicationService } from '../../../core/services/application.service';
import { ApplicationDialog } from './application-dialog';

// ── Mock factories ────────────────────────────────────────────────────────────

function createServiceMock() {
  return {
    create: vi.fn().mockReturnValue(of({ id: 1, companyName: 'Acme' })),
    update: vi.fn().mockReturnValue(of({ id: 1, companyName: 'Acme' })),
    getDescription: vi.fn().mockReturnValue(of({ description: null })),
  };
}

function createDialogRefMock() {
  return { close: vi.fn(), disableClose: false };
}

// ── Setup helpers ─────────────────────────────────────────────────────────────

async function setup(serviceMock = createServiceMock()) {
  const dialogRefMock = createDialogRefMock();

  await render(ApplicationDialog, {
    providers: [
      provideNoopAnimations(),
      provideNativeDateAdapter(),
      { provide: MAT_DIALOG_DATA, useValue: {} },
      { provide: MatDialogRef, useValue: dialogRefMock },
      { provide: ApplicationService, useValue: serviceMock },
    ],
  });

  return { serviceMock, dialogRefMock, user: userEvent.setup() };
}

async function setupEdit(
  record: Record<string, unknown>,
  serviceMock = createServiceMock(),
) {
  const dialogRefMock = createDialogRefMock();

  await render(ApplicationDialog, {
    providers: [
      provideNoopAnimations(),
      provideNativeDateAdapter(),
      { provide: MAT_DIALOG_DATA, useValue: { record } },
      { provide: MatDialogRef, useValue: dialogRefMock },
      { provide: ApplicationService, useValue: serviceMock },
    ],
  });

  return { serviceMock, dialogRefMock, user: userEvent.setup() };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ApplicationDialog — notes field', () => {

  // ── Character counter ──────────────────────────────────────────────────────

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

  // ── Max length validation ──────────────────────────────────────────────────

  it('shows an inline error when notes exceed 5000 characters', async () => {
    const { user } = await setup();
    const textarea = screen.getByRole('textbox', { name: /notes/i });

    await user.click(textarea);
    await user.paste('a'.repeat(5001));
    await user.tab(); // triggers blur → marks control as touched → mat-error becomes visible

    expect(await screen.findByText('Notes cannot exceed 5000 characters')).toBeInTheDocument();
  });

  it('does not call the service when notes exceed 5000 characters', async () => {
    const serviceMock = createServiceMock();
    const { user } = await setup(serviceMock);
    const textarea = screen.getByRole('textbox', { name: /notes/i });

    await user.type(screen.getByRole('textbox', { name: /company name/i }), 'Acme');
    await user.click(textarea);
    await user.paste('a'.repeat(5001));
    await user.click(screen.getByRole('button', { name: /add application/i }));

    expect(serviceMock.create).not.toHaveBeenCalled();
  });

  it('accepts notes at exactly the 5000 character limit', async () => {
    const serviceMock = createServiceMock();
    const { user } = await setup(serviceMock);
    const textarea = screen.getByRole('textbox', { name: /notes/i });

    await user.type(screen.getByRole('textbox', { name: /company name/i }), 'Acme');
    await user.click(textarea);
    await user.paste('a'.repeat(5000));
    await user.click(screen.getByRole('button', { name: /add application/i }));

    expect(serviceMock.create).toHaveBeenCalled();
    expect(screen.queryByText('Notes cannot exceed 5000 characters')).not.toBeInTheDocument();
  });

  // ── Server-side validation error display ───────────────────────────────────

  it('displays the extracted field message when the server returns a ValidationProblemDetails 400', async () => {
    const serviceMock = createServiceMock();
    serviceMock.create.mockReturnValue(
      throwError(() => new HttpErrorResponse({
        status: 400,
        error: {
          title: 'One or more validation errors occurred.',
          errors: { Notes: ['Notes cannot exceed 5000 characters.'] },
        },
      }))
    );
    const { user } = await setup(serviceMock);

    await user.type(screen.getByRole('textbox', { name: /company name/i }), 'Acme');
    await user.click(screen.getByRole('button', { name: /add application/i }));

    expect(await screen.findByText('Notes cannot exceed 5000 characters.')).toBeInTheDocument();
  });

  it('does not show [object Object] when the server returns a ValidationProblemDetails body', async () => {
    const serviceMock = createServiceMock();
    serviceMock.create.mockReturnValue(
      throwError(() => new HttpErrorResponse({
        status: 400,
        error: {
          title: 'One or more validation errors occurred.',
          errors: { Notes: ['Notes cannot exceed 5000 characters.'] },
        },
      }))
    );
    const { user } = await setup(serviceMock);

    await user.type(screen.getByRole('textbox', { name: /company name/i }), 'Acme');
    await user.click(screen.getByRole('button', { name: /add application/i }));

    expect(await screen.findByRole('alert')).not.toHaveTextContent('[object Object]');
  });
});

describe('ApplicationDialog — description field', () => {

  it('shows the description field in create mode', async () => {
    await setup();
    expect(screen.getByRole('textbox', { name: /description/i })).toBeInTheDocument();
  });

  it('shows the description field in edit mode', async () => {
    await setupEdit({ id: 1, companyName: 'Acme', hasDescription: false });
    expect(screen.getByRole('textbox', { name: /description/i })).toBeInTheDocument();
  });

  it('does not call getDescription when hasDescription is false', async () => {
    const serviceMock = createServiceMock();
    await setupEdit({ id: 1, companyName: 'Acme', hasDescription: false }, serviceMock);
    expect(serviceMock.getDescription).not.toHaveBeenCalled();
  });

  it('calls getDescription with the record id when hasDescription is true', async () => {
    const serviceMock = createServiceMock();
    await setupEdit({ id: 42, companyName: 'Acme', hasDescription: true }, serviceMock);
    expect(serviceMock.getDescription).toHaveBeenCalledWith(42);
  });

  it('pre-fills the description textarea with the fetched value', async () => {
    const serviceMock = createServiceMock();
    serviceMock.getDescription.mockReturnValue(of({ description: 'Senior engineer role' }));
    await setupEdit({ id: 1, companyName: 'Acme', hasDescription: true }, serviceMock);
    expect(screen.getByRole('textbox', { name: /description/i })).toHaveValue('Senior engineer role');
  });

  it('leaves description empty when hasDescription is false', async () => {
    await setupEdit({ id: 1, companyName: 'Acme', hasDescription: false });
    expect(screen.getByRole('textbox', { name: /description/i })).toHaveValue('');
  });
});
