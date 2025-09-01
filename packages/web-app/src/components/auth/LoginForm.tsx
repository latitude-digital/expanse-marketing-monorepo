/**
 * LoginForm Component - Secure Authentication (AUTH-008)
 * 
 * This component implements security best practices:
 * - Validates email format before submission (AUTH-002)
 * - Enforces strong password requirements with clear user feedback (AUTH-003)
 * - Provides clear error messages for invalid credentials
 * - Includes proper accessibility features and mobile-first responsive design
 * - Uses Formik for robust form handling and validation
 * 
 * AUTH-009: CloudFront cookies are automatically handled by authService.signIn
 */
import React, { useState, useRef, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { Link } from 'react-router-dom';
import authService from '../../services/authService';
import { loginValidationSchema, type LoginValidationValues } from '../../schemas/authSchemas';
import AuthAlert from './AuthAlert';

interface LoginFormProps {
  onSuccess: () => void;
  onError: (error: string) => void;
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
  
  // Live region ref for screen reader announcements
  const liveRegionRef = useRef<HTMLDivElement>(null);

  // Focus management on component mount
  useEffect(() => {
    // Small delay to ensure DOM is ready
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

  const handleSubmit = async (values: LoginValidationValues) => {
    setError('');
    setIsLoading(true);
    
    // Announce loading state to screen readers
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = 'Signing in, please wait...';
    }

    try {
      // AUTH-009: CloudFront cookies are now automatically handled in authService.signIn
      await authService.signIn(values.email, values.password, values.rememberMe);
      
      // Clear any previous errors
      setError('');
      setSuccessMessage('Sign in successful! Redirecting...');
      
      // Small delay to let user see success message
      setTimeout(() => {
        onSuccess();
      }, 500);
      
    } catch (error: any) {
      let errorMessage = 'Unable to sign in. Please check your credentials and try again.';
      
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later or reset your password.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled. Please contact support.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      onError(errorMessage);
      
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
        validationSchema={loginValidationSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched, isValid, dirty }) => (
          <Form 
            ref={formRef}
            className="space-y-6"
            role="main"
            aria-label="Sign in form"
          >
            {/* Error alert */}
            {error && (
              <AuthAlert
                type="error"
                title="Sign in failed"
                message={error}
                dismissible
                onDismiss={() => setError('')}
              />
            )}

            {/* Success alert */}
            {successMessage && (
              <AuthAlert
                type="success"
                title="Success"
                message={successMessage}
              />
            )}

            <fieldset disabled={isLoading} className="space-y-6">
              <legend className="sr-only">Sign in credentials</legend>

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
                    placeholder="Enter your email"
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

              {/* Password field */}
              <div>
                <label 
                  htmlFor="password" 
                  className="block text-sm font-medium text-gray-900"
                >
                  Password
                </label>
                <div className="mt-2">
                  <Field
                    ref={passwordFieldRef}
                    id="password"
                    name="password"
                    type="password"
                    className={`block w-full rounded-md px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6
                      ${
                        errors.password && touched.password
                          ? 'outline-red-500 focus:outline-red-600'
                          : 'outline-gray-300'
                      }
                      disabled:bg-gray-50 disabled:text-gray-500 disabled:outline-gray-200
                    `}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={isLoading}
                    aria-required="true"
                    aria-invalid={errors.password && touched.password ? 'true' : 'false'}
                    aria-describedby={errors.password && touched.password ? 'password-error' : undefined}
                  />
                </div>
                <ErrorMessage 
                  id="password-error"
                  name="password" 
                  component="p" 
                  className="mt-2 text-sm text-red-600" 
                  role="alert"
                />
              </div>

              {/* Remember me checkbox and forgot password link */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Field
                    id="remember-me"
                    name="rememberMe"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                    disabled={isLoading}
                  />
                  <label htmlFor="remember-me" className="ml-3 block text-sm text-gray-900">
                    Remember me
                  </label>
                </div>
                
                <div className="text-sm">
                  <Link
                    to="/forgot-password"
                    className="font-semibold text-indigo-600 hover:text-indigo-500"
                  >
                    Forgot password?
                  </Link>
                </div>
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
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </button>
              </div>
            </fieldset>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default LoginForm;