import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
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
});
