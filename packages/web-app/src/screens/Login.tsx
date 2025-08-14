import { useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from '../contexts/AuthContext';
import LoginForm from '../components/auth/LoginForm';

function SigninScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser, signOut, loading: authLoading, resetCloudFrontAccess } = useAuth();
  
  useEffect(() => {
    const handleLogout = async () => {
      if (searchParams.has('logout')) {
        setSearchParams({});
        try {
          await signOut();
          resetCloudFrontAccess();
          let newLocation = [...location.pathname.split('/')];
          newLocation.pop();
          newLocation.pop();
          navigate(newLocation.join('/'));
        } catch (error) {
          console.error('Logout error:', error);
        }
      }
    };
    handleLogout();
  }, [searchParams, setSearchParams, location.pathname, navigate, signOut]);
  
  useEffect(() => {
    if (!authLoading && currentUser) {
      console.log('User is already signed in:', currentUser.email);
      
      // Check for redirect parameter
      const redirectParam = searchParams.get('r');
      let redirectPath = '/';
      
      if (redirectParam) {
        try {
          redirectPath = decodeURIComponent(redirectParam);
        } catch (e) {
          console.error('Invalid redirect parameter:', e);
        }
      } else if (location.pathname === '/auth' || location.pathname === '/welcome' || location.pathname === '/login') {
        redirectPath = '/';
      } else if (location.pathname.endsWith('/login')) {
        // Legacy support
        redirectPath = location.pathname.substring(0, location.pathname.lastIndexOf('/login')) || '/';
      }
      
      navigate(redirectPath, { replace: true });
    }
  }, [currentUser, authLoading, navigate, location.pathname, searchParams]);

  const handleLoginSuccess = async () => {
    // AUTH-009: CloudFront cookies are now automatically handled in authService.signIn
    // No need for manual cookie management here
    console.log('Login successful, checking for redirect parameter');
    
    // Check for redirect parameter in URL
    const redirectParam = searchParams.get('r');
    let redirectPath = '/';
    
    if (redirectParam) {
      // Decode and use the redirect parameter
      try {
        redirectPath = decodeURIComponent(redirectParam);
        console.log(`Redirecting to saved path: ${redirectPath}`);
      } catch (e) {
        console.error('Invalid redirect parameter:', e);
        redirectPath = '/';
      }
    } else if (location.pathname === '/auth' || location.pathname === '/welcome' || location.pathname === '/login') {
      // Default redirects for standard login routes
      redirectPath = '/';
    } else if (location.pathname.endsWith('/login')) {
      // Legacy support: Remove '/login' from the path to go to parent
      redirectPath = location.pathname.substring(0, location.pathname.lastIndexOf('/login')) || '/';
    }
    
    console.log(`Redirecting from ${location.pathname} to ${redirectPath}`);
    navigate(redirectPath, { replace: true });
  };

  const handleLoginError = (error: string) => {
    console.error('Login error handled by LoginForm:', error);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600">Checking authentication...</div>
        </div>
      </div>
    );
  }

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

        {/* Login Form Container */}
        <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-md">
            {/* Card Background with enhanced styling */}
            <div className="bg-white/80 backdrop-blur-lg shadow-xl rounded-2xl border border-white/20 p-8 relative overflow-hidden">
              {/* Subtle card accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
              
              <LoginForm 
                onSuccess={handleLoginSuccess}
                onError={handleLoginError}
              />
            </div>
            
            {/* Additional Info */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Secure enterprise authentication for Ford, Lincoln, and partner brands
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
}

export default SigninScreen;