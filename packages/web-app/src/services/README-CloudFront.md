# CloudFront Cookie Integration with Firebase SDK v10

## Overview

This documentation covers the CloudFront cookie integration system that works seamlessly with the Firebase SDK v10 authentication system. CloudFront signed cookies are used to provide secure access to CDN resources for authenticated users.

## Architecture

### Core Components

1. **`cloudFrontAuth.ts`** - Main CloudFront cookie management service
2. **`authService.ts`** - Enhanced with CloudFront integration hooks  
3. **`AuthContext.tsx`** - Provides context-level CloudFront functions
4. **`Login.tsx`** - Simplified login flow with automatic CloudFront handling
5. **`cloudFrontTestUtils.ts`** - Development and debugging utilities

### Integration Flow

```mermaid
graph TD
    A[User Logs In] --> B[authService.signIn()]
    B --> C[Firebase Auth Success]
    C --> D[ensureCloudFrontAccess()]
    D --> E[Firebase Function Call]
    E --> F[CloudFront Cookies Set]
    F --> G[Periodic Refresh Started]
    
    H[Auth State Change] --> I[onAuthStateChanged()]
    I --> J{User Signed In?}
    J -->|Yes| D
    J -->|No| K[resetCloudFrontAccess()]
    K --> L[Clear Cookies & Timers]
```

## Key Features

### Automatic Cookie Management
- **Lifecycle Management**: Cookies are automatically managed based on Firebase auth state
- **Automatic Refresh**: Cookies are refreshed before expiry (5-minute buffer)
- **Cleanup on Logout**: Cookies are properly cleared when users sign out
- **Error Resilience**: Authentication continues to work even if CloudFront cookies fail

### Cross-Environment Support  
- **Development Mode**: CloudFront cookies are skipped for localhost development
- **Production Mode**: Full CloudFront integration with proper domain scoping
- **Emulator Support**: Works with Firebase Auth emulator

### Enhanced Error Handling
- **Base64 Padding Fixes**: Handles common CloudFront cookie padding issues
- **Retry Logic**: Failed cookie requests don't prevent authentication
- **Detailed Logging**: Comprehensive logging for debugging and monitoring

## API Reference

### Core Functions

#### `ensureCloudFrontAccess(): Promise<void>`
Ensures CloudFront cookies are set and valid for the current authenticated user.
- Checks authentication status before attempting cookie retrieval
- Handles cookie expiry and refresh logic
- Skips in development mode (localhost)

#### `resetCloudFrontAccess(): void`
Clears all CloudFront cookies and resets internal state.
- Called automatically on logout
- Clears browser cookies with proper domain scoping
- Stops periodic refresh timers

#### `getCloudFrontCookies(): CloudFrontCookies`
Returns current CloudFront cookies from the browser.
- Filters and validates CloudFront-specific cookies
- Handles base64 padding corrections
- Provides policy decoding and expiry information

### Enhanced Auth Service Methods

#### `authService.signIn(email, password)`
Enhanced to automatically set up CloudFront cookies after successful login.

#### `authService.signOut()`
Enhanced to clean up CloudFront cookies before signing out.

### Context Integration

#### `AuthContext`
Provides CloudFront functions through the auth context:
```typescript
const { ensureCloudFrontAccess, resetCloudFrontAccess } = useAuth();
```

## Development Tools

### Console Helpers (Development Mode Only)

In development mode, CloudFront testing utilities are automatically loaded:

```javascript
// Check current CloudFront status
CloudFrontTest.log();

// Run full integration test
await CloudFrontTest.test();

// Get current status object
CloudFrontTest.status();

// Force refresh cookies and test
await CloudFrontTest.refresh();

// Get current cookies
CloudFrontTest.cookies();
```

### Test Utilities

The `cloudFrontTestUtils.ts` module provides comprehensive testing functions:

- **`testCloudFrontIntegration()`** - Full integration test with detailed results
- **`getCloudFrontStatus()`** - Quick status check
- **`refreshAndTestCloudFront()`** - Force refresh and test
- **`logCloudFrontStatus()`** - Console logging helper

## Configuration

### Environment Variables

The system uses the existing Firebase configuration. CloudFront cookie generation is handled by Firebase Functions with proper namespacing via `VITE_FIREBASE_NAMESPACE`.

### Cookie Settings

- **Domain**: `.expansemarketing.com` (production) or none (localhost)
- **Path**: `/`
- **Secure**: `true` (production only)
- **SameSite**: `none` (production) or default (localhost)

## Monitoring and Debugging

### Logging

The system provides comprehensive logging:
- Authentication state changes
- Cookie setting/clearing operations
- Error conditions with user context
- Policy expiry information
- Refresh cycle status

### Common Debug Commands

```javascript
// Check if user is authenticated and has cookies
CloudFrontTest.log();

// Get detailed integration status
const result = await CloudFrontTest.test();
console.log(result);

// Check cookie expiry
const cookies = CloudFrontTest.cookies();
// Policy contains expiry information when decoded
```

### Error Scenarios

1. **User Not Authenticated**: CloudFront operations are skipped gracefully
2. **Firebase Function Failure**: Error logged, authentication continues
3. **Cookie Setting Failure**: Logged with user context, doesn't break auth
4. **Expired Cookies**: Automatic refresh triggered
5. **Invalid Base64 Padding**: Automatic correction applied

## Migration Notes

### Changes from Previous Implementation

1. **Centralized Integration**: CloudFront logic moved from Login component to authService
2. **Enhanced Error Handling**: Better resilience and logging
3. **Automatic Lifecycle Management**: Auth state changes trigger cookie management
4. **Development Tools**: Built-in testing and debugging utilities
5. **TypeScript Support**: Full type definitions for all CloudFront operations

### Breaking Changes

None. The integration maintains backward compatibility while enhancing functionality.

## Best Practices

### For Developers

1. **Use Auth Context**: Access CloudFront functions through `useAuth()` context
2. **Don't Manual Management**: Let the system handle cookie lifecycle automatically  
3. **Test in Development**: Use `CloudFrontTest` utilities to verify integration
4. **Monitor Logs**: Watch console for CloudFront-related messages
5. **Handle Gracefully**: Don't make features depend on CloudFront cookies working

### For Debugging

1. **Check Authentication First**: CloudFront cookies require authenticated users
2. **Verify Environment**: Different behavior in development vs production
3. **Use Test Utilities**: Built-in helpers provide detailed diagnostics
4. **Monitor Network Tab**: Watch for Firebase Function calls
5. **Check Cookie Storage**: Verify cookies are set with correct domains/paths

## Security Considerations

- CloudFront cookies contain signed policies with expiration times
- Cookies are domain-scoped to prevent unauthorized access
- Authentication is required before cookie generation
- Automatic cleanup prevents cookie leakage after logout
- Base64 handling prevents injection attacks

## Performance Impact

- Minimal overhead - cookies checked/refreshed only when needed
- Automatic refresh prevents expired cookie scenarios
- Development mode skipping eliminates localhost performance impact
- Periodic refresh uses 5-minute intervals to balance security and performance

## Future Enhancements

- Consider implementing exponential backoff for failed cookie requests
- Add metrics collection for CloudFront cookie success rates
- Implement cookie preloading for faster CDN resource access
- Add support for multiple CloudFront distributions if needed