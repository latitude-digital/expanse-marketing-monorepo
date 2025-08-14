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
    <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg mx-auto" onKeyDown={handleKeyDown}>
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
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-4 sm:mb-6 lg:mb-8 text-center leading-tight">
              Reset Password
            </h1>
            
            <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 text-center leading-relaxed">
              Enter your email address and we'll send you instructions to reset your password.
            </p>
            
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

            <fieldset disabled={isLoading} className="space-y-4 sm:space-y-6">
              <legend className="sr-only">Password reset email</legend>

              {/* Email field with enhanced accessibility and mobile optimization */}
              <div className="mb-6 sm:mb-8">
                <label 
                  htmlFor="email" 
                  className="block text-gray-900 text-sm sm:text-base font-semibold mb-2 required-field"
                >
                  Email Address
                  <abbr className="text-red-600 ml-1" aria-label="required" title="This field is required">*</abbr>
                </label>
                <Field
                  ref={emailFieldRef}
                  id="email"
                  name="email"
                  type="email"
                  className={`w-full 
                    px-4 sm:px-5 
                    py-3 sm:py-4 
                    border-2 rounded-md font-medium
                    text-base sm:text-lg
                    focus:outline-none focus:ring-4 focus:ring-blue-500 focus:border-blue-600
                    transition-all duration-200 text-gray-900 placeholder-gray-500
                    ${errors.email && touched.email
                      ? 'border-red-500 bg-red-50 focus:border-red-600 focus:ring-red-200'
                      : 'border-gray-600 bg-white hover:border-gray-700'
                    }
                    disabled:bg-gray-100 disabled:border-gray-300 disabled:cursor-not-allowed
                  `}
                  placeholder="Enter your email address"
                  autoComplete="email"
                  inputMode="email"
                  disabled={isLoading}
                  aria-required="true"
                  aria-invalid={errors.email && touched.email ? 'true' : 'false'}
                  aria-describedby={`email-description ${errors.email && touched.email ? 'email-error' : ''}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (isValid && dirty && !isLoading) {
                        submitButtonRef.current?.click();
                      }
                    }
                  }}
                />
                <div id="email-description" className="sr-only">
                  Enter the email address associated with your account
                </div>
                <ErrorMessage 
                  id="email-error"
                  name="email" 
                  component="div" 
                  className="mt-2 text-sm sm:text-base text-red-700 font-medium" 
                  role="alert"
                />
              </div>

              {/* Submit button with enhanced accessibility and mobile optimization */}
              <button
                ref={submitButtonRef}
                type="submit"
                disabled={isLoading || !isValid || !dirty}
                className="w-full bg-blue-700 hover:bg-blue-800 active:bg-blue-900
                  text-white font-bold 
                  py-4 sm:py-3 px-6 
                  rounded-md 
                  text-lg sm:text-xl
                  min-h-[56px] sm:min-h-[48px]
                  focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-offset-2
                  transition-all duration-200
                  disabled:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-75
                  transform hover:scale-[1.02] active:scale-[0.98]
                  touch-manipulation"
                aria-describedby="submit-button-description"
              >
                <span className="flex items-center justify-center">
                  {isLoading && (
                    <svg 
                      className="animate-spin -ml-1 mr-3 h-5 w-5 sm:h-6 sm:w-6 text-white" 
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
                  {isLoading ? 'Sending Email...' : 'Send Reset Email'}
                </span>
              </button>
              <div id="submit-button-description" className="sr-only">
                {isLoading 
                  ? 'Please wait while we send your password reset email'
                  : isValid && dirty 
                    ? 'Click to send password reset email' 
                    : 'Enter a valid email address to continue'
                }
              </div>
            </fieldset>

            {/* Back to sign in link */}
            <div className="mt-6 sm:mt-8 text-center">
              <Link
                to={returnPath}
                className="text-sm sm:text-base text-blue-700 hover:text-blue-900 underline
                  focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-offset-2 
                  rounded px-2 py-2 transition-colors duration-200
                  min-h-[44px] sm:min-h-auto flex items-center justify-center
                  touch-manipulation"
                aria-label="Return to sign in page"
              >
                ← Back to Sign In
              </Link>
            </div>

            {/* Keyboard shortcuts help - responsive design */}
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gray-50 rounded-md border">
              <details>
                <summary className="text-sm sm:text-base text-gray-700 cursor-pointer font-medium hover:text-gray-900 
                  py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded">
                  Keyboard shortcuts
                </summary>
                <div className="mt-2 sm:mt-3 text-xs sm:text-sm text-gray-600 space-y-1 sm:space-y-2">
                  <div className="flex items-center">
                    <kbd className="px-2 py-1 bg-gray-200 rounded text-xs sm:text-sm font-mono">Enter</kbd>
                    <span className="ml-2">in email field submits form</span>
                  </div>
                  <div className="flex items-center">
                    <kbd className="px-2 py-1 bg-gray-200 rounded text-xs sm:text-sm font-mono">Escape</kbd>
                    <span className="ml-2">clears error messages</span>
                  </div>
                  <div className="flex items-center">
                    <kbd className="px-2 py-1 bg-gray-200 rounded text-xs sm:text-sm font-mono">Tab</kbd>
                    <span className="ml-2">to navigate between elements</span>
                  </div>
                </div>
              </details>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default ForgotPasswordForm;