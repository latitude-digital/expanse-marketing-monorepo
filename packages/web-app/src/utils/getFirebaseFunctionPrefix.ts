/**
 * No longer adds prefixes - we use separate Firebase projects for staging and prod
 * 
 * @deprecated No longer needed - functions are called without prefixes
 */
export function getFirebaseFunctionPrefix(): string {
  return '';
}

/**
 * Helper function to get the function name (no longer adds prefix)
 */
export function getFirebaseFunctionName(functionName: string): string {
  return functionName;
}