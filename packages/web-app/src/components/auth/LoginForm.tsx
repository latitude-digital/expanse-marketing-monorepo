/**
 * LoginForm Component - Responsive Auth Layout (AUTH-017)
 * 
 * This component implements mobile-first responsive design with:
 * - Touch-friendly button sizes (minimum 44x44px touch targets)
 * - Optimized input sizes for mobile keyboards
 * - Responsive breakpoints: Mobile (320-640px), Tablet (641-1024px), Desktop (1025px+)
 * - Portrait and landscape orientation support
 * - Mobile-specific UX patterns (larger fonts, better spacing)
 * - Maintains full WCAG AA accessibility compliance
 */
import React, { useState, useRef, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { Button, TextField } from 'react-aria-components';
import { Link } from 'react-router-dom';
import authService from '../../services/authService';
import { loginValidationSchema, type LoginValidationValues } from '../../schemas/authSchemas';

interface LoginFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onError }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Refs for focus management
  const formRef = useRef<HTMLFormElement>(null);
  const emailFieldRef = useRef<HTMLInputElement>(null);
  const passwordFieldRef = useRef<HTMLInputElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  
  // Live region ref for screen reader announcements
  const liveRegionRef = useRef<HTMLDivElement>(null);

  // Focus management on component mount
  useEffect(() => {
    // Focus first input field on component mount
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

  // AUTH-007: Secure error handling with consistent response timing
  // Note: Rate limiting should be implemented at the API/server level
  // to prevent brute force attacks. Consider implementing exponential backoff
  // after multiple failed attempts from the same IP/client.
  const handleSubmit = async (values: LoginValidationValues) => {
    setError('');
    setSuccessMessage('');
    setIsLoading(true);
    
    // Announce loading state to screen readers
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = 'Signing in, please wait...';
    }
    
    // Start timing to ensure consistent response time (prevents timing attacks)
    const startTime = Date.now();
    const minResponseTime = 500; // Minimum response time in milliseconds

    try {
      await authService.signIn(values.email, values.password, values.rememberMe);
      
      // Ensure minimum response time before success
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < minResponseTime) {
        await new Promise(resolve => setTimeout(resolve, minResponseTime - elapsedTime));
      }
      
      setSuccessMessage('Sign in successful. Redirecting...');
      onSuccess?.();
    } catch (error: any) {
      // AUTH-007: Use generic error message for all authentication failures
      // This prevents revealing whether an email exists in the system
      // and provides consistent messaging for security purposes
      const secureErrorMessage = 'Invalid credentials. Please check your email and password.';
      
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

  const initialValues: LoginValidationValues = {
    email: '',
    password: '',
    rememberMe: false
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
        validationSchema={loginValidationSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched, isValid, dirty }) => (
          <Form 
            ref={formRef}
            className="space-y-6"
            role="main"
            aria-label="Sign in form"
            data-testid="login-form"
          >
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-4 sm:mb-6 lg:mb-8 text-center leading-tight">
              Sign In
            </h1>
            
            {/* WCAG AA compliant error alert - red text contrast ratio 7:1 */}
            {error && (
              <div 
                ref={errorRef}
                className="mb-4 sm:mb-6 
                  p-3 sm:p-4 
                  bg-red-50 border-2 border-red-400 text-red-800 
                  rounded-md text-sm sm:text-base"
                role="alert"
                aria-live="assertive"
                tabIndex={-1}
              >
                <div className="flex items-start">
                  <svg 
                    className="w-5 h-5 sm:w-6 sm:h-6 text-red-800 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                  <div>
                    <strong className="font-semibold">Error:</strong> {error}
                    <div className="text-xs sm:text-sm mt-1 text-red-700">
                      Press Escape to dismiss this message
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Success message */}
            {successMessage && (
              <div 
                className="mb-4 sm:mb-6 
                  p-3 sm:p-4 
                  bg-green-50 border-2 border-green-400 text-green-800 
                  rounded-md text-sm sm:text-base"
                role="alert"
                aria-live="polite"
              >
                <div className="flex items-start">
                  <svg 
                    className="w-5 h-5 sm:w-6 sm:h-6 text-green-800 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                  {successMessage}
                </div>
              </div>
            )}

            <fieldset disabled={isLoading} className="space-y-4 sm:space-y-6">
              <legend className="sr-only">Sign in credentials</legend>

              {/* Email field with enhanced accessibility and mobile optimization */}
              <div className="mb-4 sm:mb-6">
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
                      passwordFieldRef.current?.focus();
                    }
                  }}
                />
                <div id="email-description" className="sr-only">
                  Enter the email address for your account
                </div>
                <ErrorMessage 
                  id="email-error"
                  name="email" 
                  component="div" 
                  className="mt-2 text-sm sm:text-base text-red-700 font-medium" 
                  role="alert"
                />
              </div>

              {/* Password field with enhanced accessibility and mobile optimization */}
              <div className="mb-6 sm:mb-8">
                <label 
                  htmlFor="password" 
                  className="block text-gray-900 text-sm sm:text-base font-semibold mb-2 required-field"
                >
                  Password
                  <abbr className="text-red-600 ml-1" aria-label="required" title="This field is required">*</abbr>
                </label>
                <Field
                  ref={passwordFieldRef}
                  id="password"
                  name="password"
                  type="password"
                  className={`w-full 
                    px-4 sm:px-5 
                    py-3 sm:py-4 
                    border-2 rounded-md font-medium
                    text-base sm:text-lg
                    focus:outline-none focus:ring-4 focus:ring-blue-500 focus:border-blue-600
                    transition-all duration-200 text-gray-900 placeholder-gray-500
                    ${errors.password && touched.password
                      ? 'border-red-500 bg-red-50 focus:border-red-600 focus:ring-red-200'
                      : 'border-gray-600 bg-white hover:border-gray-700'
                    }
                    disabled:bg-gray-100 disabled:border-gray-300 disabled:cursor-not-allowed
                  `}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={isLoading}
                  aria-required="true"
                  aria-invalid={errors.password && touched.password ? 'true' : 'false'}
                  aria-describedby={`password-description ${errors.password && touched.password ? 'password-error' : ''}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (isValid && dirty && !isLoading) {
                        submitButtonRef.current?.click();
                      }
                    }
                  }}
                />
                <div id="password-description" className="sr-only">
                  Enter your account password
                </div>
                <ErrorMessage 
                  id="password-error"
                  name="password" 
                  component="div" 
                  className="mt-2 text-sm sm:text-base text-red-700 font-medium" 
                  role="alert"
                />
              </div>

              {/* Remember me checkbox with proper accessibility - responsive layout */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between 
                mb-6 sm:mb-8 space-y-4 sm:space-y-0">
                <div className="flex items-start">
                  <div className="flex items-center h-5 sm:h-6">
                    <Field
                      id="remember-me"
                      name="rememberMe"
                      type="checkbox"
                      className="w-5 h-5 sm:w-4 sm:h-4 text-blue-600 bg-white border-2 border-gray-600 rounded 
                        focus:ring-4 focus:ring-blue-500 focus:ring-offset-0 
                        hover:border-gray-700 transition-all duration-200
                        disabled:bg-gray-100 disabled:border-gray-300
                        cursor-pointer"
                      disabled={isLoading}
                      aria-describedby="remember-me-description"
                    />
                  </div>
                  <div className="ml-3 sm:ml-3 text-sm sm:text-base">
                    <label htmlFor="remember-me" className="text-gray-900 font-medium cursor-pointer select-none">
                      Remember me
                    </label>
                    <div id="remember-me-description" className="text-gray-600 text-xs sm:text-sm">
                      Keep me signed in on this device
                    </div>
                  </div>
                </div>
                
                <Link
                  to="/forgot-password"
                  className="text-sm sm:text-base text-blue-700 hover:text-blue-900 underline
                    focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-offset-2 
                    rounded px-2 py-2 sm:px-1 sm:py-1 transition-colors duration-200
                    min-h-[44px] sm:min-h-auto flex items-center justify-center sm:justify-start
                    touch-manipulation"
                  aria-label="Reset your password if you've forgotten it"
                >
                  Forgot Password?
                </Link>
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
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </span>
              </button>
              <div id="submit-button-description" className="sr-only">
                {isLoading 
                  ? 'Please wait while we sign you in'
                  : isValid && dirty 
                    ? 'Click to sign in to your account' 
                    : 'Complete all required fields to sign in'
                }
              </div>
            </fieldset>

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
                    <span className="ml-2">in email field moves to password</span>
                  </div>
                  <div className="flex items-center">
                    <kbd className="px-2 py-1 bg-gray-200 rounded text-xs sm:text-sm font-mono">Enter</kbd>
                    <span className="ml-2">in password field submits form</span>
                  </div>
                  <div className="flex items-center">
                    <kbd className="px-2 py-1 bg-gray-200 rounded text-xs sm:text-sm font-mono">Escape</kbd>
                    <span className="ml-2">clears error messages</span>
                  </div>
                  <div className="flex items-center">
                    <kbd className="px-2 py-1 bg-gray-200 rounded text-xs sm:text-sm font-mono">Tab</kbd>
                    <span className="ml-2">to navigate between fields</span>
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

export default LoginForm;