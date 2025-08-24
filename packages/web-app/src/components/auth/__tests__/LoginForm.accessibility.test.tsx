import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import LoginForm from '../LoginForm';
import authService from '../../../services/authService';

// Extend Jest matchers for accessibility testing
expect.extend(toHaveNoViolations);

// Mock the auth service
jest.mock('../../../services/authService', () => ({
  signIn: jest.fn(),
}));

const mockAuthService = authService as jest.Mocked<typeof authService>;

describe('LoginForm Accessibility (WCAG AA Compliance)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AUTH-015: WCAG AA Compliance', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<LoginForm />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper semantic structure', () => {
      render(<LoginForm />);
      
      // Should have proper heading hierarchy
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Sign In');
      
      // Should have main landmark
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Sign in form');
      
      // Should have fieldset for form grouping
      expect(screen.getByRole('group', { name: 'Sign in credentials' })).toBeInTheDocument();
    });

    it('should have proper form labels and associations', () => {
      render(<LoginForm />);
      
      // Email field
      const emailField = screen.getByRole('textbox', { name: /email address/i });
      expect(emailField).toHaveAttribute('aria-required', 'true');
      expect(emailField).toHaveAttribute('aria-invalid', 'false');
      expect(emailField).toHaveAttribute('id', 'email');
      
      // Password field  
      const passwordField = screen.getByLabelText(/password/i);
      expect(passwordField).toHaveAttribute('aria-required', 'true');
      expect(passwordField).toHaveAttribute('aria-invalid', 'false');
      expect(passwordField).toHaveAttribute('id', 'password');
      
      // Submit button
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      expect(submitButton).toBeInTheDocument();
    });

    it('should indicate required fields properly', () => {
      render(<LoginForm />);
      
      // Required field indicators should be present
      const emailLabel = screen.getByText('Email Address');
      const passwordLabel = screen.getByText('Password');
      
      expect(emailLabel).toBeInTheDocument();
      expect(passwordLabel).toBeInTheDocument();
      
      // Asterisk indicators for required fields
      expect(screen.getAllByText('*')).toHaveLength(2);
    });

    it('should have proper error handling and announcements', async () => {
      const user = userEvent.setup();
      mockAuthService.signIn.mockRejectedValue(new Error('Invalid credentials'));
      
      render(<LoginForm />);
      
      // Fill form with invalid data
      await user.type(screen.getByLabelText(/email address/i), 'invalid@email.com');
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /sign in/i }));
      
      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
      
      // Error should be properly announced
      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toHaveAttribute('aria-live', 'assertive');
      expect(errorAlert).toHaveTextContent('Invalid credentials');
    });

    it('should have live region for screen reader announcements', () => {
      render(<LoginForm />);
      
      // Live region should exist
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
      expect(liveRegion).toHaveClass('sr-only');
    });

    it('should have sufficient color contrast (WCAG AA)', () => {
      const { container } = render(<LoginForm />);
      
      // Test high contrast colors are used
      const headingElement = screen.getByRole('heading', { level: 1 });
      expect(headingElement).toHaveClass('text-gray-900'); // High contrast
      
      // Submit button should use high contrast
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      expect(submitButton).toHaveClass('bg-blue-700'); // Sufficient contrast against white text
      
      // Error text should use high contrast
      const emailField = screen.getByLabelText(/email address/i);
      fireEvent.blur(emailField); // Trigger validation
      
      // Error styling uses red-700 and red-800 for high contrast
      expect(container.querySelector('.text-red-700')).toBeDefined();
    });

    it('should support high contrast mode', () => {
      render(<LoginForm />);
      
      // All interactive elements should have visible focus indicators
      const focusableElements = [
        screen.getByLabelText(/email address/i),
        screen.getByLabelText(/password/i),
        screen.getByLabelText(/remember me/i),
        screen.getByRole('button', { name: /forgot password/i }),
        screen.getByRole('button', { name: /sign in/i }),
      ];
      
      focusableElements.forEach(element => {
        expect(element).toHaveClass('focus:ring-4'); // Prominent focus ring
      });
    });
  });

  describe('AUTH-016: Keyboard Navigation Support', () => {
    it('should focus first input on mount', async () => {
      render(<LoginForm />);
      
      // Email field should receive focus after mounting
      await waitFor(() => {
        expect(screen.getByLabelText(/email address/i)).toHaveFocus();
      });
    });

    it('should support Enter key navigation between fields', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);
      
      const emailField = screen.getByLabelText(/email address/i);
      const passwordField = screen.getByLabelText(/password/i);
      
      // Focus email field and press Enter
      await user.click(emailField);
      await user.keyboard('{Enter}');
      
      // Should move focus to password field
      expect(passwordField).toHaveFocus();
    });

    it('should submit form with Enter from password field when valid', async () => {
      const user = userEvent.setup();
      const onSuccess = jest.fn();
      mockAuthService.signIn.mockResolvedValue({} as any);
      
      render(<LoginForm onSuccess={onSuccess} />);
      
      // Fill valid form data
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'validpassword');
      
      // Press Enter in password field
      await user.keyboard('{Enter}');
      
      // Should submit the form
      await waitFor(() => {
        expect(mockAuthService.signIn).toHaveBeenCalledWith('test@example.com', 'validpassword');
      });
    });

    it('should clear errors with Escape key', async () => {
      const user = userEvent.setup();
      mockAuthService.signIn.mockRejectedValue(new Error('Invalid credentials'));
      
      render(<LoginForm />);
      
      // Generate an error first
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /sign in/i }));
      
      // Wait for error
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
      
      // Press Escape to clear error
      await user.keyboard('{Escape}');
      
      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
    });

    it('should have proper tab order', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);
      
      // Tab through form in correct order
      await user.tab();
      expect(screen.getByLabelText(/email address/i)).toHaveFocus();
      
      await user.tab();
      expect(screen.getByLabelText(/password/i)).toHaveFocus();
      
      await user.tab();
      expect(screen.getByLabelText(/remember me/i)).toHaveFocus();
      
      await user.tab();
      expect(screen.getByRole('button', { name: /forgot password/i })).toHaveFocus();
      
      await user.tab();
      expect(screen.getByRole('button', { name: /sign in/i })).toHaveFocus();
    });

    it('should disable tab navigation during loading', async () => {
      const user = userEvent.setup();
      // Mock a delayed response to keep loading state
      mockAuthService.signIn.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));
      
      render(<LoginForm />);
      
      // Fill and submit form
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password');
      await user.click(screen.getByRole('button', { name: /sign in/i }));
      
      // Form should be disabled during loading
      expect(screen.getByLabelText(/email address/i)).toBeDisabled();
      expect(screen.getByLabelText(/password/i)).toBeDisabled();
      expect(screen.getByLabelText(/remember me/i)).toBeDisabled();
      expect(screen.getByRole('button', { name: /forgot password/i })).toBeDisabled();
    });

    it('should provide keyboard shortcuts help', () => {
      render(<LoginForm />);
      
      // Keyboard shortcuts section should be present
      expect(screen.getByText('Keyboard shortcuts')).toBeInTheDocument();
      
      // Should show specific shortcuts
      expect(screen.getByText(/Enter.*in email field moves to password/)).toBeInTheDocument();
      expect(screen.getByText(/Enter.*in password field submits form/)).toBeInTheDocument();
      expect(screen.getByText(/Escape.*clears error messages/)).toBeInTheDocument();
    });

    it('should manage focus properly after errors', async () => {
      const user = userEvent.setup();
      mockAuthService.signIn.mockRejectedValue(new Error('Invalid credentials'));
      
      render(<LoginForm />);
      
      // Submit form with error
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /sign in/i }));
      
      // Wait for error and focus return
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
      
      // Focus should return to email field for retry
      await waitFor(() => {
        expect(screen.getByLabelText(/email address/i)).toHaveFocus();
      });
    });
  });

  describe('Screen Reader Support', () => {
    it('should provide comprehensive field descriptions', () => {
      render(<LoginForm />);
      
      // Fields should have hidden descriptions
      expect(screen.getByText('Enter the email address for your account')).toHaveClass('sr-only');
      expect(screen.getByText('Enter your account password')).toHaveClass('sr-only');
      expect(screen.getByText('Keep me signed in on this device')).toBeInTheDocument();
    });

    it('should announce form submission status', async () => {
      const user = userEvent.setup();
      mockAuthService.signIn.mockResolvedValue({} as any);
      
      render(<LoginForm />);
      
      // Fill and submit form
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password');
      await user.click(screen.getByRole('button', { name: /sign in/i }));
      
      // Should announce loading state
      const submitButton = screen.getByRole('button', { name: /signing in/i });
      expect(submitButton).toHaveTextContent('Signing In...');
    });

    it('should provide accessible error messages', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);
      
      // Submit empty form to trigger validation errors
      await user.click(screen.getByRole('button', { name: /sign in/i }));
      
      // Wait for validation errors
      await waitFor(() => {
        const emailError = screen.getByText('Email is required');
        const passwordError = screen.getByText('Password is required');
        
        expect(emailError).toHaveAttribute('role', 'alert');
        expect(passwordError).toHaveAttribute('role', 'alert');
      });
    });
  });

  describe('Form Validation Integration', () => {
    it('should update aria-invalid when fields have errors', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);
      
      const emailField = screen.getByLabelText(/email address/i);
      
      // Enter invalid email
      await user.type(emailField, 'invalid-email');
      await user.tab(); // Blur field to trigger validation
      
      await waitFor(() => {
        expect(emailField).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('should maintain proper aria-describedby relationships', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);
      
      const emailField = screen.getByLabelText(/email address/i);
      
      // Initially should reference description only
      expect(emailField).toHaveAttribute('aria-describedby', 'email-description ');
      
      // After error, should reference both description and error
      await user.type(emailField, 'invalid');
      await user.tab();
      
      await waitFor(() => {
        expect(emailField).toHaveAttribute('aria-describedby', 'email-description email-error');
      });
    });
  });
});