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
    
    const response = await fetch(key);
    
    if (!response.ok) {
      if (response.status === 401 && options?.on401 === 'returnNull') {
        return null;
      }
      
      const message = await response.text().catch(() => 'An error occurred');
      throw new Error(message || 'An error occurred while fetching data');
    }
    
    return response.json();
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