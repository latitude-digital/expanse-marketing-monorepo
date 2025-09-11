import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface LogoutButtonProps {
  className?: string;
  variant?: 'button' | 'link';
  showIcon?: boolean;
  children?: React.ReactNode;
}

/**
 * Logout button component that can be used anywhere in the app
 * Provides both button and link variants
 */
const LogoutButton: React.FC<LogoutButtonProps> = ({ 
  className = '', 
  variant = 'button',
  showIcon = true,
  children 
}) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/logout');
  };

  // Don't render if user is not logged in
  if (!currentUser) {
    return null;
  }

  const icon = showIcon ? (
    <svg 
      className="w-4 h-4 mr-2" 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
      />
    </svg>
  ) : null;

  if (variant === 'link') {
    return (
      <a
        href="/logout"
        onClick={handleLogout}
        className={`inline-flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 ${className}`}
        data-testid="logout-link"
      >
        {icon}
        {children || 'Sign Out'}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${className}`}
      data-testid="logout-button"
    >
      {icon}
      {children || 'Sign Out'}
    </button>
  );
};

export default LogoutButton;
