import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

/**
 * ProtectedRoute component that prevents rendering of protected content
 * until authentication is verified. Redirects to login if not authenticated.
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false 
}) => {
  const { currentUser, isAdmin, loading } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
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
            Checking authentication...
          </div>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login with return URL
  if (!currentUser) {
    // Encode the current path as a redirect parameter
    const redirectTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?r=${redirectTo}`} replace />;
  }

  // Check admin role if required
  // TODO: RBAC will handle admin role checking later
  // Temporarily allowing all authenticated users to access admin routes
  /*
  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <h2 className="text-red-800 text-lg font-semibold mb-2">Access Denied</h2>
            <p className="text-red-700">You don't have permission to access this page. Administrator privileges required.</p>
            <div className="mt-4">
              <button
                onClick={() => window.history.back()}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 mr-2"
              >
                Go Back
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  */

  // User is authenticated and has required permissions, render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;