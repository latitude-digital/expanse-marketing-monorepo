/**
 * ForgotPasswordForm Component - Secure Password Reset Request (AUTH-010)
 * 
 * This component implements security best practices:
 * - Doesn't reveal whether an email exists in the system (AUTH-011)
 * - Uses consistent response timing to prevent user enumeration attacks
 * - Includes proper accessibility features and mobile-first responsive design
 * - Follows the same patterns as LoginForm for consistency
 */
import React, { useState, useRef, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { Link } from 'react-router-dom';
import authService from '../../services/authService';
import { passwordResetValidationSchema, type PasswordResetValidationValues } from '../../schemas/authSchemas';
import AuthAlert from './AuthAlert';

interface ForgotPasswordFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  returnPath?: string; // Path to return to after successful reset request
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ 
  onSuccess, 
  onError,
  returnPath = '/login'
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Refs for focus management
  const formRef = useRef<HTMLFormElement>(null);
  const emailFieldRef = useRef<HTMLInputElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  
  // Live region ref for screen reader announcements
  const liveRegionRef = useRef<HTMLDivElement>(null);

  // Focus management on component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (emailFieldRef.current) {
        emailFieldRef.current.focus();
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Announce status changes to screen readers
  useEffect(() => {
    if (error && liveRegionRef.current) {
      liveRegionRef.current.textContent = `Error: ${error}`;
    }
  }, [error]);

  useEffect(() => {
    if (successMessage && liveRegionRef.current) {
      liveRegionRef.current.textContent = successMessage;
    }
  }, [successMessage]);

  // Keyboard navigation helpers
  const handleKeyDown = (event: React.KeyboardEvent) => {
    // Escape key clears error
    if (event.key === 'Escape' && error) {
      event.preventDefault();
      setError('');
      if (liveRegionRef.current) {
        liveRegionRef.current.textContent = 'Error cleared';
      }
    }
  };

  // AUTH-011: Secure password reset request with consistent timing
  const handleSubmit = async (values: PasswordResetValidationValues) => {
    setError('');
    setSuccessMessage('');
    setIsLoading(true);
    
    // Announce loading state to screen readers
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = 'Sending password reset email, please wait...';
    }
    
    // Start timing to ensure consistent response time (prevents user enumeration)
    const startTime = Date.now();
    const minResponseTime = 1000; // Minimum response time in milliseconds

    try {
      // AUTH-011: Always send password reset email - Firebase handles non-existent emails securely
      await authService.sendPasswordReset(values.email);
      
      // Ensure minimum response time before success
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < minResponseTime) {
        await new Promise(resolve => setTimeout(resolve, minResponseTime - elapsedTime));
      }
      
      // AUTH-011: Generic success message that doesn't reveal if email exists
      const genericSuccessMessage = 'If an account with that email address exists, you will receive a password reset email shortly. Please check your inbox and spam folder.';
      setSuccessMessage(genericSuccessMessage);
      onSuccess?.();
      
    } catch (error: any) {
      // AUTH-011: Generic error message that doesn't reveal system information
      const secureErrorMessage = 'Unable to process your request at this time. Please try again later.';
      
      // Ensure minimum response time before showing error
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < minResponseTime) {
        await new Promise(resolve => setTimeout(resolve, minResponseTime - elapsedTime));
      }
      
      setError(secureErrorMessage);
      onError?.(secureErrorMessage);
      
      // Focus back to email field for retry
      setTimeout(() => {
        if (emailFieldRef.current) {
          emailFieldRef.current.focus();
        }
      }, 100);
    } finally {
      setIsLoading(false);
    }
  };

  const initialValues: PasswordResetValidationValues = {
    email: ''
  };

  return (
    <div className="w-full" onKeyDown={handleKeyDown}>
      {/* Screen reader live region for announcements */}
      <div 
        ref={liveRegionRef}
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
        role="status"
      />
      
      <Formik
        initialValues={initialValues}
        validationSchema={passwordResetValidationSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched, isValid, dirty }) => (
          <Form 
            ref={formRef}
            className="space-y-6"
            role="main"
            aria-label="Password reset request form"
          >
            {/* Error alert */}
            {error && (
              <AuthAlert
                type="error"
                title="Error"
                message={error}
                dismissible
                onDismiss={() => setError('')}
              />
            )}

            {/* Success alert */}
            {successMessage && (
              <AuthAlert
                type="success"
                title="Email Sent"
                message={successMessage}
              />
            )}

            <fieldset disabled={isLoading} className="space-y-6">
              <legend className="sr-only">Password reset email</legend>

              {/* Email field */}
              <div>
                <label 
                  htmlFor="email" 
                  className="block text-sm font-medium text-gray-900"
                >
                  Email address
                </label>
                <div className="mt-2">
                  <Field
                    ref={emailFieldRef}
                    id="email"
                    name="email"
                    type="email"
                    className={`block w-full rounded-md px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6
                      ${
                        errors.email && touched.email
                          ? 'outline-red-500 focus:outline-red-600'
                          : 'outline-gray-300'
                      }
                      disabled:bg-gray-50 disabled:text-gray-500 disabled:outline-gray-200
                    `}
                    placeholder="Enter your email address"
                    autoComplete="email"
                    inputMode="email"
                    disabled={isLoading}
                    aria-required="true"
                    aria-invalid={errors.email && touched.email ? 'true' : 'false'}
                    aria-describedby={errors.email && touched.email ? 'email-error' : undefined}
                  />
                </div>
                <ErrorMessage 
                  id="email-error"
                  name="email" 
                  component="p" 
                  className="mt-2 text-sm text-red-600" 
                  role="alert"
                />
              </div>

              {/* Submit button */}
              <div>
                <button
                  ref={submitButtonRef}
                  type="submit"
                  disabled={isLoading || !isValid || !dirty}
                  className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading && (
                    <svg 
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" 
                      xmlns="http://www.w3.org/2000/svg" 
                      fill="none" 
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle 
                        className="opacity-25" 
                        cx="12" 
                        cy="12" 
                        r="10" 
                        stroke="currentColor" 
                        strokeWidth="4"
                      />
                      <path 
                        className="opacity-75" 
                        fill="currentColor" 
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  )}
                  {isLoading ? 'Sending email...' : 'Send reset email'}
                </button>
              </div>
            </fieldset>

            {/* Back to sign in link */}
            <div className="text-center">
              <Link
                to={returnPath}
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
                aria-label="Return to sign in page"
              >
                ← Back to sign in
              </Link>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default ForgotPasswordForm;