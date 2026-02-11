import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { NotFoundPage } from './NotFoundPage';

describe('NotFoundPage', () => {
  it('renders the not found message', () => {
    render(<NotFoundPage />);
    expect(screen.getByText('Page Not Found')).toBeInTheDocument();
  });
});
