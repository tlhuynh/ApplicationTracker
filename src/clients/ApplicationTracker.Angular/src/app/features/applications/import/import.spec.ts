import { of, throwError } from 'rxjs';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { HttpErrorResponse } from '@angular/common/http';
import { ApplicationService } from '../../../core/services/application.service';
import { ExcelImportResultDto } from '../../../core/api/api.types';
import { Import } from './import';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const XLSX_FILE = new File(
  ['fake-xlsx-content'],
  'applications.xlsx',
  { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
);

const SUCCESS_RESULT: ExcelImportResultDto = {
  totalRows: 3,
  importedCount: 3,
  failedCount: 0,
  errors: [],
};

// ── Mock factory ──────────────────────────────────────────────────────────────

function createServiceMock(result: ExcelImportResultDto = SUCCESS_RESULT) {
  return {
    importRecords: vi.fn().mockReturnValue(of(result)),
  };
}

// ── Setup helper ──────────────────────────────────────────────────────────────

async function setup(serviceMock = createServiceMock()) {
  const renderResult = await render(Import, {
    providers: [
      provideNoopAnimations(),
      /**
       * provideRouter([]) is required because the success banner contains
       * a routerLink directive ("/"), and RouterLink needs a router context.
       */
      provideRouter([]),
      { provide: ApplicationService, useValue: serviceMock },
    ],
  });

  return { serviceMock, user: userEvent.setup(), container: renderResult.container };
}

/** Selects a file via the hidden file input and returns it. */
async function selectFile(container: HTMLElement, file: File) {
  const input = container.querySelector('input[type="file"]') as HTMLInputElement;
  await userEvent.setup().upload(input, file);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Import', () => {

  // ── Initial state ──────────────────────────────────────────────────────────

  it('should render the page title and choose file button', async () => {
    await setup();

    expect(screen.getByText('Import from Excel')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /choose excel file/i })).toBeInTheDocument();
  });

  it('should have the import button disabled when no file is selected', async () => {
    await setup();

    expect(screen.getByRole('button', { name: /upload and import/i })).toBeDisabled();
  });

  // ── File selection ─────────────────────────────────────────────────────────

  it('should show the filename and enable import after a file is chosen', async () => {
    const { container } = await setup();

    await selectFile(container, XLSX_FILE);

    expect(screen.getByText('applications.xlsx')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /upload and import/i })).not.toBeDisabled();
  });

  it('should update the displayed filename when a different file is chosen', async () => {
    const { container } = await setup();
    const secondFile = new File(['data'], 'second.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    await selectFile(container, XLSX_FILE);
    await selectFile(container, secondFile);

    expect(screen.getByText('second.xlsx')).toBeInTheDocument();
    expect(screen.queryByText('applications.xlsx')).not.toBeInTheDocument();
  });

  // ── Successful import ──────────────────────────────────────────────────────

  it('should call importRecords with the selected file on upload', async () => {
    const { serviceMock, container, user } = await setup();

    await selectFile(container, XLSX_FILE);
    await user.click(screen.getByRole('button', { name: /upload and import/i }));

    expect(serviceMock.importRecords).toHaveBeenCalledWith(XLSX_FILE);
  });

  it('should show a success banner with record counts after a successful import', async () => {
    const { container, user } = await setup();

    await selectFile(container, XLSX_FILE);
    await user.click(screen.getByRole('button', { name: /upload and import/i }));

    expect(screen.getByRole('status')).toHaveTextContent(/successfully imported 3 of 3/i);
  });

  it('should show a "View Applications" link after a successful import', async () => {
    const { container, user } = await setup();

    await selectFile(container, XLSX_FILE);
    await user.click(screen.getByRole('button', { name: /upload and import/i }));

    expect(screen.getByRole('link', { name: /view all applications/i })).toBeInTheDocument();
  });

  it('should clear the selected filename after a successful upload', async () => {
    const { container, user } = await setup();

    await selectFile(container, XLSX_FILE);
    expect(screen.getByText('applications.xlsx')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /upload and import/i }));

    expect(screen.queryByText('applications.xlsx')).not.toBeInTheDocument();
  });

  // ── Partial import with errors ─────────────────────────────────────────────

  it('should show an error table when some rows failed to import', async () => {
    const partialResult: ExcelImportResultDto = {
      totalRows: 3,
      importedCount: 2,
      failedCount: 1,
      errors: [{ rowNumber: 3, companyName: 'Bad Corp', errorMessage: 'Invalid status value' }],
    };
    const { container, user } = await setup(createServiceMock(partialResult));

    await selectFile(container, XLSX_FILE);
    await user.click(screen.getByRole('button', { name: /upload and import/i }));

    expect(screen.getByText('Invalid status value')).toBeInTheDocument();
    expect(screen.getByText('Bad Corp')).toBeInTheDocument();
    // Partial success still shows the success banner
    expect(screen.getByRole('status')).toHaveTextContent(/successfully imported 2 of 3/i);
  });

  // ── Full failure ───────────────────────────────────────────────────────────

  it('should show a failure banner when no records were imported', async () => {
    const failedResult: ExcelImportResultDto = {
      totalRows: 2,
      importedCount: 0,
      failedCount: 2,
      errors: [
        { rowNumber: 1, companyName: null, errorMessage: 'Company name is required' },
        { rowNumber: 2, companyName: null, errorMessage: 'Applied date is required' },
      ],
    };
    const { container, user } = await setup(createServiceMock(failedResult));

    await selectFile(container, XLSX_FILE);
    await user.click(screen.getByRole('button', { name: /upload and import/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/no records were imported/i);
    expect(screen.getByText('Company name is required')).toBeInTheDocument();
  });

  // ── Server errors ──────────────────────────────────────────────────────────

  it('should show a generic error message on a 5xx response', async () => {
    const serviceMock = createServiceMock();
    serviceMock.importRecords.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500 }))
    );
    const { container, user } = await setup(serviceMock);

    await selectFile(container, XLSX_FILE);
    await user.click(screen.getByRole('button', { name: /upload and import/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Something went wrong on our end. Please try again later.'
    );
  });

  it('should show a connection error message when the server is unreachable', async () => {
    const serviceMock = createServiceMock();
    serviceMock.importRecords.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 0 }))
    );
    const { container, user } = await setup(serviceMock);

    await selectFile(container, XLSX_FILE);
    await user.click(screen.getByRole('button', { name: /upload and import/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Unable to reach the server. Please check your connection.'
    );
  });

  it('should pass through the API error message for 4xx responses', async () => {
    const serviceMock = createServiceMock();
    serviceMock.importRecords.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 400, error: 'File format not supported.' }))
    );
    const { container, user } = await setup(serviceMock);

    await selectFile(container, XLSX_FILE);
    await user.click(screen.getByRole('button', { name: /upload and import/i }));

    expect(screen.getByRole('alert')).toHaveTextContent('File format not supported.');
  });
});
