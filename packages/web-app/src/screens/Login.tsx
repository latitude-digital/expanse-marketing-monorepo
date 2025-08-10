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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 
      py-4 sm:py-8 lg:py-12 
      px-4 sm:px-6 lg:px-8
      safe-area-inset-top safe-area-inset-bottom">
      <LoginForm 
        onSuccess={handleLoginSuccess}
        onError={handleLoginError}
      />
    </div>
  );
}

export default SigninScreen;