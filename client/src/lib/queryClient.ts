import { QueryClient } from '@tanstack/react-query';

// Create a client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Default fetcher function for queries
export const getQueryFn = (options?: { on401?: 'throw' | 'returnNull' }) => {
  return async ({ queryKey }: { queryKey: string[] }) => {
    const key = Array.isArray(queryKey) ? queryKey[0] : queryKey;
    
    console.log(`[DEBUG] Fetching data from: ${key}`);
    
    try {
      const response = await fetch(key);
      
      console.log(`[DEBUG] Response status: ${response.status}`);
      
      if (!response.ok) {
        if (response.status === 401 && options?.on401 === 'returnNull') {
          console.log('[DEBUG] Returning null due to 401 status');
          return null;
        }
        
        const message = await response.text().catch(() => 'An error occurred');
        console.error(`[DEBUG] Error response: ${message}`);
        throw new Error(message || 'An error occurred while fetching data');
      }
      
      const data = await response.json();
      console.log(`[DEBUG] Successfully fetched data: ${JSON.stringify(data).substring(0, 100)}...`);
      return data;
    } catch (error) {
      console.error('[DEBUG] Fetch error:', error);
      throw error;
    }
  };
};

// Helper for API requests
export async function apiRequest(
  method: string,
  url: string,
  data?: any
): Promise<Response> {
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  return fetch(url, options);
}