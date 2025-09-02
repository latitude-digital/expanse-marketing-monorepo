/**
 * Determines the correct Firebase function prefix based on the current environment.
 * 
 * - Production (survey.expansemarketing.com) uses 'prod-' prefix
 * - Staging (survey.staging.expansemarketing.com) uses 'staging-' prefix
 * - Local development uses 'staging-' prefix by default
 */
export function getFirebaseFunctionPrefix(): string {
  const hostname = window.location.hostname;
  
  // Production environment
  if (hostname === 'survey.expansemarketing.com') {
    return 'prod-';
  }
  
  // Staging environment
  if (hostname === 'survey.staging.expansemarketing.com') {
    return 'staging-';
  }
  
  // Local development or other environments default to staging
  return 'staging-';
}

/**
 * Helper function to get the full function name with the correct prefix
 */
export function getFirebaseFunctionName(functionName: string): string {
  return `${getFirebaseFunctionPrefix()}${functionName}`;
}