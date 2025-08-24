import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';

/**
 * Logout component that handles user sign out
 * Clears authentication state and redirects to login page
 */
const Logout: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const performLogout = async () => {
      try {
        // Log the logout action
        console.log('Logging out user:', user?.email);
        
        // Sign out from Firebase
        await authService.signOut();
        
        // Clear any local storage or session storage if needed
        localStorage.removeItem('rememberMe');
        sessionStorage.clear();
        
        // Small delay to ensure state updates
        setTimeout(() => {
          // Redirect to login page
          navigate('/auth', { 
            replace: true,
            state: { message: 'You have been successfully logged out.' }
          });
        }, 100);
        
      } catch (error) {
        console.error('Error during logout:', error);
        // Even if there's an error, still redirect to login
        navigate('/auth', { replace: true });
      }
    };

    performLogout();
  }, [navigate, user]);

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

        {/* Logout Status Container */}
        <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-md">
            {/* Card Background with enhanced styling */}
            <div className="bg-white/80 backdrop-blur-lg shadow-xl rounded-2xl border border-white/20 p-8 relative overflow-hidden">
              {/* Subtle card accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
              
              {/* Content */}
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-6">
                  <svg 
                    className="animate-spin w-8 h-8 text-purple-600" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24"
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
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  Signing out...
                </h2>
                
                <p className="text-gray-600 mb-6">
                  You are being signed out of your account.
                </p>
                
                <div className="inline-flex items-center px-4 py-3 bg-purple-50 border border-purple-200 rounded-lg text-purple-800 text-sm font-medium">
                  <svg 
                    className="animate-pulse w-4 h-4 mr-2" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                  </svg>
                  Processing logout...
                </div>
              </div>
            </div>
            
            {/* Additional Info */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Please wait while we securely sign you out
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

export default Logout;