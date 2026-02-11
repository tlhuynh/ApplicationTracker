import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { HomePage } from './HomePage';

describe('HomePage', () => {
  it('renders the applications heading', () => {
    render(<HomePage />);
    expect(screen.getByText('Applications')).toBeInTheDocument();
  });
});
