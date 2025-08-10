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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Signing out...
          </h2>
          <div className="mt-4">
            <div className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100">
              <svg 
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-700" 
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
              Please wait...
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            You are being signed out of your account.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Logout;