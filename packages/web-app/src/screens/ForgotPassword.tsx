/**
 * ForgotPassword Screen - Password Reset Request Page
 * 
 * This screen provides a dedicated page for password reset requests.
 * It uses the ForgotPasswordForm component and handles navigation.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import ForgotPasswordForm from '../components/auth/ForgotPasswordForm';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    // Success is handled within the form component with messaging
    // User can navigate back to login when ready
  };

  const handleError = (error: string) => {
    // Error is handled within the form component with messaging
    console.error('Password reset request failed:', error);
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="mx-auto h-12 w-12 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl shadow-lg flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-gray-900">
          Reset your password
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter your email to receive reset instructions
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
        <div className="bg-white px-6 py-12 shadow-sm sm:rounded-lg sm:px-12">
          <ForgotPasswordForm
            onSuccess={handleSuccess}
            onError={handleError}
            returnPath="/login"
          />
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;