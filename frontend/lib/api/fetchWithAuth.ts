import { refreshTokens, clearTokens } from '@/lib/auth/authUtils';

// Track if a refresh is already in progress
let isRefreshing = false;
// Queue of requests to retry after token refresh
let failedRequestsQueue: Array<() => void> = [];

// Process all queued requests with the new token
const processQueue = (error: Error | null) => {
  failedRequestsQueue.forEach(callback => callback());
  failedRequestsQueue = [];
};

export async function fetchWithAuth(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  // First attempt
  const response = await fetch(url, {
    ...options,
    credentials: 'include', // Always include cookies
  });

  // If the request was successful or not a 401, return it
  if (response.ok || response.status !== 401) {
    return response;
  }

  // If we get here, we have a 401 Unauthorized error
  
  // Create a promise that will resolve when the token is refreshed
  const originalRequest = (): Promise<Response> => fetch(url, {
    ...options,
    credentials: 'include',
  });

  // If a refresh is already in progress, queue this request
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedRequestsQueue.push(() => {
        originalRequest().then(resolve).catch(reject);
      });
    });
  }

  // Start the refresh process
  isRefreshing = true;

  try {
    // Attempt to refresh the token
    console.log('Refreshing token');
    const newToken = await refreshTokens();
    
    if (!newToken) {
      // If refresh failed, clear the queue with an error
      processQueue(new Error('Token refresh failed'));
      
      // Clear the cookies from client side
      await clearTokens();

      // Return a special response with a 401 status and a flag that can be checked by the caller
      // The component using this function can handle the redirect
      return new Response(JSON.stringify({ 
        error: 'Authentication failed',
        requiresLogin: true 
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Refresh succeeded, process all queued requests
    processQueue(null);
    
    // Retry the original request with the new token
    return originalRequest();
  } catch (error) {
    // If refresh fails, clear the queue and rethrow
    console.error('Error refreshing token:', error);
    processQueue(error instanceof Error ? error : new Error('Unknown error'));
    throw error;
  } finally {
    isRefreshing = false;
  }
} 