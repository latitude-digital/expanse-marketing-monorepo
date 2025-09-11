import { httpsCallable, HttpsCallableResult } from 'firebase/functions';
import functions from './functions';

// Get the namespace from environment variable
const namespace = import.meta.env.VITE_FIREBASE_NAMESPACE || 'prod';

console.log('=== Firebase Functions Namespace ===');
console.log('Using namespace:', namespace);
console.log('====================================');

/**
 * Create a namespaced callable function
 * @param functionName The base function name without namespace
 * @returns A callable function with the namespace prefix
 */
export function callFunction<T = any, R = any>(functionName: string): (data?: T) => Promise<HttpsCallableResult<R>> {
  const namespacedName = `${namespace}-${functionName}`;
  console.log(`Calling namespaced function: ${namespacedName}`);
  return httpsCallable<T, R>(functions, namespacedName);
}

// Export pre-configured namespaced functions for convenience
export const setCloudFrontCookies = callFunction('setCloudFrontCookies');
// Loosen input typing to support legacy eventId/bypass callers
export const checkSurveyLimit = callFunction<
  { surveyId?: string; eventId?: string; deviceId?: string; bypass?: string },
  { canSubmit: boolean; responseCount: number; maxResponses: number; remaining: number }
>('checkSurveyLimit');
export const validateSurveyLimit = callFunction<
  { surveyId?: string; eventId?: string; deviceId?: string; responseData?: any; bypass?: string },
  { success: boolean; responseId: string; message: string }
>('validateSurveyLimit');
