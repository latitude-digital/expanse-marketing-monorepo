import { httpsCallable, HttpsCallableResult } from 'firebase/functions';
import functions from './functions';

/**
 * Create a callable function
 * @param functionName The function name
 * @returns A callable function
 */
export function callFunction<T = any, R = any>(functionName: string): (data?: T) => Promise<HttpsCallableResult<R>> {
  console.log(`Calling function: ${functionName}`);
  return httpsCallable<T, R>(functions, functionName);
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
