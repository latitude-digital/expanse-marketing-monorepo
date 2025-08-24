/**
 * PasswordResetForm Component - Secure Password Reset Confirmation (AUTH-012)
 * 
 * This component handles the password reset token validation and new password setting:
 * - Validates the reset token from the email link
 * - Includes password strength indicator and validation
 * - Implements confirm password field with real-time matching
 * - Uses Firebase's confirmPasswordReset method
 * - Follows security best practices and accessibility standards
 */
import React, { useState, useRef, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import { newPasswordValidationSchema, type NewPasswordValidationValues } from '../../schemas/authSchemas';
import AuthAlert from './AuthAlert';

interface PasswordResetFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  returnPath?: string; // Path to redirect after successful reset
}

// Password strength indicator component
const PasswordStrengthIndicator: React.FC<{ password: string }> = ({ password }) => {
  const getStrength = (pwd: string): { score: number; label: string; color: string } => {
    if (!pwd) return { score: 0, label: 'Enter a password', color: 'gray' };
    
    let score = 0;
    const checks = [
      /[a-z]/.test(pwd), // lowercase
      /[A-Z]/.test(pwd), // uppercase
      /\d/.test(pwd),    // numbers
      /[@$!%*?&]/.test(pwd), // special chars
      pwd.length >= 8,   // min length
      pwd.length >= 12   // good length
    ];
    
    score = checks.filter(Boolean).length;
    
    if (score <= 2) return { score, label: 'Weak', color: 'red' };
    if (score <= 4) return { score, label: 'Fair', color: 'yellow' };
    if (score <= 5) return { score, label: 'Good', color: 'blue' };
    return { score, label: 'Strong', color: 'green' };
  };

  const strength = getStrength(password);
  const percentage = (strength.score / 6) * 100;

  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex items-center justify-between text-xs sm:text-sm mb-1">
        <span className="text-gray-600">Password strength:</span>
        <span className={`font-medium text-${strength.color}-600`}>
          {strength.label}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 bg-${strength.color}-500`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={strength.score}
          aria-valuemin={0}
          aria-valuemax={6}
          aria-label={`Password strength: ${strength.label}`}
        />
      </div>
      <div className="mt-1 text-xs text-gray-600">
        Requirements: 8+ characters, uppercase, lowercase, number, special character
      </div>
    </div>
  );
};

const PasswordResetForm: React.FC<PasswordResetFormProps> = ({ 
  onSuccess, 
  onError,
  returnPath = '/login'
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [tokenValidated, setTokenValidated] = useState(false);
  
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Extract token from URL parameters
  const resetToken = searchParams.get('oobCode') || '';
  const mode = searchParams.get('mode') || '';
  
  // Refs for focus management
  const formRef = useRef<HTMLFormElement>(null);
  const passwordFieldRef = useRef<HTMLInputElement>(null);
  const confirmPasswordFieldRef = useRef<HTMLInputElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  
  // Live region ref for screen reader announcements
  const liveRegionRef = useRef<HTMLDivElement>(null);

  // Validate token on component mount
  useEffect(() => {
    const validateToken = async () => {
      // Check if this is a password reset request
      if (mode !== 'resetPassword') {
        setError('Invalid password reset link. Please request a new password reset.');
        return;
      }
      
      if (!resetToken) {
        setError('Invalid password reset link. Please request a new password reset.');
        return;
      }
      
      // For Firebase, we don't validate the token until we try to use it
      // This prevents revealing token validity before the user submits
      setTokenValidated(true);
      
      // Focus password field after validation
      setTimeout(() => {
        if (passwordFieldRef.current) {
          passwordFieldRef.current.focus();
        }
      }, 100);
    };
    
    validateToken();
  }, [resetToken, mode]);

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

  // AUTH-012: Secure password reset with token validation
  const handleSubmit = async (values: NewPasswordValidationValues) => {
    setError('');
    setSuccessMessage('');
    setIsLoading(true);
    
    // Announce loading state to screen readers
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = 'Resetting password, please wait...';
    }
    
    // Start timing for consistent response
    const startTime = Date.now();
    const minResponseTime = 800;

    try {
      // AUTH-012: Use Firebase's confirmPasswordReset with the token
      await authService.confirmPasswordReset(resetToken, values.password);
      
      // Ensure minimum response time
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < minResponseTime) {
        await new Promise(resolve => setTimeout(resolve, minResponseTime - elapsedTime));
      }
      
      setSuccessMessage('Password reset successfully! You can now sign in with your new password.');
      onSuccess?.();
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate(returnPath);
      }, 3000);
      
    } catch (error: any) {
      let secureErrorMessage = 'Unable to reset password. Please try again or request a new password reset.';
      
      // Handle specific Firebase errors with secure messaging
      if (error.code === 'auth/expired-action-code') {
        secureErrorMessage = 'This password reset link has expired. Please request a new password reset.';
      } else if (error.code === 'auth/invalid-action-code') {
        secureErrorMessage = 'This password reset link is invalid. Please request a new password reset.';
      } else if (error.code === 'auth/weak-password') {
        secureErrorMessage = 'Password is too weak. Please choose a stronger password.';
      }
      
      // Ensure minimum response time before showing error
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < minResponseTime) {
        await new Promise(resolve => setTimeout(resolve, minResponseTime - elapsedTime));
      }
      
      setError(secureErrorMessage);
      onError?.(secureErrorMessage);
      
      // Focus back to password field for retry
      setTimeout(() => {
        if (passwordFieldRef.current) {
          passwordFieldRef.current.focus();
        }
      }, 100);
    } finally {
      setIsLoading(false);
    }
  };

  const initialValues: NewPasswordValidationValues = {
    password: '',
    confirmPassword: ''
  };

  // Show error state if token is invalid
  if (!tokenValidated && error) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-4 sm:mb-6 lg:mb-8 text-center leading-tight">
          Password Reset
        </h1>
        
        <AuthAlert
          type="error"
          title="Invalid Link"
          message={error}
        />
        
        <div className="text-center">
          <Link
            to="/forgot-password"
            className="inline-block bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 px-6 rounded-md transition-colors duration-200"
          >
            Request New Password Reset
          </Link>
        </div>
        
        <div className="text-center">
          <Link
            to={returnPath}
            className="text-sm sm:text-base text-blue-700 hover:text-blue-900 underline"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

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
        validationSchema={newPasswordValidationSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched, isValid, dirty, values }) => (
          <Form 
            ref={formRef}
            className="space-y-6"
            role="main"
            aria-label="Password reset form"
          >
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-4 sm:mb-6 lg:mb-8 text-center leading-tight">
              Set New Password
            </h1>
            
            <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 text-center leading-relaxed">
              Choose a strong password for your account.
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
                title="Password Reset"
                message={successMessage}
              />
            )}

            <fieldset disabled={isLoading} className="space-y-4 sm:space-y-6">
              <legend className="sr-only">New password information</legend>

              {/* Password field with strength indicator */}
              <div className="mb-6 sm:mb-8">
                <label 
                  htmlFor="password" 
                  className="block text-gray-900 text-sm sm:text-base font-semibold mb-2 required-field"
                >
                  New Password
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
                  placeholder="Enter your new password"
                  autoComplete="new-password"
                  disabled={isLoading}
                  aria-required="true"
                  aria-invalid={errors.password && touched.password ? 'true' : 'false'}
                  aria-describedby={`password-description password-strength ${errors.password && touched.password ? 'password-error' : ''}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      confirmPasswordFieldRef.current?.focus();
                    }
                  }}
                />
                <div id="password-description" className="sr-only">
                  Enter a strong password with at least 8 characters
                </div>
                
                {/* Password strength indicator */}
                <div id="password-strength">
                  <PasswordStrengthIndicator password={values.password} />
                </div>
                
                <ErrorMessage 
                  id="password-error"
                  name="password" 
                  component="div" 
                  className="mt-2 text-sm sm:text-base text-red-700 font-medium" 
                  role="alert"
                />
              </div>

              {/* Confirm password field */}
              <div className="mb-6 sm:mb-8">
                <label 
                  htmlFor="confirmPassword" 
                  className="block text-gray-900 text-sm sm:text-base font-semibold mb-2 required-field"
                >
                  Confirm New Password
                  <abbr className="text-red-600 ml-1" aria-label="required" title="This field is required">*</abbr>
                </label>
                <Field
                  ref={confirmPasswordFieldRef}
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  className={`w-full 
                    px-4 sm:px-5 
                    py-3 sm:py-4 
                    border-2 rounded-md font-medium
                    text-base sm:text-lg
                    focus:outline-none focus:ring-4 focus:ring-blue-500 focus:border-blue-600
                    transition-all duration-200 text-gray-900 placeholder-gray-500
                    ${errors.confirmPassword && touched.confirmPassword
                      ? 'border-red-500 bg-red-50 focus:border-red-600 focus:ring-red-200'
                      : values.confirmPassword && values.confirmPassword === values.password
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-600 bg-white hover:border-gray-700'
                    }
                    disabled:bg-gray-100 disabled:border-gray-300 disabled:cursor-not-allowed
                  `}
                  placeholder="Confirm your new password"
                  autoComplete="new-password"
                  disabled={isLoading}
                  aria-required="true"
                  aria-invalid={errors.confirmPassword && touched.confirmPassword ? 'true' : 'false'}
                  aria-describedby={`confirm-password-description ${errors.confirmPassword && touched.confirmPassword ? 'confirm-password-error' : ''}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (isValid && dirty && !isLoading) {
                        submitButtonRef.current?.click();
                      }
                    }
                  }}
                />
                <div id="confirm-password-description" className="sr-only">
                  Re-enter your password to confirm it matches
                </div>
                
                {/* Password match indicator */}
                {values.confirmPassword && (
                  <div className="mt-2 text-sm">
                    {values.confirmPassword === values.password ? (
                      <div className="text-green-600 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Passwords match
                      </div>
                    ) : (
                      <div className="text-orange-600 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Passwords must match
                      </div>
                    )}
                  </div>
                )}
                
                <ErrorMessage 
                  id="confirm-password-error"
                  name="confirmPassword" 
                  component="div" 
                  className="mt-2 text-sm sm:text-base text-red-700 font-medium" 
                  role="alert"
                />
              </div>

              {/* Submit button */}
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
                  {isLoading ? 'Resetting Password...' : 'Reset Password'}
                </span>
              </button>
              <div id="submit-button-description" className="sr-only">
                {isLoading 
                  ? 'Please wait while we reset your password'
                  : isValid && dirty 
                    ? 'Click to reset your password' 
                    : 'Complete all fields with valid passwords to continue'
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
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default PasswordResetForm;