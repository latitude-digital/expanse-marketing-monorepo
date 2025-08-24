/**
 * AuthAlert Component Tests
 * 
 * Tests the reusable alert component used throughout the auth flow
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AuthAlert from '../AuthAlert';

describe('AuthAlert', () => {
  it('renders error alert with proper ARIA attributes', () => {
    render(
      <AuthAlert
        type="error"
        title="Error"
        message="Test error message"
      />
    );

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveAttribute('aria-live', 'assertive');
    expect(alert).toHaveAttribute('aria-atomic', 'true');
    
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('renders success alert with proper styling', () => {
    render(
      <AuthAlert
        type="success"
        title="Success"
        message="Test success message"
      />
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'polite');
    expect(alert).toHaveClass('bg-green-50', 'border-green-400', 'text-green-800');
  });

  it('renders dismissible alert with close button', () => {
    const onDismiss = jest.fn();
    
    render(
      <AuthAlert
        type="info"
        message="Test info message"
        dismissible={true}
        onDismiss={onDismiss}
      />
    );

    const closeButton = screen.getByLabelText('Dismiss alert');
    expect(closeButton).toBeInTheDocument();
    
    fireEvent.click(closeButton);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('renders without title when not provided', () => {
    render(
      <AuthAlert
        type="warning"
        message="Test warning message"
      />
    );

    expect(screen.getByText('Test warning message')).toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <AuthAlert
        type="info"
        message="Test message"
        className="custom-class"
      />
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('custom-class');
  });
});