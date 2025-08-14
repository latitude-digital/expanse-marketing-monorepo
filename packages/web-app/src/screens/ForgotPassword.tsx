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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-40"
           style={{
             backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e2e8f0' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
           }}></div>
      
      {/* Main Content */}
      <div className="relative min-h-screen flex flex-col justify-between py-8 sm:py-12">
        {/* Header with Branding */}
        <header className="text-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto">
            {/* Logo Placeholder */}
            <div className="mb-8">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h1 className="mt-4 text-2xl sm:text-3xl font-bold text-gray-900">
                Expanse Marketing
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Survey Platform
              </p>
            </div>
          </div>
        </header>

        {/* Reset Password Form Container */}
        <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-md">
            {/* Card Background with enhanced styling */}
            <div className="bg-white/80 backdrop-blur-lg shadow-xl rounded-2xl border border-white/20 p-8 relative overflow-hidden">
              {/* Subtle card accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-red-500"></div>
              
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-12 h-12 mx-auto bg-orange-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2 2 2 0 01-2 2 2 2 0 01-2-2m0-4a2 2 0 00-2-2v6a2 2 0 002 2zm6 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Reset your password
                </h2>
                <p className="text-gray-600">
                  Enter your email to receive reset instructions
                </p>
              </div>
              
              <ForgotPasswordForm
                onSuccess={handleSuccess}
                onError={handleError}
                returnPath="/login"
              />
            </div>
            
            {/* Additional Info */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Remember your password?{' '}
                <a href="/login" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
                  Sign in here
                </a>
              </p>
            </div>
          </div>
        </main>

        {/* Professional Footer */}
        <footer className="px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto text-center">
            <div className="border-t border-gray-200 pt-6">
              <p className="text-xs text-gray-500">
                © 2025 Latitude Digital. All rights reserved.
              </p>
              <div className="mt-2 space-x-4 text-xs">
                <a href="#" className="text-gray-500 hover:text-blue-600 transition-colors">Privacy Policy</a>
                <a href="#" className="text-gray-500 hover:text-blue-600 transition-colors">Terms of Service</a>
                <a href="#" className="text-gray-500 hover:text-blue-600 transition-colors">Support</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default ForgotPassword;