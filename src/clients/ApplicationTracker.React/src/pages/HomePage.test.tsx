import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HomePage } from './HomePage';
// Mock the API module — replaces getAll with a Vitest mock function.
// vi.mock hoists to the top of the file, so it runs before any imports.
vi.mock('@/api/applicationRecords', () => ({
  getAll: vi.fn(),
}));

// Import the mocked function so we can control its return value per test
import { getAll } from '@/api/applicationRecords';
const mockGetAll = vi.mocked(getAll);

describe('HomePage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('shows loading state initially', () => {
    // getAll returns a promise that never resolves — keeps the component in loading state
    mockGetAll.mockReturnValue(new Promise(() => {}));

    render(<HomePage />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders the table after data loads', async () => {
    mockGetAll.mockResolvedValue([
      {
        id: 1,
        companyName: 'Acme Corp',
        status: 0,
        appliedDate: '2025-06-01T00:00:00',
        postingUrl: null,
        notes: null,
      },
    ]);

    render(<HomePage />);

    // waitFor retries until the assertion passes (or times out).
    // Needed because useEffect + setState is asynchronous.
    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });

    // Loading text should be gone
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('shows error message when API call fails', async () => {
    mockGetAll.mockRejectedValue(new Error('Network error'));

    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });
});
