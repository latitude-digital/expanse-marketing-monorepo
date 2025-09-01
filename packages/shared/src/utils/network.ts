/**
 * Shared network utilities for handling uploads and API communication
 */

/**
 * Network error handling with specific messages
 */
export function handleNetworkError(error: unknown): string {
  // Check if we're offline
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return "No internet connection. Please check your network and try again.";
  }
  
  // Type guard for error with properties
  const err = error as { name?: string; code?: string; status?: number; message?: string };
  
  if (err.name === 'NetworkError' || err.code === 'NETWORK_ERROR') {
    return "Network error. Please check your connection and try again.";
  }
  
  if (err.status === 413) {
    return "File too large for upload. Please choose a smaller file.";
  }
  
  if (err.status === 408) {
    return "Upload timeout. Please try again.";
  }
  
  if (err.status === 404) {
    return "Service not found. Please contact support.";
  }
  
  if (err.status && err.status >= 500) {
    return "Server error. Please try again later.";
  }
  
  if (err.message) {
    return err.message;
  }
  
  return "An error occurred. Please try again.";
}

/**
 * Upload with retry logic and exponential backoff
 */
export async function uploadWithRetry<T>(
  uploadFn: () => Promise<T>, 
  maxRetries: number = 3
): Promise<T> {
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await uploadFn();
    } catch (error) {
      lastError = error;
      
      // Type guard for error with status
      const err = error as { status?: number };
      
      // Don't retry on client errors (400-499)
      if (err.status && err.status >= 400 && err.status < 500) {
        throw error;
      }
      
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        console.log(`Upload attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

/**
 * Check if the error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  const err = error as { name?: string; code?: string; message?: string };
  
  if (!navigator.onLine) {
    return true;
  }
  
  if (err.name === 'NetworkError' || err.code === 'NETWORK_ERROR') {
    return true;
  }
  
  if (err.message && err.message.toLowerCase().includes('network')) {
    return true;
  }
  
  return false;
}

/**
 * Check if the error is a timeout error
 */
export function isTimeoutError(error: unknown): boolean {
  const err = error as { name?: string; code?: string; status?: number; message?: string };
  
  if (err.name === 'TimeoutError' || err.code === 'TIMEOUT_ERROR') {
    return true;
  }
  
  if (err.status === 408) {
    return true;
  }
  
  if (err.message && err.message.toLowerCase().includes('timeout')) {
    return true;
  }
  
  return false;
}

/**
 * Create a timeout promise that rejects after specified milliseconds
 */
export function createTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

/**
 * Batch API requests with concurrency limit
 */
export async function batchRequests<T, R>(
  items: T[],
  processFn: (item: T) => Promise<R>,
  concurrencyLimit: number = 3
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += concurrencyLimit) {
    const batch = items.slice(i, i + concurrencyLimit);
    const batchResults = await Promise.all(batch.map(processFn));
    results.push(...batchResults);
  }
  
  return results;
}