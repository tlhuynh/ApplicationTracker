import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {createMemoryRouter, RouterProvider} from 'react-router';
import {describe, it, expect, vi, beforeEach} from 'vitest';
import {ImportPage} from './ImportPage';

vi.mock('@/hooks/use-auth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/hooks/use-application-records-api', () => ({
  useApplicationRecordsApi: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

import {useAuth} from '@/hooks/use-auth';
import {useApplicationRecordsApi} from '@/hooks/use-application-records-api';
import {toast} from 'sonner';

const mockUseAuth = vi.mocked(useAuth);
const mockUseApplicationRecordsApi = vi.mocked(useApplicationRecordsApi);
const mockToast = vi.mocked(toast);

function renderImportPage() {
  const router = createMemoryRouter(
    [{path: '/import', element: <ImportPage />}],
    {initialEntries: ['/import']},
  );

  return render(<RouterProvider router={router} />);
}

describe('ImportPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockUseAuth.mockReturnValue(
      {isDemoMode: false} as unknown as ReturnType<typeof useAuth>,
    );
    mockUseApplicationRecordsApi.mockReturnValue(
      {importExcel: vi.fn()} as unknown as ReturnType<typeof useApplicationRecordsApi>,
    );
  });

  it('renders the upload UI', () => {
    renderImportPage();

    expect(screen.getByText('Import Applications')).toBeInTheDocument();
    expect(screen.getByText('Upload Excel File')).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /upload/i})).toBeInTheDocument();
    expect(screen.getByRole('link', {name: /download import template/i})).toBeInTheDocument();
  });

  it('shows the demo mode note when in demo mode', () => {
    mockUseAuth.mockReturnValue(
      {isDemoMode: true} as unknown as ReturnType<typeof useAuth>,
    );
    renderImportPage();

    expect(
      screen.getByText(/duplicate detection is not available in demo mode/i),
    ).toBeInTheDocument();
  });

  it('does not show the demo mode note in normal mode', () => {
    renderImportPage();

    expect(screen.queryByText(/duplicate detection is not available/i)).not.toBeInTheDocument();
  });

  it('shows a toast error when no file is selected', async () => {
    const user = userEvent.setup();
    renderImportPage();

    await user.click(screen.getByRole('button', {name: /upload/i}));

    expect(mockToast.error).toHaveBeenCalledWith('Please select a file first');
  });

  it('shows import results after a successful upload', async () => {
    const user = userEvent.setup();
    const mockImportExcel = vi.fn().mockResolvedValue({
      importedCount: 3,
      totalRows: 4,
      failedCount: 1,
      errors: [{rowNumber: 2, companyName: 'Bad Corp', errorMessage: 'Invalid status value'}],
    });
    mockUseApplicationRecordsApi.mockReturnValue(
      {importExcel: mockImportExcel} as unknown as ReturnType<typeof useApplicationRecordsApi>,
    );

    const {container} = renderImportPage();
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['dummy'], 'applications.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    await user.upload(fileInput, file);
    await user.click(screen.getByRole('button', {name: /upload/i}));

    await waitFor(() => {
      expect(screen.getByText('Import Results')).toBeInTheDocument();
    });
    expect(screen.getByText(/3 of 4 records imported/)).toBeInTheDocument();
    expect(screen.getByText('Invalid status value')).toBeInTheDocument();
    expect(mockToast.success).toHaveBeenCalledWith('Imported 3 of 4 records');
  });

  it('shows a toast error when the upload fails', async () => {
    const user = userEvent.setup();
    const mockImportExcel = vi.fn().mockRejectedValue(new Error('Server error'));
    mockUseApplicationRecordsApi.mockReturnValue(
      {importExcel: mockImportExcel} as unknown as ReturnType<typeof useApplicationRecordsApi>,
    );

    const {container} = renderImportPage();
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['dummy'], 'applications.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    await user.upload(fileInput, file);
    await user.click(screen.getByRole('button', {name: /upload/i}));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalled();
    });
    expect(screen.queryByText('Import Results')).not.toBeInTheDocument();
  });
});
