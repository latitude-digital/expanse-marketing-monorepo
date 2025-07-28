import React from 'react';
import { render, screen } from '@testing-library/react';
import Survey from './Survey';

test('renders Survey', () => {
  render(<Survey />);
  const linkElement = screen.getByText(/Survey/i);
  expect(linkElement).toBeInTheDocument();
});
