import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ApplicationTable } from './ApplicationTable';
import type { ApplicationRecord } from '@/api/applicationRecords';
import { createColumns } from './applicationColumns';

// Sample data matching the ApplicationRecordDto shape
const mockApplications: ApplicationRecord[] = [
  {
    id: 1,
    companyName: 'Acme Corp',
    status: 0,
    appliedDate: '2025-06-01T00:00:00',
    postingUrl: 'https://example.com/job1',
    notes: 'Referred by a friend',
  },
  {
    id: 2,
    companyName: 'Globex Inc',
    status: 1,
    appliedDate: null,
    postingUrl: null,
    notes: null,
  },
];

// Create columns
const columns = createColumns({
  onEdit: () => {},
  onDelete: () => {},
  onStatusChange: () => {},
});

describe('ApplicationTable', () => {
  it('renders all column headers', () => {
    render(<ApplicationTable columns={columns} data={mockApplications} />);

    expect(screen.getByText('Company Name')).toBeInTheDocument();
    expect(screen.getByText('Date Applied')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Job Url')).toBeInTheDocument();
    expect(screen.getByText('Notes')).toBeInTheDocument();
  });

  it('renders application data in rows', () => {
    render(<ApplicationTable columns={columns} data={mockApplications} />);

    // First row
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('Applied')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /View notes: Referred by a friend/ })).toBeInTheDocument();

    // Second row
    expect(screen.getByText('Globex Inc')).toBeInTheDocument();
    expect(screen.getByText('Interviewing')).toBeInTheDocument();
  });

  it('renders job URL as a link that opens in a new tab', () => {
    render(<ApplicationTable columns={columns} data={mockApplications} />);

    const link = screen.getByRole('link', { name: 'Open job posting' });
    expect(link).toHaveAttribute('href', 'https://example.com/job1');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('shows empty state when data is empty', () => {
    render(<ApplicationTable columns={columns} data={[]} />);

    expect(screen.getByText('No applications found.')).toBeInTheDocument();
  });

  it('renders edit and delete buttons for each row', () => {
    render(<ApplicationTable columns={columns} data={mockApplications} />);

    const editButtons = screen.getAllByRole('button', { name: 'Edit' });
    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });

    expect(editButtons).toHaveLength(2);
    expect(deleteButtons).toHaveLength(2);
  });

  it('calls onStatusChange with next status when advance button is clicked', async () => {
    const onStatusChange = vi.fn();
    const cols = createColumns({
      onEdit: () => {},
      onDelete: () => {},
      onStatusChange,
    });

    render(<ApplicationTable columns={cols} data={mockApplications} />);

    // First row has status 0 (Applied) — advancing should pass status 1
    const advanceButtons = screen.getAllByRole('button', { name: 'Advance status' });
    await userEvent.click(advanceButtons[0]);

    expect(onStatusChange).toHaveBeenCalledWith(mockApplications[0], 1);
  });

  it('calls onStatusChange with Rejected (3) when reject button is clicked', async () => {
    const onStatusChange = vi.fn();
    const cols = createColumns({
      onEdit: () => {},
      onDelete: () => {},
      onStatusChange,
    });

    render(<ApplicationTable columns={cols} data={mockApplications} />);

    const rejectButtons = screen.getAllByRole('button', { name: 'Reject application' });
    await userEvent.click(rejectButtons[0]);

    expect(onStatusChange).toHaveBeenCalledWith(mockApplications[0], 3);
  });

  it('disables both status buttons when status is Rejected', () => {
    const rejectedData: ApplicationRecord[] = [
      { id: 3, companyName: 'Rejected Co', status: 3, appliedDate: null, postingUrl: null, notes: null },
    ];
    const cols = createColumns({
      onEdit: () => {},
      onDelete: () => {},
      onStatusChange: () => {},
    });

    render(<ApplicationTable columns={cols} data={rejectedData} />);

    expect(screen.getByRole('button', { name: 'Advance status' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Reject application' })).toBeDisabled();
  });

  it('disables advance button but enables reject when status is Offered', () => {
    const offeredData: ApplicationRecord[] = [
      { id: 4, companyName: 'Offered Co', status: 2, appliedDate: null, postingUrl: null, notes: null },
    ];
    const cols = createColumns({
      onEdit: () => {},
      onDelete: () => {},
      onStatusChange: () => {},
    });

    render(<ApplicationTable columns={cols} data={offeredData} />);

    expect(screen.getByRole('button', { name: 'Advance status' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Reject application' })).toBeEnabled();
  });
});
