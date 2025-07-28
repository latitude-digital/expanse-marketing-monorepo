import React from 'react';
import { render, screen } from '@testing-library/react';
import Surveys from './Surveys';

test('renders Surveys', () => {
  render(<Surveys />);
  const linkElement = screen.getByText(/Surveys/i);
  expect(linkElement).toBeInTheDocument();
});
