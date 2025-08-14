// Session timeout configuration
export const SESSION_CONFIG = {
  // Timeout duration in minutes
  TIMEOUT_MINUTES: {
    development: parseInt(import.meta.env.VITE_SESSION_TIMEOUT_MINUTES) || 5,   // 5 minutes for development/testing
    production: 30    // 30 minutes for production
  },
  
  // Warning time before logout (in minutes)
  WARNING_MINUTES: parseInt(import.meta.env.VITE_SESSION_WARNING_MINUTES) || 1,
  
  // How often to check session status (in milliseconds)
  CHECK_INTERVAL_MS: 1000,
  
  // Routes where session timeout is disabled
  DISABLED_ROUTES: [
    '/login',
    '/logout', 
    '/forgot-password',
    '/reset-password',
    '/welcome',
    '/auth'
  ],
  
  // Public routes that don't require authentication
  PUBLIC_ROUTES: [
    '/s/', // Survey routes are public
    '/ford/',
    '/bronco/',
    '/thanks'
  ]
} as const;

export function getSessionTimeout(): number {
  const env = process.env.NODE_ENV || 'development';
  return SESSION_CONFIG.TIMEOUT_MINUTES[env as keyof typeof SESSION_CONFIG.TIMEOUT_MINUTES] || 
         SESSION_CONFIG.TIMEOUT_MINUTES.development;
}

export function isPublicRoute(pathname: string): boolean {
  return SESSION_CONFIG.PUBLIC_ROUTES.some(route => pathname.startsWith(route));
}

export function isDisabledRoute(pathname: string): boolean {
  return SESSION_CONFIG.DISABLED_ROUTES.some(route => pathname.startsWith(route));
}

export function getDisabledRoutes(): string[] {
  return SESSION_CONFIG.DISABLED_ROUTES;
}